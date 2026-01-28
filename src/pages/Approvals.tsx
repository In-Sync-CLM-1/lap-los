import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  User,
  FileText,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { PRODUCT_LABELS } from '@/types/database';

// Mock data for pending approvals
const mockApprovals = [
  {
    id: '1',
    application_number: 'NC-A-20260128-00001',
    customer_name: 'Rajesh Kumar',
    product_type: 'business_loan' as const,
    requested_amount: 500000,
    approved_amount: 450000,
    deviation_type: 'Bureau Score Low',
    deviation_reason: 'CIBIL score is 620, below threshold of 650',
    requested_by: 'Amit Singh (Credit Officer)',
    requested_at: new Date(Date.now() - 3600000).toISOString(),
    priority: 'high',
  },
  {
    id: '2',
    application_number: 'NC-A-20260127-00003',
    customer_name: 'Sunita Gupta',
    product_type: 'business_loan' as const,
    requested_amount: 1000000,
    approved_amount: 1000000,
    deviation_type: 'Enhanced Amount',
    deviation_reason: 'Counter offer: Customer requested amount exceeds FOIR-based offer by 20%',
    requested_by: 'Priya Sharma (Credit Officer)',
    requested_at: new Date(Date.now() - 7200000).toISOString(),
    priority: 'medium',
  },
  {
    id: '3',
    application_number: 'NC-A-20260126-00008',
    customer_name: 'Vikram Joshi',
    product_type: 'po_finance' as const,
    requested_amount: 2500000,
    approved_amount: 2000000,
    deviation_type: 'Document Waiver',
    deviation_reason: 'Missing ITR for last year, bank statements provided as alternative',
    requested_by: 'Rahul Verma (Credit Officer)',
    requested_at: new Date(Date.now() - 86400000).toISOString(),
    priority: 'low',
  },
];

const recentDecisions = [
  {
    id: '1',
    application_number: 'NC-A-20260125-00012',
    customer_name: 'Meera Patel',
    decision: 'approved',
    amount: 300000,
    decided_by: 'You',
    decided_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    application_number: 'NC-A-20260124-00007',
    customer_name: 'Rakesh Singh',
    decision: 'rejected',
    amount: 800000,
    decided_by: 'You',
    decided_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

export function Approvals() {
  const { profile, primaryRole } = useAuth();
  const [selectedTab, setSelectedTab] = useState('pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Approval Queue</h1>
        <p className="text-muted-foreground">Review and approve deviation requests</p>
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
                <p className="text-2xl font-bold">{mockApprovals.length}</p>
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
                <p className="text-2xl font-bold">1</p>
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
                <p className="text-2xl font-bold">15</p>
                <p className="text-sm text-muted-foreground">Approved (7d)</p>
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
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Rejected (7d)</p>
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
            <Badge variant="secondary" className="ml-1">{mockApprovals.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <FileText className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6 space-y-4">
          {mockApprovals.map((approval) => (
            <Card key={approval.id} className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold">{approval.customer_name}</h3>
                      <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30 border">
                        {approval.deviation_type}
                      </Badge>
                      {approval.priority === 'high' && (
                        <Badge variant="destructive" className="animate-pulse-subtle">
                          High Priority
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {approval.application_number} • {PRODUCT_LABELS[approval.product_type]}
                    </p>
                    
                    <div className="bg-muted/50 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium mb-1">Deviation Reason:</p>
                      <p className="text-sm text-muted-foreground">{approval.deviation_reason}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {approval.requested_by}
                      </span>
                      <span>
                        {format(new Date(approval.requested_at), 'dd MMM, HH:mm')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-muted-foreground">Requested</p>
                    <p className="font-bold text-lg">
                      ₹{(approval.approved_amount / 100000).toFixed(1)}L
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30">
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button size="sm" className="bg-success hover:bg-success/90">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="history" className="mt-6 space-y-4">
          {recentDecisions.map((decision) => (
            <Card key={decision.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      decision.decision === 'approved' ? 'bg-success/15' : 'bg-destructive/15'
                    }`}>
                      {decision.decision === 'approved' ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{decision.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {decision.application_number} • ₹{(decision.amount / 100000).toFixed(1)}L
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={decision.decision === 'approved' 
                      ? 'bg-success/15 text-success' 
                      : 'bg-destructive/15 text-destructive'
                    }>
                      {decision.decision === 'approved' ? 'Approved' : 'Rejected'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(decision.decided_at), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
