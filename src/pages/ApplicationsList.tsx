import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Search, 
  ChevronRight,
  Calendar,
  RefreshCw,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import type { ApplicationStatus, ProductType } from '@/types/database';
import { APPLICATION_STATUS_LABELS, PRODUCT_LABELS } from '@/types/database';

// Mock data
const mockApplications = [
  {
    id: '1',
    application_number: 'NC-A-20260128-00001',
    customer_name: 'Rajesh Kumar',
    product_type: 'business_loan' as ProductType,
    final_amount: 500000,
    status: 'underwriting' as ApplicationStatus,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    application_number: 'NC-A-20260127-00005',
    customer_name: 'Priya Sharma',
    product_type: 'personal_loan' as ProductType,
    final_amount: 200000,
    status: 'approved' as ApplicationStatus,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    application_number: 'NC-A-20260126-00012',
    customer_name: 'Amit Patel',
    product_type: 'stpl' as ProductType,
    final_amount: 100000,
    status: 'disbursed' as ApplicationStatus,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

function getStatusColor(status: ApplicationStatus): string {
  switch (status) {
    case 'underwriting': return 'bg-info/15 text-info border-info/30';
    case 'pending_approval': return 'bg-warning/15 text-warning border-warning/30';
    case 'approved': return 'bg-success/15 text-success border-success/30';
    case 'rejected': return 'bg-destructive/15 text-destructive border-destructive/30';
    case 'disbursed': return 'bg-success/15 text-success border-success/30';
    default: return 'bg-muted text-muted-foreground';
  }
}

export function ApplicationsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-muted-foreground">Track all loan applications</p>
        </div>
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
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
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
                Try adjusting your filters
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((app) => (
            <Card key={app.id} className="card-hover cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{app.customer_name}</h3>
                      <Badge variant="outline" className={`${getStatusColor(app.status)} border`}>
                        {APPLICATION_STATUS_LABELS[app.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {app.application_number} • {PRODUCT_LABELS[app.product_type]}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(app.created_at), 'dd MMM yyyy')}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg">
                      ₹{(app.final_amount / 100000).toFixed(1)}L
                    </p>
                    <ChevronRight className="w-5 h-5 text-muted-foreground mt-2 ml-auto" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
