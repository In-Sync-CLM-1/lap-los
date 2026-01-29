import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Search, 
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  User,
  FileText,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import type { ApplicationStatus, DecisionType, ProductType } from '@/types/database';
import { APPLICATION_STATUS_LABELS, PRODUCT_LABELS } from '@/types/database';

interface ApplicationWithLead {
  id: string;
  application_number: string;
  lead_id: string;
  product_type: ProductType;
  requested_amount: number;
  bre_score: number | null;
  bre_decision: DecisionType | null;
  status: ApplicationStatus;
  has_deviation: boolean;
  created_at: string;
  leads: {
    customer_name: string;
    customer_phone: string;
  };
  profiles: {
    full_name: string;
  } | null;
}

function getStatusColor(status: ApplicationStatus): string {
  switch (status) {
    case 'underwriting': return 'bg-info/15 text-info border-info/30';
    case 'pending_approval': return 'bg-warning/15 text-warning border-warning/30';
    case 'approved': return 'bg-success/15 text-success border-success/30';
    case 'rejected': return 'bg-destructive/15 text-destructive border-destructive/30';
    case 'deviation': return 'bg-warning/15 text-warning border-warning/30';
    case 'disbursed': return 'bg-success/15 text-success border-success/30';
    default: return 'bg-muted text-muted-foreground';
  }
}

function getBREDecisionBadge(decision: DecisionType | null) {
  switch (decision) {
    case 'stp_approved':
      return <Badge className="bg-success/15 text-success border-success/30 border">STP</Badge>;
    case 'non_stp':
      return <Badge className="bg-warning/15 text-warning border-warning/30 border">Non-STP</Badge>;
    case 'deviation':
      return <Badge className="bg-destructive/15 text-destructive border-destructive/30 border">Deviation</Badge>;
    case 'rejected':
      return <Badge className="bg-destructive/15 text-destructive border-destructive/30 border">Rejected</Badge>;
    default:
      return null;
  }
}

export function Underwriting() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch applications with leads
  const { data: applications = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['underwriting-applications', statusFilter],
    queryFn: async () => {
      const { data: apps, error } = await supabase
        .from('applications')
        .select(`
          id,
          application_number,
          lead_id,
          status,
          bre_score,
          bre_decision,
          has_deviation,
          created_at,
          ro_id,
          leads!inner(
            customer_name,
            customer_phone,
            product_type,
            requested_amount
          )
        `)
        .in('status', ['submitted', 'bre_processing', 'underwriting', 'pending_approval', 'deviation'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for RO names
      const roIds = [...new Set((apps || []).map(a => a.ro_id))];
      const { data: profiles } = roIds.length > 0 
        ? await supabase.from('profiles').select('user_id, full_name').in('user_id', roIds)
        : { data: [] };

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

      let filteredApps = apps || [];
      if (statusFilter !== 'all') {
        filteredApps = filteredApps.filter(a => a.status === statusFilter);
      }
      
      return filteredApps.map(app => ({
        id: app.id,
        application_number: app.application_number,
        lead_id: app.lead_id,
        status: app.status,
        bre_score: app.bre_score,
        bre_decision: app.bre_decision,
        has_deviation: app.has_deviation || false,
        created_at: app.created_at,
        product_type: (app.leads as { product_type: ProductType }).product_type,
        requested_amount: (app.leads as { requested_amount: number }).requested_amount,
        leads: app.leads as { customer_name: string; customer_phone: string },
        profiles: profileMap.get(app.ro_id) ? { full_name: profileMap.get(app.ro_id)! } : null,
      })) as ApplicationWithLead[];
    },
  });

  // Calculate stats
  const stats = {
    inQueue: applications.filter(a => a.status === 'underwriting').length,
    pendingApproval: applications.filter(a => a.status === 'pending_approval').length,
    deviations: applications.filter(a => a.status === 'deviation' || a.has_deviation).length,
    total: applications.length,
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.leads.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.application_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Underwriting Queue</h1>
          <p className="text-muted-foreground">Review and process loan applications</p>
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-info/15 flex items-center justify-center">
                <FileText className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inQueue}</p>
                <p className="text-sm text-muted-foreground">In Queue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingApproval}</p>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-destructive/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.deviations}</p>
                <p className="text-sm text-muted-foreground">Deviations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or application number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="underwriting">Underwriting</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="deviation">Deviation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No applications found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No applications in the underwriting queue'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((app) => (
            <Link key={app.id} to={`/applications/${app.id}/process`}>
              <Card className="card-hover cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold">{app.leads.customer_name}</h3>
                        <Badge variant="outline" className={`${getStatusColor(app.status)} border`}>
                          {APPLICATION_STATUS_LABELS[app.status]}
                        </Badge>
                        {getBREDecisionBadge(app.bre_decision)}
                        {app.has_deviation && (
                          <Badge variant="destructive" className="animate-pulse-subtle">
                            High Priority
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {app.application_number} • {PRODUCT_LABELS[app.product_type]}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          RO: {app.profiles?.full_name || 'Unknown'}
                        </span>
                        {app.bre_score && <span>BRE Score: {app.bre_score}</span>}
                        <span>{format(new Date(app.created_at), 'dd MMM yyyy')}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg">
                        ₹{(app.requested_amount / 100000).toFixed(1)}L
                      </p>
                      <Button size="sm" className="mt-2">
                        Review
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
