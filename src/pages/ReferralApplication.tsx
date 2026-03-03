import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PublicApplicationForm, ApplicationFormData } from '@/components/referral/PublicApplicationForm';
import { generateLeadNumber } from '@/lib/referral-utils';
import { Loader2, AlertCircle, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ReferrerInfo {
  userId: string;
  fullName: string;
  referralCode: string;
}

export function ReferralApplication() {
  const { referralCode } = useParams<{ referralCode: string }>();
  const [loading, setLoading] = useState(true);
  const [referrer, setReferrer] = useState<ReferrerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [leadNumber, setLeadNumber] = useState<string>();

  useEffect(() => {
    async function fetchReferrer() {
      if (!referralCode) {
        setError('Invalid referral link');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('user_id, full_name, referral_code')
          .eq('referral_code', referralCode)
          .single();

        if (fetchError || !data) {
          setError('Referral code not found');
        } else {
          setReferrer({
            userId: data.user_id,
            fullName: data.full_name,
            referralCode: data.referral_code || '',
          });
        }
      } catch {
        setError('Failed to validate referral code');
      } finally {
        setLoading(false);
      }
    }

    fetchReferrer();
  }, [referralCode]);

  const handleSubmit = async (formData: ApplicationFormData) => {
    if (!referrer) return;

    setIsSubmitting(true);
    try {
      const newLeadNumber = generateLeadNumber();

      const { error: insertError } = await supabase.from('leads').insert({
        lead_number: newLeadNumber,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email || null,
        customer_pan: formData.customer_pan || null,
        customer_aadhaar: formData.customer_aadhaar.replace(/\s/g, '') || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        residence_status: formData.residence_status || null,
        
        business_name: formData.business_name || null,
        business_type: formData.business_type || null,
        business_vintage_years: formData.business_vintage_years ? parseInt(formData.business_vintage_years) : null,
        gst_number: formData.gst_number || null,
        udyam_number: formData.udyam_number || null,
        business_address: formData.business_address || null,
        
        has_property: formData.has_property,
        property_type: formData.property_type || null,
        property_value: formData.property_value ? parseFloat(formData.property_value) : null,
        property_address: formData.property_address || null,
        
        product_type: formData.product_type as 'business_loan' | 'personal_loan' | 'stpl' | 'po_finance',
        requested_amount: parseFloat(formData.requested_amount),
        requested_tenure_months: formData.requested_tenure_months ? parseInt(formData.requested_tenure_months) : null,
        purpose_of_loan: formData.purpose_of_loan || null,
        
        co_applicant_name: formData.co_applicant_name || null,
        co_applicant_phone: formData.co_applicant_phone || null,
        co_applicant_pan: formData.co_applicant_pan || null,
        co_applicant_relation: formData.co_applicant_relation || null,
        
        ro_id: referrer.userId,
        source_channel: 'referral',
        partner_code: referrer.referralCode,
        status: 'new',
      });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      setLeadNumber(newLeadNumber);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !referrer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Invalid Referral Link</h2>
            <p className="text-muted-foreground">
              {error || 'This referral link is not valid or has expired.'}
            </p>
            <Button asChild variant="outline">
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Loan-Sync</h1>
          </div>
          <p className="text-lg font-medium">Apply for a Loan</p>
          <p className="text-sm text-muted-foreground mt-1">
            Referred by: <span className="font-medium text-foreground">{referrer.fullName}</span>
          </p>
        </div>

        {/* Form */}
        <PublicApplicationForm
          referrerName={referrer.fullName}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isSubmitted={isSubmitted}
          leadNumber={leadNumber}
        />

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-muted-foreground">
          <p>By submitting this application, you agree to our</p>
          <p>Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}
