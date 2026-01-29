import { useState, useEffect, useCallback } from 'react';
import { format, subDays, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';
import { Calendar as CalendarIcon, FileBarChart2, Users, FileText, Banknote, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { ReportCard } from '@/components/reports/ReportCard';
import {
  formatLeadReport,
  formatApplicationReport,
  formatDisbursalReport,
  formatRejectionReport,
  formatPipelineReport,
  calculateTotalDisbursed,
  calculateAverageTAT,
} from '@/lib/report-generators';
import type { ExportData } from '@/lib/export-utils';
import { toast } from 'sonner';

type DatePreset = '7d' | '30d' | '90d' | 'mtd' | 'qtd' | 'ytd' | 'custom';

const presets: { label: string; value: DatePreset }[] = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'This Month', value: 'mtd' },
  { label: 'This Quarter', value: 'qtd' },
  { label: 'This Year', value: 'ytd' },
  { label: 'Custom', value: 'custom' },
];

export function Reports() {
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('30d');
  const [isLoading, setIsLoading] = useState(true);
  
  // Report counts
  const [leadCount, setLeadCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [disbursalCount, setDisbursalCount] = useState(0);
  const [disbursalTotal, setDisbursalTotal] = useState(0);
  const [rejectionCount, setRejectionCount] = useState(0);
  const [rejectionRate, setRejectionRate] = useState(0);
  const [pipelineCount, setPipelineCount] = useState(0);
  const [avgTAT, setAvgTAT] = useState(0);

  const handlePresetChange = (preset: DatePreset) => {
    setSelectedPreset(preset);
    const today = new Date();
    
    switch (preset) {
      case '7d':
        setDateFrom(subDays(today, 7));
        setDateTo(today);
        break;
      case '30d':
        setDateFrom(subDays(today, 30));
        setDateTo(today);
        break;
      case '90d':
        setDateFrom(subDays(today, 90));
        setDateTo(today);
        break;
      case 'mtd':
        setDateFrom(startOfMonth(today));
        setDateTo(today);
        break;
      case 'qtd':
        setDateFrom(startOfQuarter(today));
        setDateTo(today);
        break;
      case 'ytd':
        setDateFrom(startOfYear(today));
        setDateTo(today);
        break;
      case 'custom':
        // Keep current dates for custom
        break;
    }
  };

  const fetchCounts = useCallback(async () => {
    setIsLoading(true);
    const fromStr = dateFrom.toISOString();
    const toStr = dateTo.toISOString();

    try {
      // Fetch lead count
      const { count: leadC } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', fromStr)
        .lte('created_at', toStr);
      setLeadCount(leadC || 0);

      // Fetch application count
      const { count: appC } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', fromStr)
        .lte('created_at', toStr);
      setApplicationCount(appC || 0);

      // Fetch disbursal data
      const { data: disbursalData } = await supabase
        .from('applications')
        .select('disbursed_amount')
        .eq('status', 'disbursed')
        .gte('disbursed_at', fromStr)
        .lte('disbursed_at', toStr);
      
      setDisbursalCount(disbursalData?.length || 0);
      const total = disbursalData?.reduce((sum, d) => sum + (d.disbursed_amount || 0), 0) || 0;
      setDisbursalTotal(total);

      // Fetch rejection count
      const { count: rejC } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected')
        .gte('rejected_at', fromStr)
        .lte('rejected_at', toStr);
      setRejectionCount(rejC || 0);
      
      // Calculate rejection rate
      if (appC && appC > 0) {
        setRejectionRate(Number(((rejC || 0) / appC * 100).toFixed(1)));
      } else {
        setRejectionRate(0);
      }

      // Fetch pipeline (active applications)
      const { data: pipelineData } = await supabase
        .from('applications')
        .select('updated_at')
        .in('status', ['submitted', 'bre_processing', 'underwriting', 'pending_approval', 'deviation']);
      
      setPipelineCount(pipelineData?.length || 0);
      
      // Calculate average TAT
      if (pipelineData && pipelineData.length > 0) {
        const today = new Date();
        const totalDays = pipelineData.reduce((sum, p) => {
          const days = Math.floor((today.getTime() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);
        setAvgTAT(Number((totalDays / pipelineData.length).toFixed(1)));
      } else {
        setAvgTAT(0);
      }
    } catch (error) {
      console.error('Error fetching report counts:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Report generation functions
  const generateLeadReport = async (): Promise<ExportData | null> => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          lead_number,
          customer_name,
          customer_phone,
          customer_email,
          product_type,
          requested_amount,
          lead_score,
          lead_temperature,
          qualification_status,
          source_channel,
          status,
          created_at,
          ro_id
        `)
        .gte('created_at', dateFrom.toISOString())
        .lte('created_at', dateTo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch RO profiles separately
      const roIds = [...new Set(data?.map(l => l.ro_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', roIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedData = data?.map(lead => ({
        ...lead,
        ro_profile: profileMap.get(lead.ro_id) || null,
      })) || [];

      toast.success(`Exporting ${enrichedData.length} leads`);
      return formatLeadReport(enrichedData);
    } catch (error) {
      console.error('Error generating lead report:', error);
      toast.error('Failed to generate lead report');
      return null;
    }
  };

  const generateApplicationReport = async (): Promise<ExportData | null> => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          application_number,
          status,
          bre_score,
          bre_decision,
          final_amount,
          final_interest_rate,
          final_tenure_months,
          final_emi,
          created_at,
          approved_at,
          ro_id,
          assigned_underwriter_id,
          lead_id
        `)
        .gte('created_at', dateFrom.toISOString())
        .lte('created_at', dateTo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch leads data
      const leadIds = [...new Set(data?.map(a => a.lead_id) || [])];
      const { data: leads } = await supabase
        .from('leads')
        .select('id, lead_number, customer_name, product_type, requested_amount')
        .in('id', leadIds);

      const leadMap = new Map(leads?.map(l => [l.id, l]) || []);

      // Fetch profiles
      const userIds = [...new Set([
        ...(data?.map(a => a.ro_id) || []),
        ...(data?.map(a => a.assigned_underwriter_id).filter(Boolean) || []),
      ])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedData = data?.map(app => ({
        ...app,
        lead: leadMap.get(app.lead_id) || { lead_number: '', customer_name: '', product_type: '', requested_amount: 0 },
        ro_profile: profileMap.get(app.ro_id) || null,
        underwriter_profile: app.assigned_underwriter_id ? profileMap.get(app.assigned_underwriter_id) || null : null,
      })) || [];

      toast.success(`Exporting ${enrichedData.length} applications`);
      return formatApplicationReport(enrichedData);
    } catch (error) {
      console.error('Error generating application report:', error);
      toast.error('Failed to generate application report');
      return null;
    }
  };

  const generateDisbursalReport = async (): Promise<ExportData | null> => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          application_number,
          final_amount,
          disbursed_amount,
          disbursed_at,
          bank_name,
          bank_account_number,
          bank_ifsc,
          ro_id,
          lead_id
        `)
        .eq('status', 'disbursed')
        .gte('disbursed_at', dateFrom.toISOString())
        .lte('disbursed_at', dateTo.toISOString())
        .order('disbursed_at', { ascending: false });

      if (error) throw error;

      // Fetch leads data
      const leadIds = [...new Set(data?.map(a => a.lead_id) || [])];
      const { data: leads } = await supabase
        .from('leads')
        .select('id, lead_number, customer_name, product_type')
        .in('id', leadIds);

      const leadMap = new Map(leads?.map(l => [l.id, l]) || []);

      // Fetch RO profiles
      const roIds = [...new Set(data?.map(a => a.ro_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', roIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedData = data?.map(d => ({
        ...d,
        lead: leadMap.get(d.lead_id) || { lead_number: '', customer_name: '', product_type: '' },
        ro_profile: profileMap.get(d.ro_id) || null,
      })) || [];

      toast.success(`Exporting ${enrichedData.length} disbursals`);
      return formatDisbursalReport(enrichedData);
    } catch (error) {
      console.error('Error generating disbursal report:', error);
      toast.error('Failed to generate disbursal report');
      return null;
    }
  };

  const generateRejectionReport = async (): Promise<ExportData | null> => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          application_number,
          bre_score,
          rejection_reason,
          rejected_at,
          rejected_by,
          lead_id
        `)
        .eq('status', 'rejected')
        .gte('rejected_at', dateFrom.toISOString())
        .lte('rejected_at', dateTo.toISOString())
        .order('rejected_at', { ascending: false });

      if (error) throw error;

      // Fetch leads data
      const leadIds = [...new Set(data?.map(a => a.lead_id) || [])];
      const { data: leads } = await supabase
        .from('leads')
        .select('id, lead_number, customer_name, product_type, requested_amount')
        .in('id', leadIds);

      const leadMap = new Map(leads?.map(l => [l.id, l]) || []);

      // Fetch profiles for rejected_by
      const rejectedByIds = [...new Set(data?.map(a => a.rejected_by).filter(Boolean) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', rejectedByIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedData = data?.map(r => ({
        ...r,
        lead: leadMap.get(r.lead_id) || { lead_number: '', customer_name: '', product_type: '', requested_amount: 0 },
        rejected_by_profile: r.rejected_by ? profileMap.get(r.rejected_by) || null : null,
      })) || [];

      toast.success(`Exporting ${enrichedData.length} rejections`);
      return formatRejectionReport(enrichedData);
    } catch (error) {
      console.error('Error generating rejection report:', error);
      toast.error('Failed to generate rejection report');
      return null;
    }
  };

  const generatePipelineReport = async (): Promise<ExportData | null> => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          application_number,
          status,
          final_amount,
          created_at,
          updated_at,
          current_approver_id,
          assigned_underwriter_id,
          lead_id
        `)
        .in('status', ['submitted', 'bre_processing', 'underwriting', 'pending_approval', 'deviation'])
        .order('updated_at', { ascending: true });

      if (error) throw error;

      // Fetch leads data
      const leadIds = [...new Set(data?.map(a => a.lead_id) || [])];
      const { data: leads } = await supabase
        .from('leads')
        .select('id, lead_number, customer_name, product_type, requested_amount')
        .in('id', leadIds);

      const leadMap = new Map(leads?.map(l => [l.id, l]) || []);

      // Fetch profiles
      const userIds = [...new Set([
        ...(data?.map(a => a.current_approver_id).filter(Boolean) || []),
        ...(data?.map(a => a.assigned_underwriter_id).filter(Boolean) || []),
      ])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedData = data?.map(p => ({
        ...p,
        lead: leadMap.get(p.lead_id) || { lead_number: '', customer_name: '', product_type: '', requested_amount: 0 },
        current_approver_profile: p.current_approver_id ? profileMap.get(p.current_approver_id) || null : null,
        assigned_underwriter_profile: p.assigned_underwriter_id ? profileMap.get(p.assigned_underwriter_id) || null : null,
      })) || [];

      toast.success(`Exporting ${enrichedData.length} pipeline items`);
      return formatPipelineReport(enrichedData);
    } catch (error) {
      console.error('Error generating pipeline report:', error);
      toast.error('Failed to generate pipeline report');
      return null;
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const dateRangeStr = `${format(dateFrom, 'dd-MMM-yyyy')}_to_${format(dateTo, 'dd-MMM-yyyy')}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileBarChart2 className="w-7 h-7 text-primary" />
          Reports & MIS
        </h1>
        <p className="text-muted-foreground mt-1">
          Download comprehensive reports for analysis and audit
        </p>
      </div>

      {/* Date Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Period:</span>
          <Select value={selectedPreset} onValueChange={(v) => handlePresetChange(v as DatePreset)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {presets.map(preset => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-[130px] justify-start text-left font-normal')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateFrom, 'dd MMM yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(date) => {
                  if (date) {
                    setDateFrom(date);
                    setSelectedPreset('custom');
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <span className="text-muted-foreground">to</span>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-[130px] justify-start text-left font-normal')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateTo, 'dd MMM yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(date) => {
                  if (date) {
                    setDateTo(date);
                    setSelectedPreset('custom');
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button variant="outline" size="sm" onClick={fetchCounts} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Report Cards */}
      <div className="grid gap-4">
        <ReportCard
          title="Lead Report"
          description="All leads with customer details and scoring"
          icon={Users}
          recordCount={leadCount}
          isLoading={isLoading}
          onGenerateReport={generateLeadReport}
          filename={`Lead_Report_${dateRangeStr}`}
        />

        <ReportCard
          title="Application Report"
          description="All applications with BRE results and offer details"
          icon={FileText}
          recordCount={applicationCount}
          isLoading={isLoading}
          onGenerateReport={generateApplicationReport}
          filename={`Application_Report_${dateRangeStr}`}
        />

        <ReportCard
          title="Disbursal Report"
          description="Disbursed loans with bank and amount details"
          icon={Banknote}
          recordCount={disbursalCount}
          additionalInfo={`Total: ${formatCurrency(disbursalTotal)}`}
          isLoading={isLoading}
          onGenerateReport={generateDisbursalReport}
          filename={`Disbursal_Report_${dateRangeStr}`}
        />

        <ReportCard
          title="Rejection Analysis"
          description="Rejected applications with reasons"
          icon={XCircle}
          recordCount={rejectionCount}
          additionalInfo={`Rejection Rate: ${rejectionRate}%`}
          isLoading={isLoading}
          onGenerateReport={generateRejectionReport}
          filename={`Rejection_Report_${dateRangeStr}`}
        />

        <ReportCard
          title="Pipeline Report"
          description="Active applications with TAT tracking"
          icon={RefreshCw}
          recordCount={pipelineCount}
          additionalInfo={`Avg TAT: ${avgTAT} days`}
          isLoading={isLoading}
          onGenerateReport={generatePipelineReport}
          filename={`Pipeline_Report_${format(new Date(), 'dd-MMM-yyyy')}`}
        />
      </div>
    </div>
  );
}
