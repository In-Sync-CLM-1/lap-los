import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  CreditCard,
  Building,
  Calendar,
  CheckCircle2,
  Loader2,
  Send
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Application = Tables<'applications'>;
type Lead = Tables<'leads'>;

export function Disbursal() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [application, setApplication] = useState<Application | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    bankName: '',
  });
  
  useEffect(() => {
    if (applicationId) {
      fetchData();
    }
  }, [applicationId]);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();
      
      if (appError) throw appError;
      setApplication(appData);
      
      setBankDetails({
        accountNumber: appData.bank_account_number || '',
        ifscCode: appData.bank_ifsc || '',
        bankName: appData.bank_name || '',
      });
      
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', appData.lead_id)
        .single();
      
      if (leadError) throw leadError;
      setLead(leadData);
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveBankDetails = async () => {
    if (!application) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          bank_account_number: bankDetails.accountNumber,
          bank_ifsc: bankDetails.ifscCode,
          bank_name: bankDetails.bankName,
        })
        .eq('id', application.id);
      
      if (error) throw error;
      toast.success('Bank details saved');
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };
  
  const generateSanctionLetter = async () => {
    if (!application) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          sanction_letter_generated_at: new Date().toISOString(),
        })
        .eq('id', application.id);
      
      if (error) throw error;
      
      toast.success('Sanction letter generated');
      fetchData();
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate');
    } finally {
      setIsSaving(false);
    }
  };
  
  const processDisbursement = async () => {
    if (!application || !user) return;
    
    if (!bankDetails.accountNumber || !bankDetails.ifscCode) {
      toast.error('Please fill bank details first');
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          status: 'disbursed',
          disbursed_at: new Date().toISOString(),
          disbursed_amount: application.final_amount,
          bank_account_number: bankDetails.accountNumber,
          bank_ifsc: bankDetails.ifscCode,
          bank_name: bankDetails.bankName,
        })
        .eq('id', application.id);
      
      if (error) throw error;
      
      // Log workflow history
      await supabase.from('workflow_history').insert([{
        application_id: application.id,
        action: 'disbursed',
        from_status: application.status,
        to_status: 'disbursed',
        performed_by: user.id,
        notes: `Disbursed ${formatCurrency(Number(application.final_amount))} to A/C ${bankDetails.accountNumber}`,
      }]);
      
      toast.success('Disbursement processed successfully!');
      navigate('/applications');
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to process disbursement');
    } finally {
      setIsSaving(false);
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const calculateEMISchedule = () => {
    if (!application?.final_amount || !application?.final_tenure_months || !application?.final_emi) {
      return [];
    }
    
    const schedule = [];
    let balance = Number(application.final_amount);
    const monthlyRate = Number(application.final_interest_rate) / 100 / 12;
    const emi = Number(application.final_emi);
    
    for (let i = 1; i <= Math.min(Number(application.final_tenure_months), 12); i++) {
      const interest = balance * monthlyRate;
      const principal = emi - interest;
      balance -= principal;
      
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      
      schedule.push({
        month: i,
        dueDate: dueDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        emi,
        principal,
        interest,
        balance: Math.max(0, balance),
      });
    }
    
    return schedule;
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
        <Button variant="link" onClick={() => navigate('/applications')}>
          Back to Applications
        </Button>
      </div>
    );
  }
  
  const emiSchedule = calculateEMISchedule();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/applications')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Disbursal</h1>
            <p className="text-muted-foreground">{application.application_number} • {lead.customer_name}</p>
          </div>
        </div>
        <Badge variant={application.status === 'disbursed' ? 'default' : 'secondary'}>
          {application.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Loan Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Loan Amount</p>
                <p className="text-xl font-bold">{formatCurrency(Number(application.final_amount) || 0)}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Interest Rate</p>
                <p className="text-xl font-bold">{application.final_interest_rate}% p.a.</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Tenure</p>
                <p className="text-xl font-bold">{application.final_tenure_months} months</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">EMI</p>
                <p className="text-xl font-bold">{formatCurrency(Number(application.final_emi) || 0)}</p>
              </div>
            </div>
            
            <Separator />
            
            {/* Sanction Letter */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Sanction Letter</p>
                  <p className="text-xs text-muted-foreground">
                    {application.sanction_letter_generated_at 
                      ? `Generated on ${new Date(application.sanction_letter_generated_at).toLocaleDateString()}`
                      : 'Not generated yet'}
                  </p>
                </div>
              </div>
              {application.sanction_letter_generated_at ? (
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              ) : (
                <Button size="sm" onClick={generateSanctionLetter} disabled={isSaving}>
                  Generate
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Bank Details
            </CardTitle>
            <CardDescription>Enter customer's bank account for disbursement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                placeholder="Enter account number"
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                disabled={application.status === 'disbursed'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ifscCode">IFSC Code</Label>
              <Input
                id="ifscCode"
                placeholder="e.g., HDFC0001234"
                value={bankDetails.ifscCode}
                onChange={(e) => setBankDetails(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                disabled={application.status === 'disbursed'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="e.g., HDFC Bank"
                value={bankDetails.bankName}
                onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                disabled={application.status === 'disbursed'}
              />
            </div>
            
            {application.status !== 'disbursed' && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={saveBankDetails}
                disabled={isSaving}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Save Bank Details
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* EMI Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Repayment Schedule (First 12 EMIs)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">#</th>
                  <th className="text-left p-2">Due Date</th>
                  <th className="text-right p-2">EMI</th>
                  <th className="text-right p-2">Principal</th>
                  <th className="text-right p-2">Interest</th>
                  <th className="text-right p-2">Balance</th>
                </tr>
              </thead>
              <tbody>
                {emiSchedule.map((row) => (
                  <tr key={row.month} className="border-b last:border-0">
                    <td className="p-2">{row.month}</td>
                    <td className="p-2">{row.dueDate}</td>
                    <td className="p-2 text-right font-medium">{formatCurrency(row.emi)}</td>
                    <td className="p-2 text-right">{formatCurrency(row.principal)}</td>
                    <td className="p-2 text-right text-muted-foreground">{formatCurrency(row.interest)}</td>
                    <td className="p-2 text-right">{formatCurrency(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {emiSchedule.length > 0 && application.final_tenure_months && Number(application.final_tenure_months) > 12 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Showing first 12 of {application.final_tenure_months} EMIs
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Disburse Button */}
      {application.status === 'approved' && (
        <Card className="border-primary/50">
          <CardContent className="pt-6">
            <Button 
              className="w-full h-12 text-lg"
              onClick={processDisbursement}
              disabled={isSaving || !bankDetails.accountNumber || !bankDetails.ifscCode}
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              Process Disbursement - {formatCurrency(Number(application.final_amount) || 0)}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              This will initiate NEFT transfer to the customer's bank account (mock)
            </p>
          </CardContent>
        </Card>
      )}
      
      {application.status === 'disbursed' && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3 text-green-700 dark:text-green-300">
              <CheckCircle2 className="w-8 h-8" />
              <div>
                <p className="text-lg font-bold">Disbursed Successfully</p>
                <p className="text-sm">
                  {formatCurrency(Number(application.disbursed_amount) || 0)} on {application.disbursed_at ? new Date(application.disbursed_at).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
