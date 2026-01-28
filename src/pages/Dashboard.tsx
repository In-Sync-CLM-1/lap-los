import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROLE_LABELS } from '@/types/database';

// Mock data for dashboard
const mockStats = {
  totalLeads: 156,
  leadsThisMonth: 42,
  leadsGrowth: 12.5,
  pendingApplications: 23,
  approvedToday: 8,
  rejectedToday: 2,
  avgProcessingTime: '2.4 days',
  conversionRate: 68,
};

const recentLeads = [
  { id: '1', name: 'Rajesh Kumar', product: 'Business Loan', amount: 500000, status: 'new', time: '10 mins ago' },
  { id: '2', name: 'Priya Sharma', product: 'Personal Loan', amount: 200000, status: 'in_progress', time: '1 hour ago' },
  { id: '3', name: 'Amit Patel', product: 'STPL', amount: 100000, status: 'submitted', time: '2 hours ago' },
  { id: '4', name: 'Sunita Gupta', product: 'Business Loan', amount: 750000, status: 'approved', time: '3 hours ago' },
];

const pendingActions = [
  { id: '1', type: 'Document Review', lead: 'Rajesh Kumar', priority: 'high' },
  { id: '2', type: 'BRE Override', lead: 'Priya Sharma', priority: 'medium' },
  { id: '3', type: 'Deviation Approval', lead: 'Amit Patel', priority: 'high' },
];

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
  const { profile, primaryRole, isManager, hasRole } = useAuth();

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
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalLeads}</div>
            <div className="flex items-center text-xs text-success mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              {mockStats.leadsGrowth}% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.pendingApplications}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Awaiting action
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.approvedToday}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {mockStats.rejectedToday} rejected
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.conversionRate}%</div>
            <Progress value={mockStats.conversionRate} className="h-1.5 mt-2" />
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
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div 
                  key={lead.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{lead.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{lead.product}</span>
                      <span>•</span>
                      <span>₹{(lead.amount / 100000).toFixed(1)}L</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className={getStatusColor(lead.status)}>
                      {lead.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{lead.time}</span>
                  </div>
                </div>
              ))}
            </div>
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
              <Badge variant="destructive" className="animate-pulse-subtle">
                {pendingActions.length} Pending
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingActions.map((action) => (
                  <div 
                    key={action.id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
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
                  </div>
                ))}
              </div>
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
                <span className="font-bold">{mockStats.leadsThisMonth}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Conversion Rate</span>
                <span className="font-bold text-success">{mockStats.conversionRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg. Processing Time</span>
                <span className="font-bold">{mockStats.avgProcessingTime}</span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Monthly Target</span>
                  <span>42/50 leads</span>
                </div>
                <Progress value={84} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
