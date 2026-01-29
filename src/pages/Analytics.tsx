import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  TrendingUp, 
  Users,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { ExportButton } from '@/components/ui/export-button';
import { 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, startOfMonth, subMonths } from 'date-fns';
import type { LeadStatus, ProductType } from '@/types/database';
import { LEAD_STATUS_LABELS, PRODUCT_LABELS } from '@/types/database';

export function Analytics() {
  const [dateRange, setDateRange] = useState('30d');

  // Calculate date filter
  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case '7d': return subDays(now, 7);
      case '30d': return subDays(now, 30);
      case '90d': return subDays(now, 90);
      case 'ytd': return new Date(now.getFullYear(), 0, 1);
      default: return subDays(now, 30);
    }
  };

  // Fetch leads for funnel and stats
  const { data: leadsData, isLoading: isLoadingLeads } = useQuery({
    queryKey: ['analytics-leads', dateRange],
    queryFn: async () => {
      const dateFilter = getDateFilter();
      const { data, error } = await supabase
        .from('leads')
        .select('id, status, product_type, requested_amount, created_at')
        .gte('created_at', dateFilter.toISOString());
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch applications for analytics
  const { data: appsData, isLoading: isLoadingApps } = useQuery({
    queryKey: ['analytics-applications', dateRange],
    queryFn: async () => {
      const dateFilter = getDateFilter();
      const { data, error } = await supabase
        .from('applications')
        .select('id, status, final_amount, disbursed_amount, rejection_reason, created_at, approved_at, disbursed_at')
        .gte('created_at', dateFilter.toISOString());
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch top ROs (profiles with lead counts)
  const { data: topROs, isLoading: isLoadingROs } = useQuery({
    queryKey: ['analytics-top-ros', dateRange],
    queryFn: async () => {
      const dateFilter = getDateFilter();
      const { data: leads, error } = await supabase
        .from('leads')
        .select('ro_id, requested_amount, status')
        .gte('created_at', dateFilter.toISOString());
      
      if (error) throw error;
      
      // Group by RO
      const roStats = (leads || []).reduce((acc, lead) => {
        if (!acc[lead.ro_id]) {
          acc[lead.ro_id] = { leads: 0, amount: 0, converted: 0 };
        }
        acc[lead.ro_id].leads++;
        acc[lead.ro_id].amount += lead.requested_amount;
        if (['approved', 'disbursed'].includes(lead.status)) {
          acc[lead.ro_id].converted++;
        }
        return acc;
      }, {} as Record<string, { leads: number; amount: number; converted: number }>);

      // Fetch profile names for top ROs
      const topRoIds = Object.entries(roStats)
        .sort((a, b) => b[1].leads - a[1].leads)
        .slice(0, 5)
        .map(([id]) => id);

      if (topRoIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', topRoIds);

      return topRoIds.map(id => {
        const profile = profiles?.find(p => p.user_id === id);
        const stats = roStats[id];
        return {
          name: profile?.full_name || 'Unknown',
          leads: stats.leads,
          conversion: stats.leads > 0 ? Math.round((stats.converted / stats.leads) * 100) : 0,
          amount: Math.round(stats.amount / 100000),
        };
      });
    },
  });

  // Calculate funnel data
  const funnelData = leadsData ? [
    { stage: 'Leads', count: leadsData.length, conversion: 100 },
    { stage: 'Submitted', count: leadsData.filter(l => !['new', 'in_progress', 'documents_pending'].includes(l.status)).length, conversion: 0 },
    { stage: 'Under Review', count: leadsData.filter(l => ['under_review', 'approved', 'disbursed'].includes(l.status)).length, conversion: 0 },
    { stage: 'Approved', count: leadsData.filter(l => ['approved', 'disbursed'].includes(l.status)).length, conversion: 0 },
    { stage: 'Disbursed', count: leadsData.filter(l => l.status === 'disbursed').length, conversion: 0 },
  ].map((stage, _, arr) => ({
    ...stage,
    conversion: arr[0].count > 0 ? Math.round((stage.count / arr[0].count) * 100) : 0,
  })) : [];

  // Calculate product mix
  const productMix = leadsData ? Object.entries(
    leadsData.reduce((acc, lead) => {
      acc[lead.product_type] = (acc[lead.product_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([type, count], index) => ({
    name: PRODUCT_LABELS[type as ProductType] || type,
    value: Math.round((count / leadsData.length) * 100),
    color: `hsl(var(--chart-${index + 1}))`,
  })) : [];

  // Calculate rejection reasons
  const rejectionReasons = appsData ? Object.entries(
    appsData
      .filter(a => a.status === 'rejected' && a.rejection_reason)
      .reduce((acc, app) => {
        const reason = app.rejection_reason || 'Other';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
  ).map(([reason, count]) => ({
    reason,
    count,
    percentage: Math.round((count / (appsData.filter(a => a.status === 'rejected').length || 1)) * 100),
  })).slice(0, 5) : [];

  // Calculate KPIs
  const totalLeads = leadsData?.length || 0;
  const disbursedCount = appsData?.filter(a => a.status === 'disbursed').length || 0;
  const totalVolume = appsData
    ?.filter(a => a.status === 'disbursed')
    .reduce((sum, a) => sum + (a.disbursed_amount || 0), 0) || 0;

  // Generate trend data (monthly for simplicity)
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const monthStart = startOfMonth(subMonths(new Date(), 5 - i));
    const monthEnd = startOfMonth(subMonths(new Date(), 4 - i));
    const monthLeads = leadsData?.filter(l => {
      const created = new Date(l.created_at);
      return created >= monthStart && created < monthEnd;
    }).length || 0;
    const monthApproved = appsData?.filter(a => {
      const approved = a.approved_at ? new Date(a.approved_at) : null;
      return approved && approved >= monthStart && approved < monthEnd;
    }).length || 0;
    const monthDisbursed = appsData?.filter(a => {
      const disbursed = a.disbursed_at ? new Date(a.disbursed_at) : null;
      return disbursed && disbursed >= monthStart && disbursed < monthEnd;
    }).length || 0;

    return {
      month: format(monthStart, 'MMM'),
      leads: monthLeads,
      approved: monthApproved,
      disbursed: monthDisbursed,
    };
  });

  const isLoading = isLoadingLeads || isLoadingApps;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics & MIS</h1>
          <p className="text-muted-foreground">Business intelligence and reporting</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
            </SelectContent>
          </Select>
          <ExportButton 
            data={{
              headers: ['Metric', 'Value'],
              rows: [
                ['Total Leads', totalLeads],
                ['Disbursed', disbursedCount],
                ['Volume (Lakhs)', Math.round(totalVolume / 100000)],
              ]
            }}
            filename={`analytics-report-${dateRange}`}
            label="Export"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalLeads}</div>
                <div className="flex items-center text-xs text-success mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  In selected period
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disbursed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{disbursedCount}</div>
                <div className="flex items-center text-xs text-success mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {totalLeads > 0 ? Math.round((disbursedCount / totalLeads) * 100) : 0}% conversion
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg TAT</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">2.4 days</div>
                <div className="flex items-center text-xs text-success mt-1">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  Est. processing time
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">₹{(totalVolume / 10000000).toFixed(1)}Cr</div>
                <div className="flex items-center text-xs text-success mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  Total disbursed
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Funnel</CardTitle>
            <CardDescription>Conversion at each stage</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i}>
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {funnelData.map((stage) => (
                  <div key={stage.stage}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{stage.stage}</span>
                      <span className="font-medium">{stage.count} ({stage.conversion}%)</span>
                    </div>
                    <Progress 
                      value={stage.conversion} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
            <CardDescription>Leads, approvals & disbursals</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="leads" 
                        stroke="hsl(var(--chart-1))" 
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="approved" 
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="disbursed" 
                        stroke="hsl(var(--chart-3))" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-chart-1" />
                    <span>Leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-chart-2" />
                    <span>Approved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-chart-3" />
                    <span>Disbursed</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Mix */}
        <Card>
          <CardHeader>
            <CardTitle>Product Mix</CardTitle>
            <CardDescription>Distribution by product type</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : productMix.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            ) : (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productMix}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {productMix.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {productMix.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate">{item.name}</span>
                      <span className="font-medium ml-auto">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Rejection Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Rejection Reasons</CardTitle>
            <CardDescription>Top reasons for rejection</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i}>
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : rejectionReasons.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No rejections in period
              </div>
            ) : (
              <div className="space-y-4">
                {rejectionReasons.map((item) => (
                  <div key={item.reason}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate">{item.reason}</span>
                      <span className="font-medium">{item.count} ({item.percentage}%)</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top ROs</CardTitle>
            <CardDescription>Best performing relationship officers</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingROs ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : !topROs || topROs.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            ) : (
              <div className="space-y-4">
                {topROs.map((person, index) => (
                  <div key={person.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{person.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {person.leads} leads • {person.conversion}% conv.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{person.amount}L</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
