import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  User,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import type { ApplicationStatus } from '@/types/database';
import { APPLICATION_STATUS_LABELS, PRODUCT_LABELS } from '@/types/database';
import { useState } from 'react';

// Mock data
const mockApplications = [
  {
    id: '1',
    application_number: 'NC-A-20260128-00001',
    lead_number: 'NC-L-20260128-00001',
    customer_name: 'Rajesh Kumar',
    product_type: 'business_loan' as const,
    requested_amount: 500000,
    bre_score: 720,
    bre_decision: 'stp_approved' as const,
    status: 'underwriting' as ApplicationStatus,
    ro_name: 'Amit Singh',
    created_at: new Date().toISOString(),
    priority: 'high',
  },
  {
    id: '2',
    application_number: 'NC-A-20260127-00005',
    lead_number: 'NC-L-20260127-00005',
    customer_name: 'Priya Sharma',
    product_type: 'personal_loan' as const,
    requested_amount: 200000,
    bre_score: 650,
    bre_decision: 'non_stp' as const,
    status: 'pending_approval' as ApplicationStatus,
    ro_name: 'Rahul Verma',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    priority: 'medium',
  },
  {
    id: '3',
    application_number: 'NC-A-20260126-00012',
    lead_number: 'NC-L-20260126-00012',
    customer_name: 'Amit Patel',
    product_type: 'stpl' as const,
    requested_amount: 100000,
    bre_score: 580,
    bre_decision: 'deviation' as const,
    status: 'deviation' as ApplicationStatus,
    ro_name: 'Sneha Gupta',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    priority: 'high',
  },
];

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

function getBREDecisionBadge(decision: string) {
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
  const { hasRole, isManager } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredApplications = mockApplications.filter(app => {
    const matchesSearch = 
      app.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.application_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Underwriting Queue</h1>
        <p className="text-muted-foreground">Review and process loan applications</p>
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
                <p className="text-2xl font-bold">12</p>
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
                <p className="text-2xl font-bold">5</p>
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
                <p className="text-2xl font-bold">3</p>
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
                <p className="text-2xl font-bold">28</p>
                <p className="text-sm text-muted-foreground">Approved Today</p>
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
        {filteredApplications.map((app) => (
          <Card key={app.id} className="card-hover cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold">{app.customer_name}</h3>
                    <Badge variant="outline" className={`${getStatusColor(app.status)} border`}>
                      {APPLICATION_STATUS_LABELS[app.status]}
                    </Badge>
                    {getBREDecisionBadge(app.bre_decision)}
                    {app.priority === 'high' && (
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
                      RO: {app.ro_name}
                    </span>
                    <span>BRE Score: {app.bre_score}</span>
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
        ))}
      </div>
    </div>
  );
}
