import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
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
  Phone,
  MapPin,
  Calendar,
  ArrowRightCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import type { Lead, LeadStatus, ProductType } from '@/types/database';
import { LEAD_STATUS_LABELS, PRODUCT_LABELS } from '@/types/database';
import { useLeadConversion } from '@/hooks/useLeadConversion';
import { LeadScoreBadge } from '@/components/leads/LeadScoreCard';

function getStatusVariant(status: LeadStatus): string {
  switch (status) {
    case 'new': return 'status-new border';
    case 'in_progress': return 'status-in-progress border';
    case 'documents_pending': return 'bg-warning/15 text-warning border-warning/30 border';
    case 'submitted': return 'bg-info/15 text-info border-info/30 border';
    case 'under_review': return 'bg-primary/15 text-primary border-primary/30 border';
    case 'approved': return 'status-approved border';
    case 'rejected': return 'status-rejected border';
    case 'disbursed': return 'bg-success/15 text-success border-success/30 border';
    case 'closed': return 'status-pending border';
    default: return 'status-pending border';
  }
}

export function LeadsList() {
  const { user, hasRole, isManager } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const { convertToApplication, isConverting } = useLeadConversion();
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null);

  // Fetch leads from database
  const { data: leads = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['leads', statusFilter, productFilter],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as LeadStatus);
      }
      if (productFilter !== 'all') {
        query = query.eq('product_type', productFilter as ProductType);
      }

      const { data, error } = await query;
      if (error) throw error;
      // Cast to our Lead type - the database may have additional fields
      return (data || []) as unknown as Lead[];
    },
  });

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lead_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.customer_phone.includes(searchTerm);
    
    return matchesSearch;
  });

  const handleConvertToApplication = async (lead: Lead, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConvertingLeadId(lead.id);
    
    const result = await convertToApplication(lead);
    
    if (result.success && result.applicationId) {
      navigate(`/applications/${result.applicationId}/process`);
    }
    
    setConvertingLeadId(null);
  };

  const canConvert = hasRole('credit_officer') || isManager();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Manage and track all your leads</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild className="gap-2">
            <Link to="/leads/new">
              <Plus className="w-4 h-4" />
              New Lead
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or lead number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {Object.entries(PRODUCT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
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
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No leads found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || productFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start by creating your first lead'}
              </p>
              {!searchTerm && statusFilter === 'all' && productFilter === 'all' && (
                <Button asChild className="mt-4">
                  <Link to="/leads/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Lead
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <Link key={lead.id} to={`/leads/${lead.id}`}>
              <Card className="card-hover cursor-pointer">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{lead.customer_name}</h3>
                          <Badge variant="outline" className={getStatusVariant(lead.status)}>
                            {LEAD_STATUS_LABELS[lead.status]}
                          </Badge>
                          <LeadScoreBadge score={lead.lead_score} temperature={lead.lead_temperature} />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {lead.lead_number} • {PRODUCT_LABELS[lead.product_type]}
                        </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {lead.customer_phone}
                        </span>
                        {lead.capture_address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {lead.capture_address}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(lead.created_at), 'dd MMM yyyy')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg">
                        ₹{(lead.requested_amount / 100000).toFixed(1)}L
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lead.requested_tenure_months}M tenure
                      </p>
                      <div className="flex items-center gap-2 mt-2 justify-end">
                        {canConvert && lead.status === 'submitted' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs"
                            onClick={(e) => handleConvertToApplication(lead, e)}
                            disabled={convertingLeadId === lead.id}
                          >
                            {convertingLeadId === lead.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <ArrowRightCircle className="w-3 h-3" />
                            )}
                            Process
                          </Button>
                        )}
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
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
