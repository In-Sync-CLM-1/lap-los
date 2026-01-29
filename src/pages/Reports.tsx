import { useState, useEffect, useCallback } from 'react';
import { format, subDays, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';
import { Calendar as CalendarIcon, FileBarChart2, Users, FileText, Banknote, XCircle, RefreshCw, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { exportToCSV, exportToExcel, type ExportData } from '@/lib/export-utils';
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

const PRODUCT_LABELS: Record<string, string> = {
  business_loan: 'Business Loan',
  personal_loan: 'Personal Loan',
  stpl: 'STPL',
  po_finance: 'PO Finance',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  disbursed: 'bg-emerald-100 text-emerald-800',
  submitted: 'bg-purple-100 text-purple-800',
  underwriting: 'bg-orange-100 text-orange-800',
  pending_approval: 'bg-amber-100 text-amber-800',
  deviation: 'bg-pink-100 text-pink-800',
};

export function Reports() {
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('30d');
  const [activeTab, setActiveTab] = useState('leads');
  
  // Data states
  const [leads, setLeads] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [disbursals, setDisbursals] = useState<any[]>([]);
  const [rejections, setRejections] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<any[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const fromStr = dateFrom.toISOString();
    const toStr = dateTo.toISOString();

    try {
      // Fetch leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', fromStr)
        .lte('created_at', toStr)
        .order('created_at', { ascending: false });
      setLeads(leadsData || []);

      // Fetch applications with lead data
      const { data: appsData } = await supabase
        .from('applications')
        .select(`
          *,
          leads!inner(lead_number, customer_name, product_type, requested_amount)
        `)
        .gte('created_at', fromStr)
        .lte('created_at', toStr)
        .order('created_at', { ascending: false });
      setApplications(appsData || []);

      // Fetch disbursals
      const { data: disbData } = await supabase
        .from('applications')
        .select(`
          *,
          leads!inner(lead_number, customer_name, product_type)
        `)
        .eq('status', 'disbursed')
        .gte('disbursed_at', fromStr)
        .lte('disbursed_at', toStr)
        .order('disbursed_at', { ascending: false });
      setDisbursals(disbData || []);

      // Fetch rejections
      const { data: rejData } = await supabase
        .from('applications')
        .select(`
          *,
          leads!inner(lead_number, customer_name, product_type, requested_amount)
        `)
        .eq('status', 'rejected')
        .gte('rejected_at', fromStr)
        .lte('rejected_at', toStr)
        .order('rejected_at', { ascending: false });
      setRejections(rejData || []);

      // Fetch pipeline (active applications)
      const { data: pipeData } = await supabase
        .from('applications')
        .select(`
          *,
          leads!inner(lead_number, customer_name, product_type, requested_amount)
        `)
        .in('status', ['submitted', 'bre_processing', 'underwriting', 'pending_approval', 'deviation'])
        .order('updated_at', { ascending: true });
      setPipeline(pipeData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter functions
  const filterData = (data: any[], type: string) => {
    return data.filter(item => {
      const searchMatch = searchTerm === '' || 
        (type === 'leads' 
          ? item.lead_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.customer_phone?.includes(searchTerm)
          : item.application_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.leads?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.leads?.lead_number?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const productMatch = productFilter === 'all' || 
        (type === 'leads' ? item.product_type === productFilter : item.leads?.product_type === productFilter);
      
      const statusMatch = statusFilter === 'all' || item.status === statusFilter;
      
      return searchMatch && productMatch && statusMatch;
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd MMM yyyy');
  };

  // Export functions
  const exportLeads = () => {
    const data = filterData(leads, 'leads');
    const exportData: ExportData = {
      headers: ['Lead No', 'Customer', 'Phone', 'Product', 'Amount', 'Score', 'Temperature', 'Status', 'Source', 'Created'],
      rows: data.map(l => [
        l.lead_number,
        l.customer_name,
        l.customer_phone,
        PRODUCT_LABELS[l.product_type] || l.product_type,
        l.requested_amount,
        l.lead_score || 0,
        l.lead_temperature || 'N/A',
        l.status,
        l.source_channel || 'Physical',
        formatDate(l.created_at)
      ])
    };
    return exportData;
  };

  const exportApplications = () => {
    const data = filterData(applications, 'applications');
    const exportData: ExportData = {
      headers: ['App No', 'Lead No', 'Customer', 'Product', 'Requested', 'Final Amount', 'BRE Score', 'Status', 'Created'],
      rows: data.map(a => [
        a.application_number,
        a.leads?.lead_number,
        a.leads?.customer_name,
        PRODUCT_LABELS[a.leads?.product_type] || a.leads?.product_type,
        a.leads?.requested_amount,
        a.final_amount || '-',
        a.bre_score || '-',
        a.status,
        formatDate(a.created_at)
      ])
    };
    return exportData;
  };

  const exportDisbursals = () => {
    const data = filterData(disbursals, 'disbursals');
    const exportData: ExportData = {
      headers: ['App No', 'Lead No', 'Customer', 'Product', 'Sanctioned', 'Disbursed', 'Bank', 'Account', 'IFSC', 'Date'],
      rows: data.map(d => [
        d.application_number,
        d.leads?.lead_number,
        d.leads?.customer_name,
        PRODUCT_LABELS[d.leads?.product_type] || d.leads?.product_type,
        d.final_amount || '-',
        d.disbursed_amount || '-',
        d.bank_name || '-',
        d.bank_account_number || '-',
        d.bank_ifsc || '-',
        formatDate(d.disbursed_at)
      ])
    };
    return exportData;
  };

  const exportRejections = () => {
    const data = filterData(rejections, 'rejections');
    const exportData: ExportData = {
      headers: ['App No', 'Lead No', 'Customer', 'Product', 'Requested', 'BRE Score', 'Reason', 'Date'],
      rows: data.map(r => [
        r.application_number,
        r.leads?.lead_number,
        r.leads?.customer_name,
        PRODUCT_LABELS[r.leads?.product_type] || r.leads?.product_type,
        r.leads?.requested_amount,
        r.bre_score || '-',
        r.rejection_reason || 'Not specified',
        formatDate(r.rejected_at)
      ])
    };
    return exportData;
  };

  const exportPipeline = () => {
    const data = filterData(pipeline, 'pipeline');
    const today = new Date();
    const exportData: ExportData = {
      headers: ['App No', 'Lead No', 'Customer', 'Product', 'Amount', 'Status', 'Days in Stage', 'Updated'],
      rows: data.map(p => [
        p.application_number,
        p.leads?.lead_number,
        p.leads?.customer_name,
        PRODUCT_LABELS[p.leads?.product_type] || p.leads?.product_type,
        p.final_amount || p.leads?.requested_amount,
        p.status,
        Math.floor((today.getTime() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24)),
        formatDate(p.updated_at)
      ])
    };
    return exportData;
  };

  const dateRangeStr = `${format(dateFrom, 'dd-MMM-yyyy')}_to_${format(dateTo, 'dd-MMM-yyyy')}`;

  const getStatusOptions = () => {
    switch (activeTab) {
      case 'leads':
        return ['new', 'in_progress', 'documents_pending', 'submitted', 'approved', 'rejected', 'disbursed'];
      case 'applications':
        return ['draft', 'submitted', 'bre_processing', 'underwriting', 'pending_approval', 'approved', 'rejected', 'disbursed'];
      case 'pipeline':
        return ['submitted', 'bre_processing', 'underwriting', 'pending_approval', 'deviation'];
      default:
        return [];
    }
  };

  const renderFilters = (showStatusFilter = true) => (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={productFilter} onValueChange={setProductFilter}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Product Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Products</SelectItem>
          <SelectItem value="business_loan">Business Loan</SelectItem>
          <SelectItem value="personal_loan">Personal Loan</SelectItem>
          <SelectItem value="stpl">STPL</SelectItem>
          <SelectItem value="po_finance">PO Finance</SelectItem>
        </SelectContent>
      </Select>
      {showStatusFilter && getStatusOptions().length > 0 && (
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {getStatusOptions().map(status => (
              <SelectItem key={status} value={status}>
                {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );

  const renderExportButtons = (exportFn: () => ExportData, filename: string) => (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => exportToCSV(exportFn(), filename)} className="gap-2">
        <Download className="w-4 h-4" />
        CSV
      </Button>
      <Button variant="outline" size="sm" onClick={() => exportToExcel(exportFn(), filename)} className="gap-2">
        <Download className="w-4 h-4" />
        Excel
      </Button>
    </div>
  );

  const renderLoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );

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
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
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

            <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearchTerm(''); setStatusFilter('all'); }}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="leads" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Leads</span>
            <Badge variant="secondary" className="ml-1">{leads.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Applications</span>
            <Badge variant="secondary" className="ml-1">{applications.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="disbursals" className="gap-2">
            <Banknote className="w-4 h-4" />
            <span className="hidden sm:inline">Disbursals</span>
            <Badge variant="secondary" className="ml-1">{disbursals.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejections" className="gap-2">
            <XCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Rejections</span>
            <Badge variant="secondary" className="ml-1">{rejections.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Pipeline</span>
            <Badge variant="secondary" className="ml-1">{pipeline.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Leads Tab */}
        <TabsContent value="leads" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Lead Report</CardTitle>
                {renderExportButtons(exportLeads, `Lead_Report_${dateRangeStr}`)}
              </div>
            </CardHeader>
            <CardContent>
              {renderFilters()}
              {isLoading ? renderLoadingSkeleton() : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead No</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead>Temperature</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterData(leads, 'leads').length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No leads found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filterData(leads, 'leads').map(lead => (
                          <TableRow key={lead.id}>
                            <TableCell className="font-mono text-xs">{lead.lead_number}</TableCell>
                            <TableCell className="font-medium">{lead.customer_name}</TableCell>
                            <TableCell>{lead.customer_phone}</TableCell>
                            <TableCell>{PRODUCT_LABELS[lead.product_type] || lead.product_type}</TableCell>
                            <TableCell className="text-right">{formatCurrency(lead.requested_amount)}</TableCell>
                            <TableCell className="text-center">{lead.lead_score || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn(
                                lead.lead_temperature === 'hot' && 'bg-red-100 text-red-800 border-red-200',
                                lead.lead_temperature === 'warm' && 'bg-orange-100 text-orange-800 border-orange-200',
                                lead.lead_temperature === 'cold' && 'bg-blue-100 text-blue-800 border-blue-200'
                              )}>
                                {lead.lead_temperature || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-800'}>
                                {lead.status.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(lead.created_at)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Application Report</CardTitle>
                {renderExportButtons(exportApplications, `Application_Report_${dateRangeStr}`)}
              </div>
            </CardHeader>
            <CardContent>
              {renderFilters()}
              {isLoading ? renderLoadingSkeleton() : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>App No</TableHead>
                        <TableHead>Lead No</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Requested</TableHead>
                        <TableHead className="text-right">Final</TableHead>
                        <TableHead className="text-center">BRE</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterData(applications, 'applications').length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No applications found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filterData(applications, 'applications').map(app => (
                          <TableRow key={app.id}>
                            <TableCell className="font-mono text-xs">{app.application_number}</TableCell>
                            <TableCell className="font-mono text-xs">{app.leads?.lead_number}</TableCell>
                            <TableCell className="font-medium">{app.leads?.customer_name}</TableCell>
                            <TableCell>{PRODUCT_LABELS[app.leads?.product_type] || app.leads?.product_type}</TableCell>
                            <TableCell className="text-right">{formatCurrency(app.leads?.requested_amount)}</TableCell>
                            <TableCell className="text-right">{app.final_amount ? formatCurrency(app.final_amount) : '-'}</TableCell>
                            <TableCell className="text-center">{app.bre_score || '-'}</TableCell>
                            <TableCell>
                              <Badge className={STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-800'}>
                                {app.status.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(app.created_at)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disbursals Tab */}
        <TabsContent value="disbursals" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Disbursal Report</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total Disbursed: {formatCurrency(disbursals.reduce((sum, d) => sum + (d.disbursed_amount || 0), 0))}
                  </p>
                </div>
                {renderExportButtons(exportDisbursals, `Disbursal_Report_${dateRangeStr}`)}
              </div>
            </CardHeader>
            <CardContent>
              {renderFilters(false)}
              {isLoading ? renderLoadingSkeleton() : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>App No</TableHead>
                        <TableHead>Lead No</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Sanctioned</TableHead>
                        <TableHead className="text-right">Disbursed</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterData(disbursals, 'disbursals').length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No disbursals found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filterData(disbursals, 'disbursals').map(d => (
                          <TableRow key={d.id}>
                            <TableCell className="font-mono text-xs">{d.application_number}</TableCell>
                            <TableCell className="font-mono text-xs">{d.leads?.lead_number}</TableCell>
                            <TableCell className="font-medium">{d.leads?.customer_name}</TableCell>
                            <TableCell>{PRODUCT_LABELS[d.leads?.product_type] || d.leads?.product_type}</TableCell>
                            <TableCell className="text-right">{formatCurrency(d.final_amount)}</TableCell>
                            <TableCell className="text-right font-medium text-green-600">{formatCurrency(d.disbursed_amount)}</TableCell>
                            <TableCell>{d.bank_name || '-'}</TableCell>
                            <TableCell className="font-mono text-xs">{d.bank_account_number || '-'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(d.disbursed_at)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rejections Tab */}
        <TabsContent value="rejections" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Rejection Analysis</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Rejection Rate: {applications.length > 0 ? ((rejections.length / applications.length) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                {renderExportButtons(exportRejections, `Rejection_Report_${dateRangeStr}`)}
              </div>
            </CardHeader>
            <CardContent>
              {renderFilters(false)}
              {isLoading ? renderLoadingSkeleton() : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>App No</TableHead>
                        <TableHead>Lead No</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Requested</TableHead>
                        <TableHead className="text-center">BRE Score</TableHead>
                        <TableHead>Rejection Reason</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterData(rejections, 'rejections').length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No rejections found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filterData(rejections, 'rejections').map(r => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-xs">{r.application_number}</TableCell>
                            <TableCell className="font-mono text-xs">{r.leads?.lead_number}</TableCell>
                            <TableCell className="font-medium">{r.leads?.customer_name}</TableCell>
                            <TableCell>{PRODUCT_LABELS[r.leads?.product_type] || r.leads?.product_type}</TableCell>
                            <TableCell className="text-right">{formatCurrency(r.leads?.requested_amount)}</TableCell>
                            <TableCell className="text-center">{r.bre_score || '-'}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={r.rejection_reason}>
                              {r.rejection_reason || 'Not specified'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(r.rejected_at)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Pipeline Report</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Active applications in progress
                  </p>
                </div>
                {renderExportButtons(exportPipeline, `Pipeline_Report_${format(new Date(), 'dd-MMM-yyyy')}`)}
              </div>
            </CardHeader>
            <CardContent>
              {renderFilters()}
              {isLoading ? renderLoadingSkeleton() : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>App No</TableHead>
                        <TableHead>Lead No</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Days</TableHead>
                        <TableHead>Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterData(pipeline, 'pipeline').length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No active applications in pipeline
                          </TableCell>
                        </TableRow>
                      ) : (
                        filterData(pipeline, 'pipeline').map(p => {
                          const daysInStage = Math.floor((new Date().getTime() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24));
                          return (
                            <TableRow key={p.id}>
                              <TableCell className="font-mono text-xs">{p.application_number}</TableCell>
                              <TableCell className="font-mono text-xs">{p.leads?.lead_number}</TableCell>
                              <TableCell className="font-medium">{p.leads?.customer_name}</TableCell>
                              <TableCell>{PRODUCT_LABELS[p.leads?.product_type] || p.leads?.product_type}</TableCell>
                              <TableCell className="text-right">{formatCurrency(p.final_amount || p.leads?.requested_amount)}</TableCell>
                              <TableCell>
                                <Badge className={STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-800'}>
                                  {p.status.replace(/_/g, ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={daysInStage > 3 ? 'destructive' : daysInStage > 1 ? 'secondary' : 'outline'}>
                                  {daysInStage}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{formatDate(p.updated_at)}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
