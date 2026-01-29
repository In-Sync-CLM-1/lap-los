import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Save,
  Send,
  Loader2,
  User,
  Briefcase,
  Home,
  CreditCard,
  FileText,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Edit2,
  X,
  Camera,
  Upload
} from 'lucide-react';
import { format } from 'date-fns';
import type { Lead, LeadStatus } from '@/types/database';
import { LEAD_STATUS_LABELS, PRODUCT_LABELS } from '@/types/database';
import { useLeadConversion } from '@/hooks/useLeadConversion';

function getStatusVariant(status: LeadStatus): string {
  switch (status) {
    case 'new': return 'status-new border';
    case 'in_progress': return 'status-in-progress border';
    case 'documents_pending': return 'bg-warning/15 text-warning border-warning/30 border';
    case 'submitted': return 'bg-info/15 text-info border-info/30 border';
    case 'approved': return 'status-approved border';
    case 'rejected': return 'status-rejected border';
    default: return 'status-pending border';
  }
}

export function LeadDetail() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { user, hasRole, isManager } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const { convertToApplication, isConverting } = useLeadConversion();

  // Fetch lead data
  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Lead not found');
      return data as Lead;
    },
    enabled: !!leadId,
  });

  // Form state for editing
  const [formData, setFormData] = useState<Partial<Lead>>({});

  // Initialize form data when lead is loaded
  const initFormData = () => {
    if (lead) {
      setFormData({
        customer_name: lead.customer_name,
        customer_phone: lead.customer_phone,
        customer_email: lead.customer_email,
        customer_pan: lead.customer_pan,
        business_name: lead.business_name,
        business_type: lead.business_type,
        business_address: lead.business_address,
        business_vintage_years: lead.business_vintage_years,
        gst_number: lead.gst_number,
        requested_amount: lead.requested_amount,
        requested_tenure_months: lead.requested_tenure_months,
        purpose_of_loan: lead.purpose_of_loan,
      });
    }
  };

  // Update lead mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Lead>) => {
      const { error } = await supabase
        .from('leads')
        .update(updates as never)
        .eq('id', leadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsEditing(false);
      toast({
        title: 'Lead updated',
        description: 'Changes saved successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating lead',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: async (newStatus: LeadStatus) => {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus } as never)
        .eq('id', leadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: 'Status updated',
        description: 'Lead status changed successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleEdit = () => {
    initFormData();
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleStatusChange = (newStatus: LeadStatus) => {
    statusMutation.mutate(newStatus);
  };

  const handleConvert = async () => {
    if (!lead) return;
    const result = await convertToApplication(lead);
    if (result.success && result.applicationId) {
      navigate(`/applications/${result.applicationId}/process`);
    }
  };

  const canEdit = lead && ['new', 'in_progress', 'documents_pending'].includes(lead.status);
  const canConvert = (hasRole('credit_officer') || isManager()) && lead?.status === 'submitted';
  const isOwner = lead?.ro_id === user?.id;
  const canModify = isOwner || hasRole('credit_officer') || isManager();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/leads')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leads
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="font-medium mb-1">Lead not found</h3>
            <p className="text-sm text-muted-foreground">
              The lead you're looking for doesn't exist or you don't have access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/leads')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{lead.customer_name}</h1>
              <Badge variant="outline" className={getStatusVariant(lead.status)}>
                {LEAD_STATUS_LABELS[lead.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">{lead.lead_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && canModify && !isEditing && (
            <Button variant="outline" onClick={handleEdit}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {isEditing && (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
            </>
          )}
          {canConvert && (
            <Button onClick={handleConvert} disabled={isConverting}>
              {isConverting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Convert to Application
            </Button>
          )}
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{(lead.requested_amount / 100000).toFixed(1)}L</p>
                <p className="text-sm text-muted-foreground">Requested Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lead.requested_tenure_months || '-'}M</p>
                <p className="text-sm text-muted-foreground">Tenure</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-lg font-bold truncate">{PRODUCT_LABELS[lead.product_type]}</p>
                <p className="text-sm text-muted-foreground">Product</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-lg font-bold">{format(new Date(lead.created_at), 'dd MMM')}</p>
                <p className="text-sm text-muted-foreground">Created</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Actions */}
      {canModify && !isEditing && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Quick Actions</span>
              <div className="flex gap-2">
                {lead.status === 'new' && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange('in_progress')}>
                    Mark In Progress
                  </Button>
                )}
                {lead.status === 'in_progress' && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange('documents_pending')}>
                    Request Documents
                  </Button>
                )}
                {['new', 'in_progress', 'documents_pending'].includes(lead.status) && (
                  <Button size="sm" onClick={() => handleStatusChange('submitted')}>
                    Submit for Processing
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details" className="gap-2">
            <User className="w-4 h-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="w-4 h-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6 space-y-6">
          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  {isEditing ? (
                    <Input
                      value={formData.customer_name || ''}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    />
                  ) : (
                    <p className="font-medium">{lead.customer_name}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  {isEditing ? (
                    <Input
                      value={formData.customer_phone || ''}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    />
                  ) : (
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {lead.customer_phone}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  {isEditing ? (
                    <Input
                      value={formData.customer_email || ''}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    />
                  ) : (
                    <p className="font-medium flex items-center gap-2">
                      {lead.customer_email ? (
                        <>
                          <Mail className="w-4 h-4" />
                          {lead.customer_email}
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">PAN</Label>
                  <p className="font-medium">{lead.customer_pan || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Gender</Label>
                  <p className="font-medium capitalize">{lead.gender || '-'}</p>
                </div>
                {lead.capture_address && (
                  <div>
                    <Label className="text-muted-foreground">Capture Location</Label>
                    <p className="font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {lead.capture_address}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Business Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label className="text-muted-foreground">Business Name</Label>
                  {isEditing ? (
                    <Input
                      value={formData.business_name || ''}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    />
                  ) : (
                    <p className="font-medium">{lead.business_name || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Business Type</Label>
                  <p className="font-medium capitalize">{lead.business_type || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vintage</Label>
                  <p className="font-medium">
                    {lead.business_vintage_years ? `${lead.business_vintage_years} years` : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">GST Number</Label>
                  <p className="font-medium">{lead.gst_number || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Udyam Number</Label>
                  <p className="font-medium">{lead.udyam_number || '-'}</p>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <Label className="text-muted-foreground">Business Address</Label>
                  <p className="font-medium">{lead.business_address || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          {lead.has_property && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <Label className="text-muted-foreground">Property Type</Label>
                    <p className="font-medium capitalize">{lead.property_type || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estimated Value</Label>
                    <p className="font-medium">
                      {lead.property_value ? `₹${(lead.property_value / 100000).toFixed(1)}L` : '-'}
                    </p>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <Label className="text-muted-foreground">Property Address</Label>
                    <p className="font-medium">{lead.property_address || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loan Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Loan Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label className="text-muted-foreground">Product Type</Label>
                  <p className="font-medium">{PRODUCT_LABELS[lead.product_type]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Requested Amount</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={formData.requested_amount || ''}
                      onChange={(e) => setFormData({ ...formData, requested_amount: parseFloat(e.target.value) })}
                    />
                  ) : (
                    <p className="font-medium">₹{lead.requested_amount.toLocaleString()}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Tenure</Label>
                  <p className="font-medium">
                    {lead.requested_tenure_months ? `${lead.requested_tenure_months} months` : '-'}
                  </p>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <Label className="text-muted-foreground">Purpose of Loan</Label>
                  {isEditing ? (
                    <Textarea
                      value={formData.purpose_of_loan || ''}
                      onChange={(e) => setFormData({ ...formData, purpose_of_loan: e.target.value })}
                    />
                  ) : (
                    <p className="font-medium">{lead.purpose_of_loan || '-'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="mb-2">Document upload available in full processing mode</p>
                <p className="text-sm">Submit this lead to enable document collection</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
