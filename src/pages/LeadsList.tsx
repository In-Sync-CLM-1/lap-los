import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Filter, 
  ChevronRight,
  Phone,
  MapPin,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import type { Lead, LeadStatus, ProductType } from '@/types/database';
import { LEAD_STATUS_LABELS, PRODUCT_LABELS } from '@/types/database';

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
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');

  // Mock data for demo
  const mockLeads: Lead[] = [
    {
      id: '1',
      lead_number: 'NC-L-20260128-00001',
      ro_id: user?.id || '',
      customer_name: 'Rajesh Kumar',
      customer_phone: '+91 98765 43210',
      customer_email: 'rajesh@email.com',
      customer_pan: 'ABCDE1234F',
      customer_aadhaar: null,
      date_of_birth: null,
      gender: 'Male',
      co_applicant_name: null,
      co_applicant_phone: null,
      co_applicant_pan: null,
      co_applicant_aadhaar: null,
      co_applicant_relation: null,
      business_name: 'Kumar Traders',
      business_type: 'Retail',
      business_address: '123 Market Street, Mumbai',
      business_vintage_years: 5,
      gst_number: '27ABCDE1234F1Z5',
      udyam_number: null,
      has_property: true,
      property_type: 'Commercial',
      property_address: '123 Market Street',
      property_value: 5000000,
      product_type: 'business_loan',
      requested_amount: 500000,
      requested_tenure_months: 36,
      purpose_of_loan: 'Business Expansion',
      source_channel: 'physical',
      partner_code: null,
      capture_latitude: 19.0760,
      capture_longitude: 72.8777,
      capture_address: 'Mumbai, Maharashtra',
      status: 'new',
      is_dedupe_clean: null,
      dedupe_checked_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      lead_number: 'NC-L-20260128-00002',
      ro_id: user?.id || '',
      customer_name: 'Priya Sharma',
      customer_phone: '+91 87654 32109',
      customer_email: 'priya@email.com',
      customer_pan: null,
      customer_aadhaar: null,
      date_of_birth: null,
      gender: 'Female',
      co_applicant_name: null,
      co_applicant_phone: null,
      co_applicant_pan: null,
      co_applicant_aadhaar: null,
      co_applicant_relation: null,
      business_name: 'Sharma Boutique',
      business_type: 'Fashion',
      business_address: '45 Fashion Lane, Delhi',
      business_vintage_years: 3,
      gst_number: null,
      udyam_number: null,
      has_property: false,
      property_type: null,
      property_address: null,
      property_value: null,
      product_type: 'personal_loan',
      requested_amount: 200000,
      requested_tenure_months: 24,
      purpose_of_loan: 'Inventory Purchase',
      source_channel: 'physical',
      partner_code: null,
      capture_latitude: 28.6139,
      capture_longitude: 77.2090,
      capture_address: 'Delhi',
      status: 'in_progress',
      is_dedupe_clean: true,
      dedupe_checked_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      lead_number: 'NC-L-20260128-00003',
      ro_id: user?.id || '',
      customer_name: 'Amit Patel',
      customer_phone: '+91 76543 21098',
      customer_email: null,
      customer_pan: 'FGHIJ5678K',
      customer_aadhaar: null,
      date_of_birth: null,
      gender: 'Male',
      co_applicant_name: 'Kavita Patel',
      co_applicant_phone: '+91 65432 10987',
      co_applicant_pan: null,
      co_applicant_aadhaar: null,
      co_applicant_relation: 'Spouse',
      business_name: 'Patel Electronics',
      business_type: 'Electronics',
      business_address: '78 Tech Park, Bangalore',
      business_vintage_years: 8,
      gst_number: '29FGHIJ5678K1Z9',
      udyam_number: 'UDYAM-KA-01-0012345',
      has_property: true,
      property_type: 'Residential',
      property_address: '78 Tech Park, Bangalore',
      property_value: 8000000,
      product_type: 'stpl',
      requested_amount: 100000,
      requested_tenure_months: 12,
      purpose_of_loan: 'Working Capital',
      source_channel: 'physical',
      partner_code: null,
      capture_latitude: 12.9716,
      capture_longitude: 77.5946,
      capture_address: 'Bangalore, Karnataka',
      status: 'submitted',
      is_dedupe_clean: true,
      dedupe_checked_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLeads(mockLeads);
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lead_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.customer_phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesProduct = productFilter === 'all' || lead.product_type === productFilter;
    
    return matchesSearch && matchesStatus && matchesProduct;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Manage and track all your leads</p>
        </div>
        <Button asChild className="gap-2 w-full sm:w-auto">
          <Link to="/leads/new">
            <Plus className="w-4 h-4" />
            New Lead
          </Link>
        </Button>
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
                      <ChevronRight className="w-5 h-5 text-muted-foreground mt-2 ml-auto" />
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
