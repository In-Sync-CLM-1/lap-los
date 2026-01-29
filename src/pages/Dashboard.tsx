import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowUpRight,
  Plus,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROLE_LABELS, LEAD_STATUS_LABELS, PRODUCT_LABELS } from '@/types/database';
import { format } from 'date-fns';
import type { Lead, Application } from '@/types/database';

function getStatusColor(status: string) {
  switch (status) {
    case 'new': return 'status-new';
    case 'in_progress': return 'status-in-progress';
    case 'submitted': return 'bg-info/15 text-info';
    case 'approved': return 'status-approved';
    case 'rejected': return 'status-rejected';
    default: return 'status-pending';
  }
}

export function Dashboard() {
  const { profile, primaryRole, isManager, hasRole, user } = useAuth();

  // Fetch leads stats
  const { data: leadsStats, isLoading: isLoadingLeads } = useQuery({
    queryKey: ['dashboard-leads-stats'],
    queryFn: async () => {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('id, status, created_at');
      
      if (error) throw error;
      
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      return {
        total: leads?.length || 0,
        thisMonth: leads?.filter(l => new Date(l.created_at) >= thisMonth).length || 0,
        new: leads?.filter(l => l.status === 'new').length || 0,
        submitted: leads?.filter(l => l.status === 'submitted').length || 0,
      };
    },
  });

  // Fetch applications stats
  const { data: appStats, isLoading: isLoadingApps } = useQuery({
    queryKey: ['dashboard-applications-stats'],
    queryFn: async () => {
      const { data: apps, error } = await supabase
        .from('applications')
        .select('id, status, created_at, approved_at, disbursed_at');
      
      if (error) throw error;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return {
        pending: apps?.filter(a => ['underwriting', 'pending_approval', 'deviation'].includes(a.status)).length || 0,
        approvedToday: apps?.filter(a => a.approved_at && new Date(a.approved_at) >= today).length || 0,
        disbursed: apps?.filter(a => a.status === 'disbursed').length || 0,
      };
    },
  });

  // Fetch recent leads
  const { data: recentLeads = [], isLoading: isLoadingRecent } = useQuery({
    queryKey: ['dashboard-recent-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, lead_number, customer_name, product_type, requested_amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch pending actions (for credit officers and managers)
  const { data: pendingActions = [], isLoading: isLoadingActions } = useQuery({
    queryKey: ['dashboard-pending-actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          application_number,
          status,
          has_deviation,
          deviation_type,
          lead_id,
          leads!inner(customer_name)
        `)
        .in('status', ['underwriting', 'pending_approval', 'deviation'])
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      return (data || []).map(app => ({
        id: app.id,
        type: app.status === 'deviation' ? 'Deviation Approval' : 
              app.status === 'pending_approval' ? 'Final Approval' : 'Document Review',
        lead: (app as unknown as { leads: { customer_name: string } }).leads?.customer_name || 'Unknown',
        priority: app.has_deviation ? 'high' : 'medium',
        applicationNumber: app.application_number,
      }));
    },
    enabled: hasRole('credit_officer') || isManager(),
  });

  // Calculate conversion rate
  const conversionRate = leadsStats && leadsStats.total > 0 
    ? Math.round((appStats?.disbursed || 0) / leadsStats.total * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-muted-foreground">
            {primaryRole ? ROLE_LABELS[primaryRole] : 'No role assigned'} • Here's your overview
          </p>
        </div>
        <Button asChild className="gap-2 w-full sm:w-auto">
          <Link to="/leads/new">
            <Plus className="w-4 h-4" />
            New Lead
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4" data-tour="dashboard-stats">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingLeads ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{leadsStats?.total || 0}</div>
                <div className="flex items-center text-xs text-success mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {leadsStats?.thisMonth || 0} this month
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {isLoadingApps ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{appStats?.pending || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Awaiting action
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {isLoadingApps ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{appStats?.approvedToday || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {appStats?.disbursed || 0} total disbursed
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            {isLoadingLeads || isLoadingApps ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{conversionRate}%</div>
                <Progress value={conversionRate} className="h-1.5 mt-2" />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Leads</CardTitle>
              <CardDescription>Your latest lead captures</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/leads" className="gap-1">
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingRecent ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : recentLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No leads yet. Create your first lead!</p>
                <Button asChild className="mt-4" size="sm">
                  <Link to="/leads/new">
                    <Plus className="w-4 h-4 mr-2" />
                    New Lead
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLeads.map((lead) => (
                  <Link 
                    key={lead.id} 
                    to={`/leads/${lead.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{lead.customer_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{PRODUCT_LABELS[lead.product_type as keyof typeof PRODUCT_LABELS]}</span>
                        <span>•</span>
                        <span>₹{(lead.requested_amount / 100000).toFixed(1)}L</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className={getStatusColor(lead.status)}>
                        {LEAD_STATUS_LABELS[lead.status as keyof typeof LEAD_STATUS_LABELS]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(lead.created_at), 'dd MMM')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Actions */}
        {(hasRole('credit_officer') || isManager()) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Pending Actions</CardTitle>
                <CardDescription>Items requiring your attention</CardDescription>
              </div>
              {pendingActions.length > 0 && (
                <Badge variant="destructive" className="animate-pulse-subtle">
                  {pendingActions.length} Pending
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {isLoadingActions ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
              ) : pendingActions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-success" />
                  <p>All caught up! No pending actions.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingActions.map((action) => (
                    <Link 
                      key={action.id} 
                      to={`/applications/${action.id}/process`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${action.priority === 'high' ? 'bg-destructive' : 'bg-warning'}`} />
                        <div>
                          <p className="font-medium">{action.type}</p>
                          <p className="text-sm text-muted-foreground">{action.lead}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Performance Summary for ROs */}
        {hasRole('ro') && !isManager() && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Performance</CardTitle>
              <CardDescription>This month's metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Leads Captured</span>
                <span className="font-bold">{leadsStats?.thisMonth || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Conversion Rate</span>
                <span className="font-bold text-success">{conversionRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending Submission</span>
                <span className="font-bold">{leadsStats?.new || 0}</span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Monthly Target</span>
                  <span>{leadsStats?.thisMonth || 0}/50 leads</span>
                </div>
                <Progress value={Math.min(((leadsStats?.thisMonth || 0) / 50) * 100, 100)} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
