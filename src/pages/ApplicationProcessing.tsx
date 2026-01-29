import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  User, 
  Building2, 
  FileText, 
  Calculator, 
  Gift, 
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Send,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { FOIRCalculator } from '@/components/bre/FOIRCalculator';
import { BREResults } from '@/components/bre/BREResults';
import { OfferCards } from '@/components/bre/OfferCards';
import { DocumentUpload, DEFAULT_DOCUMENT_TYPES } from '@/components/documents/DocumentUpload';
import { APIVerificationPanel } from '@/components/documents/APIVerificationPanel';
import { WorkflowTimeline } from '@/components/workflow/WorkflowTimeline';
import { CAMSheet } from '@/components/cam/CAMSheet';
import { CounterOfferForm } from '@/components/approvals/CounterOfferForm';
import { runBRE, generateOffers, type FOIRResult, type FOIRInput, type BREResult, type LoanOffer } from '@/lib/bre-engine';
import type { Tables } from '@/integrations/supabase/types';

type Lead = Tables<'leads'>;
type Application = Tables<'applications'>;

export function ApplicationProcessing() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  
  const [application, setApplication] = useState<Application | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // BRE/FOIR State
  const [foirInput, setFoirInput] = useState<FOIRInput | null>(null);
  const [foirResult, setFoirResult] = useState<FOIRResult | null>(null);
  const [breResult, setBREResult] = useState<BREResult | null>(null);
  const [offers, setOffers] = useState<{ offer1: LoanOffer; offer2: LoanOffer } | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<LoanOffer | null>(null);
  
  // Documents State
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{
    documentType: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    uploadedAt: string;
    latitude?: number;
    longitude?: number;
    address?: string;
  }>>([]);
  
  // CAM Notes
  const [camNotes, setCamNotes] = useState('');
  const [camRecommendation, setCamRecommendation] = useState('');
  
  useEffect(() => {
    if (applicationId) {
      fetchApplicationData();
    }
  }, [applicationId]);
  
  const fetchApplicationData = async () => {
    setIsLoading(true);
    try {
      // Fetch application
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();
      
      if (appError) throw appError;
      setApplication(appData);
      
      // Prefill FOIR data if exists
      if (appData.monthly_turnover) {
        setFoirInput({
          monthlyTurnover: Number(appData.monthly_turnover),
          grossMarginPercent: Number(appData.gross_margin_percent) || 25,
          monthlyExpenses: Number(appData.monthly_expenses) || 0,
          existingObligations: Number(appData.existing_obligations) || 0,
        });
      }
      
      setCamNotes(appData.cam_notes || '');
      setCamRecommendation(appData.cam_recommendation || '');
      
      // Fetch lead
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', appData.lead_id)
        .single();
      
      if (leadError) throw leadError;
      setLead(leadData);
      
      // Fetch documents
      const { data: docsData } = await supabase
        .from('documents')
        .select('*')
        .eq('lead_id', appData.lead_id);
      
      if (docsData) {
        setUploadedDocuments(docsData.map(doc => ({
          documentType: doc.document_type,
          fileName: doc.document_name,
          filePath: doc.file_path,
          fileSize: doc.file_size || 0,
          uploadedAt: doc.created_at,
          latitude: doc.capture_latitude ? Number(doc.capture_latitude) : undefined,
          longitude: doc.capture_longitude ? Number(doc.capture_longitude) : undefined,
          address: doc.capture_address || undefined,
        })));
      }
      
    } catch (error) {
      console.error('Error fetching application:', error);
      toast.error('Failed to load application');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFOIRCalculate = useCallback((result: FOIRResult, input: FOIRInput) => {
    setFoirResult(result);
    setFoirInput(input);
    
    if (lead && result) {
      const bre = runBRE(lead, result);
      setBREResult(bre);
      
      if (bre.decision !== 'rejected') {
        const generatedOffers = generateOffers(lead, bre);
        setOffers(generatedOffers);
      }
    }
  }, [lead]);
  
  const handleSelectOffer = (offer: LoanOffer) => {
    setSelectedOffer(offer);
  };
  
  const handleDocumentUpload = (doc: typeof uploadedDocuments[0]) => {
    setUploadedDocuments(prev => [...prev, doc]);
  };
  
  const saveProgress = async () => {
    if (!application || !user) return;
    
    setIsSaving(true);
    try {
      const updates: Partial<Application> = {
        monthly_turnover: foirInput?.monthlyTurnover,
        gross_margin_percent: foirInput?.grossMarginPercent,
        monthly_expenses: foirInput?.monthlyExpenses,
        existing_obligations: foirInput?.existingObligations,
        calculated_foir: foirResult?.foir,
        max_eligible_emi: foirResult?.maxEligibleEMI,
        bre_score: breResult?.score,
        bre_decision: breResult?.decision,
        bre_reasons: breResult?.reasons as unknown as Application['bre_reasons'],
        bre_processed_at: breResult ? new Date().toISOString() : null,
        cam_notes: camNotes,
        cam_recommendation: camRecommendation,
      };
      
      if (offers) {
        updates.offer1_amount = offers.offer1.amount;
        updates.offer1_tenure_months = offers.offer1.tenureMonths;
        updates.offer1_interest_rate = offers.offer1.interestRate;
        updates.offer1_emi = offers.offer1.emi;
        updates.offer2_amount = offers.offer2.amount;
        updates.offer2_tenure_months = offers.offer2.tenureMonths;
        updates.offer2_interest_rate = offers.offer2.interestRate;
        updates.offer2_emi = offers.offer2.emi;
      }
      
      if (selectedOffer) {
        updates.selected_offer = selectedOffer.id;
        updates.final_amount = selectedOffer.amount;
        updates.final_tenure_months = selectedOffer.tenureMonths;
        updates.final_interest_rate = selectedOffer.interestRate;
        updates.final_emi = selectedOffer.emi;
      }
      
      const { error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', application.id);
      
      if (error) throw error;
      toast.success('Progress saved');
      
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };
  
  const submitDecision = async (decision: 'approve' | 'reject' | 'deviation') => {
    if (!application || !user) return;
    
    setIsSaving(true);
    try {
      let newStatus: Application['status'];
      const updates: Partial<Application> = {};
      
      if (decision === 'approve') {
        newStatus = 'approved';
        updates.approved_by = user.id;
        updates.approved_at = new Date().toISOString();
      } else if (decision === 'reject') {
        newStatus = 'rejected';
        updates.rejected_by = user.id;
        updates.rejected_at = new Date().toISOString();
        updates.rejection_reason = camNotes;
      } else {
        newStatus = 'deviation';
        updates.has_deviation = true;
        updates.deviation_reason = camNotes;
      }
      
      updates.status = newStatus;
      
      const { error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', application.id);
      
      if (error) throw error;
      
      // Log workflow history
      await supabase.from('workflow_history').insert([{
        application_id: application.id,
        action: decision,
        from_status: application.status,
        to_status: newStatus,
        performed_by: user.id,
        notes: camNotes,
      }]);
      
      toast.success(`Application ${decision}ed successfully`);
      navigate('/underwriting');
      
    } catch (error) {
      console.error('Error submitting decision:', error);
      toast.error('Failed to submit decision');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!application || !lead) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Application not found</p>
        <Button variant="link" onClick={() => navigate('/underwriting')}>
          Back to Underwriting
        </Button>
      </div>
    );
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/underwriting')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{application.application_number}</h1>
            <p className="text-muted-foreground">{lead.customer_name} • {formatCurrency(lead.requested_amount)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={
            application.status === 'approved' ? 'default' :
            application.status === 'rejected' ? 'destructive' :
            'secondary'
          }>
            {application.status.replace('_', ' ').toUpperCase()}
          </Badge>
          <Button variant="outline" onClick={saveProgress} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Progress'}
          </Button>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="customer" className="space-y-4">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="customer" className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span className="hidden md:inline">Customer</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-1">
            <Building2 className="w-4 h-4" />
            <span className="hidden md:inline">Business</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span className="hidden md:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="foir" className="flex items-center gap-1">
            <Calculator className="w-4 h-4" />
            <span className="hidden md:inline">FOIR</span>
          </TabsTrigger>
          <TabsTrigger value="offers" className="flex items-center gap-1">
            <Gift className="w-4 h-4" />
            <span className="hidden md:inline">Offers</span>
          </TabsTrigger>
          <TabsTrigger value="decision" className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            <span className="hidden md:inline">Decision</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span className="hidden md:inline">History</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Customer Tab */}
        <TabsContent value="customer">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Name</div>
                  <div className="font-medium">{lead.customer_name}</div>
                  <div className="text-muted-foreground">Phone</div>
                  <div className="font-medium">{lead.customer_phone}</div>
                  <div className="text-muted-foreground">Email</div>
                  <div className="font-medium">{lead.customer_email || '-'}</div>
                  <div className="text-muted-foreground">PAN</div>
                  <div className="font-medium">{lead.customer_pan || '-'}</div>
                  <div className="text-muted-foreground">Aadhaar</div>
                  <div className="font-medium">{lead.customer_aadhaar ? `XXXX-XXXX-${lead.customer_aadhaar.slice(-4)}` : '-'}</div>
                  <div className="text-muted-foreground">DOB</div>
                  <div className="font-medium">{lead.date_of_birth || '-'}</div>
                  <div className="text-muted-foreground">Gender</div>
                  <div className="font-medium">{lead.gender || '-'}</div>
                </div>
              </CardContent>
            </Card>
            
            {lead.co_applicant_name && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Co-Applicant Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Name</div>
                    <div className="font-medium">{lead.co_applicant_name}</div>
                    <div className="text-muted-foreground">Phone</div>
                    <div className="font-medium">{lead.co_applicant_phone || '-'}</div>
                    <div className="text-muted-foreground">Relation</div>
                    <div className="font-medium">{lead.co_applicant_relation || '-'}</div>
                    <div className="text-muted-foreground">PAN</div>
                    <div className="font-medium">{lead.co_applicant_pan || '-'}</div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Loan Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Product</div>
                  <div className="font-medium">{lead.product_type.replace('_', ' ')}</div>
                  <div className="text-muted-foreground">Amount</div>
                  <div className="font-medium">{formatCurrency(lead.requested_amount)}</div>
                  <div className="text-muted-foreground">Tenure</div>
                  <div className="font-medium">{lead.requested_tenure_months || 36} months</div>
                  <div className="text-muted-foreground">Purpose</div>
                  <div className="font-medium">{lead.purpose_of_loan || '-'}</div>
                </div>
              </CardContent>
            </Card>
            
            <APIVerificationPanel lead={lead} applicationId={application.id} />
          </div>
        </TabsContent>
        
        {/* Business Tab */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Business Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Business Name</div>
                  <div className="font-medium">{lead.business_name || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Business Type</div>
                  <div className="font-medium">{lead.business_type || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Vintage</div>
                  <div className="font-medium">{lead.business_vintage_years ? `${lead.business_vintage_years} years` : '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">GST Number</div>
                  <div className="font-medium">{lead.gst_number || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Udyam Number</div>
                  <div className="font-medium">{lead.udyam_number || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Property Ownership</div>
                  <div className="font-medium">{lead.has_property ? 'Yes' : 'No'}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-muted-foreground">Business Address</div>
                  <div className="font-medium">{lead.business_address || '-'}</div>
                </div>
                {lead.has_property && (
                  <>
                    <div>
                      <div className="text-muted-foreground">Property Type</div>
                      <div className="font-medium">{lead.property_type || '-'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Property Value</div>
                      <div className="font-medium">{lead.property_value ? formatCurrency(Number(lead.property_value)) : '-'}</div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Documents Tab */}
        <TabsContent value="documents">
          <DocumentUpload
            leadId={lead.id}
            applicationId={application.id}
            documentTypes={DEFAULT_DOCUMENT_TYPES}
            uploadedDocuments={uploadedDocuments}
            onUploadComplete={handleDocumentUpload}
          />
        </TabsContent>
        
        {/* FOIR Tab */}
        <TabsContent value="foir">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FOIRCalculator 
              onCalculate={handleFOIRCalculate}
              initialValues={foirInput || undefined}
            />
            <BREResults result={breResult} />
          </div>
        </TabsContent>
        
        {/* Offers Tab */}
        <TabsContent value="offers">
          <OfferCards
            offer1={offers?.offer1 || null}
            offer2={offers?.offer2 || null}
            onSelectOffer={handleSelectOffer}
            selectedOfferId={selectedOffer?.id}
            showCounterOffer={hasRole('sales_manager') || hasRole('regional_head') || hasRole('zonal_head') || hasRole('ceo') || hasRole('admin')}
          />
        </TabsContent>
        
        {/* Decision Tab */}
        <TabsContent value="decision">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">CAM Notes</CardTitle>
                <CardDescription>Credit Appraisal Memorandum</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Observations & Analysis</Label>
                  <Textarea
                    placeholder="Enter your observations, analysis, and notes..."
                    value={camNotes}
                    onChange={(e) => setCamNotes(e.target.value)}
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recommendation</Label>
                  <Textarea
                    placeholder="Enter your recommendation..."
                    value={camRecommendation}
                    onChange={(e) => setCamRecommendation(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Decision Summary */}
            {breResult && selectedOffer && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Decision Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-muted-foreground">BRE Score</div>
                      <div className="text-lg font-bold">{breResult.score}/100</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-muted-foreground">BRE Decision</div>
                      <div className="text-lg font-bold">{breResult.decision.replace('_', ' ')}</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-muted-foreground">Selected Offer</div>
                      <div className="text-lg font-bold">{formatCurrency(selectedOffer.amount)}</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-muted-foreground">EMI</div>
                      <div className="text-lg font-bold">{formatCurrency(selectedOffer.emi)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* CAM Sheet */}
            <CAMSheet lead={lead} application={application} />
            
            {/* Counter Offer (for managers only) */}
            {application.status === 'deviation' && (hasRole('sales_manager') || hasRole('regional_head') || hasRole('zonal_head') || hasRole('ceo') || hasRole('admin')) && (
              <div className="flex justify-center">
                <CounterOfferForm
                  applicationId={application.id}
                  currentAmount={lead.requested_amount}
                  currentTenure={lead.requested_tenure_months || 36}
                  currentRate={application.offer1_interest_rate ? Number(application.offer1_interest_rate) : 18}
                  onSuccess={fetchApplicationData}
                />
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => submitDecision('approve')}
                disabled={isSaving || !selectedOffer}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button 
                variant="outline"
                className="flex-1 border-amber-500 text-amber-600 hover:bg-amber-50"
                onClick={() => submitDecision('deviation')}
                disabled={isSaving}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Send for Deviation
              </Button>
              <Button 
                variant="destructive"
                className="flex-1"
                onClick={() => submitDecision('reject')}
                disabled={isSaving}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history">
          <WorkflowTimeline applicationId={application.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
