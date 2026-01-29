import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  User,
  FileText,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { PRODUCT_LABELS } from '@/types/database';
import type { ApplicationStatus, ProductType } from '@/types/database';
import { CounterOfferForm } from '@/components/approvals/CounterOfferForm';

interface ApprovalItem {
  id: string;
  application_number: string;
  status: ApplicationStatus;
  deviation_type: string | null;
  deviation_reason: string | null;
  has_deviation: boolean;
  final_amount: number | null;
  created_at: string;
  leads: {
    customer_name: string;
    product_type: ProductType;
    requested_amount: number;
  };
  profiles: {
    full_name: string;
  } | null;
}

interface DecisionHistory {
  id: string;
  application_number: string;
  status: ApplicationStatus;
  approved_at: string | null;
  rejected_at: string | null;
  final_amount: number | null;
  leads: {
    customer_name: string;
  };
}

export function Approvals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('pending');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [counterOfferOpen, setCounterOfferOpen] = useState(false);

  // Fetch pending approvals
  const { data: pendingApprovals = [], isLoading: isLoadingPending, refetch, isRefetching } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const { data: apps, error } = await supabase
        .from('applications')
        .select(`
          id,
          application_number,
          status,
          deviation_type,
          deviation_reason,
          has_deviation,
          final_amount,
          created_at,
          ro_id,
          leads!inner(
            customer_name,
            product_type,
            requested_amount
          )
        `)
        .or('status.eq.deviation,status.eq.pending_approval')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for RO names
      const roIds = [...new Set((apps || []).map(a => a.ro_id))];
      const { data: profiles } = roIds.length > 0 
        ? await supabase.from('profiles').select('user_id, full_name').in('user_id', roIds)
        : { data: [] };

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

      return (apps || []).map(app => ({
        id: app.id,
        application_number: app.application_number,
        status: app.status,
        deviation_type: app.deviation_type,
        deviation_reason: app.deviation_reason,
        has_deviation: app.has_deviation || false,
        final_amount: app.final_amount,
        created_at: app.created_at,
        leads: app.leads as { customer_name: string; product_type: ProductType; requested_amount: number },
        profiles: profileMap.get(app.ro_id) ? { full_name: profileMap.get(app.ro_id)! } : null,
      })) as ApprovalItem[];
    },
  });

  // Fetch decision history
  const { data: decisionHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['approval-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          application_number,
          status,
          approved_at,
          rejected_at,
          final_amount,
          leads!inner(customer_name)
        `)
        .in('status', ['approved', 'rejected', 'disbursed'])
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as DecisionHistory[];
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        } as never)
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Log workflow history
      await supabase.from('workflow_history').insert({
        application_id: applicationId,
        action: 'approved',
        from_status: 'pending_approval',
        to_status: 'approved',
        performed_by: user?.id,
        notes: 'Application approved by manager',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-history'] });
      toast({
        title: 'Application approved',
        description: 'The application has been approved successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error approving application',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ applicationId, reason }: { applicationId: string; reason: string }) => {
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: 'rejected',
          rejected_by: user?.id,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
        } as never)
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Log workflow history
      await supabase.from('workflow_history').insert({
        application_id: applicationId,
        action: 'rejected',
        from_status: 'pending_approval',
        to_status: 'rejected',
        performed_by: user?.id,
        notes: reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-history'] });
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedAppId(null);
      toast({
        title: 'Application rejected',
        description: 'The application has been rejected',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error rejecting application',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleReject = (appId: string) => {
    setSelectedAppId(appId);
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (selectedAppId && rejectionReason) {
      rejectMutation.mutate({ applicationId: selectedAppId, reason: rejectionReason });
    }
  };

  const handleCounterOffer = (appId: string) => {
    setSelectedAppId(appId);
    setCounterOfferOpen(true);
  };

  // Stats
  const stats = {
    pending: pendingApprovals.length,
    highPriority: pendingApprovals.filter(a => a.has_deviation).length,
    approved: decisionHistory.filter(a => a.status === 'approved' || a.status === 'disbursed').length,
    rejected: decisionHistory.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Approval Queue</h1>
          <p className="text-muted-foreground">Review and approve deviation requests</p>
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
              <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
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
                <p className="text-2xl font-bold">{stats.highPriority}</p>
                <p className="text-sm text-muted-foreground">High Priority</p>
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
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <XCircle className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pending
            {stats.pending > 0 && (
              <Badge variant="secondary" className="ml-1">{stats.pending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <FileText className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6 space-y-4">
          {isLoadingPending ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : pendingApprovals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-success" />
                <h3 className="font-medium mb-1">All caught up!</h3>
                <p className="text-sm text-muted-foreground">
                  No pending approvals at the moment
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingApprovals.map((approval) => (
              <Card key={approval.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold">{approval.leads.customer_name}</h3>
                        <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30 border">
                          {approval.deviation_type || 'Pending Approval'}
                        </Badge>
                        {approval.has_deviation && (
                          <Badge variant="destructive" className="animate-pulse-subtle">
                            High Priority
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {approval.application_number} • {PRODUCT_LABELS[approval.leads.product_type]}
                      </p>
                      
                      {approval.deviation_reason && (
                        <div className="bg-muted/50 rounded-lg p-3 mb-3">
                          <p className="text-sm font-medium mb-1">Deviation Reason:</p>
                          <p className="text-sm text-muted-foreground">{approval.deviation_reason}</p>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {approval.profiles?.full_name || 'Unknown RO'}
                        </span>
                        <span>
                          {format(new Date(approval.created_at), 'dd MMM, HH:mm')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-muted-foreground">Requested</p>
                      <p className="font-bold text-lg">
                        ₹{((approval.final_amount || approval.leads.requested_amount) / 100000).toFixed(1)}L
                      </p>
                      <div className="flex flex-col gap-2 mt-3">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-destructive border-destructive/30"
                            onClick={() => handleReject(approval.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-success hover:bg-success/90"
                            onClick={() => approveMutation.mutate(approval.id)}
                            disabled={approveMutation.isPending}
                          >
                            {approveMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                            )}
                            Approve
                          </Button>
                        </div>
                        {approval.status === 'deviation' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCounterOffer(approval.id)}
                          >
                            Counter Offer
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6 space-y-4">
          {isLoadingHistory ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))
          ) : decisionHistory.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <h3 className="font-medium mb-1">No history yet</h3>
                <p className="text-sm text-muted-foreground">
                  Decisions will appear here once made
                </p>
              </CardContent>
            </Card>
          ) : (
            decisionHistory.map((decision) => (
              <Card key={decision.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        decision.status === 'rejected' ? 'bg-destructive/15' : 'bg-success/15'
                      }`}>
                        {decision.status === 'rejected' ? (
                          <XCircle className="w-5 h-5 text-destructive" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{decision.leads.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {decision.application_number} • ₹{((decision.final_amount || 0) / 100000).toFixed(1)}L
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={decision.status === 'rejected' 
                        ? 'bg-destructive/15 text-destructive' 
                        : 'bg-success/15 text-success'
                      }>
                        {decision.status === 'rejected' ? 'Rejected' : 
                         decision.status === 'disbursed' ? 'Disbursed' : 'Approved'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(decision.approved_at || decision.rejected_at || decision.id), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmReject}
              disabled={!rejectionReason || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Counter Offer - uses internal dialog trigger */}
      {selectedAppId && counterOfferOpen && (() => {
        const app = pendingApprovals.find(a => a.id === selectedAppId);
        if (!app) return null;
        return (
          <Dialog open={counterOfferOpen} onOpenChange={(open) => {
            setCounterOfferOpen(open);
            if (!open) setSelectedAppId(null);
          }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Counter Offer</DialogTitle>
                <DialogDescription>
                  Provide an alternative offer for {app.leads.customer_name}
                </DialogDescription>
              </DialogHeader>
              <CounterOfferForm
                applicationId={selectedAppId}
                currentAmount={app.final_amount || app.leads.requested_amount}
                currentTenure={24}
                currentRate={18}
                onSuccess={() => {
                  refetch();
                  setCounterOfferOpen(false);
                  setSelectedAppId(null);
                }}
              />
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}
