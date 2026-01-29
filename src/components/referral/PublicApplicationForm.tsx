import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { KYCVerificationStep } from './KYCVerificationStep';
import { PRODUCT_LABELS } from '@/types/database';

export interface ApplicationFormData {
  // Personal Details
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  date_of_birth: string;
  gender: string;
  residence_status: string;
  
  // KYC
  customer_pan: string;
  customer_aadhaar: string;
  pan_verified: boolean;
  aadhaar_verified: boolean;
  
  // Business Details
  business_name: string;
  business_type: string;
  business_vintage_years: string;
  gst_number: string;
  udyam_number: string;
  business_address: string;
  
  // Property Details
  has_property: boolean;
  property_type: string;
  property_value: string;
  property_address: string;
  
  // Loan Details
  product_type: string;
  requested_amount: string;
  requested_tenure_months: string;
  purpose_of_loan: string;
  
  // Co-applicant
  co_applicant_name: string;
  co_applicant_phone: string;
  co_applicant_pan: string;
  co_applicant_relation: string;
}

interface PublicApplicationFormProps {
  referrerName: string;
  onSubmit: (data: ApplicationFormData) => Promise<void>;
  isSubmitting: boolean;
  isSubmitted: boolean;
  leadNumber?: string;
}

const STEPS = [
  { id: 1, title: 'Personal Details' },
  { id: 2, title: 'KYC Verification' },
  { id: 3, title: 'Business Details' },
  { id: 4, title: 'Loan Details' },
];

const INITIAL_DATA: ApplicationFormData = {
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  date_of_birth: '',
  gender: '',
  residence_status: '',
  customer_pan: '',
  customer_aadhaar: '',
  pan_verified: false,
  aadhaar_verified: false,
  business_name: '',
  business_type: '',
  business_vintage_years: '',
  gst_number: '',
  udyam_number: '',
  business_address: '',
  has_property: false,
  property_type: '',
  property_value: '',
  property_address: '',
  product_type: '',
  requested_amount: '',
  requested_tenure_months: '',
  purpose_of_loan: '',
  co_applicant_name: '',
  co_applicant_phone: '',
  co_applicant_pan: '',
  co_applicant_relation: '',
};

export function PublicApplicationForm({
  referrerName,
  onSubmit,
  isSubmitting,
  isSubmitted,
  leadNumber,
}: PublicApplicationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ApplicationFormData>(INITIAL_DATA);

  const updateField = (field: keyof ApplicationFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const progress = (currentStep / STEPS.length) * 100;

  const canProceedStep1 = formData.customer_name && formData.customer_phone;
  const canProceedStep2 = formData.pan_verified && formData.aadhaar_verified;
  const canProceedStep3 = true; // Business details optional
  const canSubmit = formData.product_type && formData.requested_amount;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    await onSubmit(formData);
  };

  if (isSubmitted) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold">Application Submitted!</h2>
          {leadNumber && (
            <p className="text-muted-foreground">
              Reference: <span className="font-mono font-semibold">{leadNumber}</span>
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Our team will contact you within 24 hours.
          </p>
          <p className="text-sm text-muted-foreground">
            Referred by: <span className="font-medium">{referrerName}</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Step {currentStep} of {STEPS.length}</span>
          <span className="text-muted-foreground">{STEPS[currentStep - 1].title}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 1: Personal Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">Personal Details</h3>
                <p className="text-muted-foreground text-sm">Tell us about yourself</p>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.customer_name}
                    onChange={(e) => updateField('customer_name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => updateField('customer_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => updateField('customer_email', e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => updateField('date_of_birth', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(v) => updateField('gender', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="residence">Residence Status</Label>
                  <Select value={formData.residence_status} onValueChange={(v) => updateField('residence_status', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select residence type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owned">Owned</SelectItem>
                      <SelectItem value="rented">Rented</SelectItem>
                      <SelectItem value="family_owned">Family Owned</SelectItem>
                      <SelectItem value="company_provided">Company Provided</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: KYC Verification */}
          {currentStep === 2 && (
            <KYCVerificationStep
              data={{
                customer_pan: formData.customer_pan,
                customer_aadhaar: formData.customer_aadhaar,
                customer_name: formData.customer_name,
              }}
              onChange={(field, value) => updateField(field as keyof ApplicationFormData, value)}
              onPanVerified={(verified) => updateField('pan_verified', verified)}
              onAadhaarVerified={(verified) => updateField('aadhaar_verified', verified)}
            />
          )}

          {/* Step 3: Business Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">Business Details</h3>
                <p className="text-muted-foreground text-sm">Tell us about your business (optional)</p>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={formData.business_name}
                    onChange={(e) => updateField('business_name', e.target.value)}
                    placeholder="Your business name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    <Select value={formData.business_type} onValueChange={(v) => updateField('business_type', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="proprietorship">Proprietorship</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="pvt_ltd">Pvt Ltd</SelectItem>
                        <SelectItem value="llp">LLP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vintage">Years in Business</Label>
                    <Input
                      id="vintage"
                      type="number"
                      value={formData.business_vintage_years}
                      onChange={(e) => updateField('business_vintage_years', e.target.value)}
                      placeholder="e.g., 5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gst">GST Number</Label>
                    <Input
                      id="gst"
                      value={formData.gst_number}
                      onChange={(e) => updateField('gst_number', e.target.value.toUpperCase())}
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="udyam">Udyam Number</Label>
                    <Input
                      id="udyam"
                      value={formData.udyam_number}
                      onChange={(e) => updateField('udyam_number', e.target.value.toUpperCase())}
                      placeholder="UDYAM-XX-00-0000000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Textarea
                    id="businessAddress"
                    value={formData.business_address}
                    onChange={(e) => updateField('business_address', e.target.value)}
                    placeholder="Complete business address"
                    rows={2}
                  />
                </div>

                {/* Property Details */}
                <div className="pt-4 border-t">
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                      id="hasProperty"
                      checked={formData.has_property}
                      onCheckedChange={(checked) => updateField('has_property', !!checked)}
                    />
                    <Label htmlFor="hasProperty">I own a property</Label>
                  </div>

                  {formData.has_property && (
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="propertyType">Property Type</Label>
                          <Select value={formData.property_type} onValueChange={(v) => updateField('property_type', v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="residential">Residential</SelectItem>
                              <SelectItem value="commercial">Commercial</SelectItem>
                              <SelectItem value="industrial">Industrial</SelectItem>
                              <SelectItem value="land">Land</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="propertyValue">Property Value (₹)</Label>
                          <Input
                            id="propertyValue"
                            type="number"
                            value={formData.property_value}
                            onChange={(e) => updateField('property_value', e.target.value)}
                            placeholder="e.g., 5000000"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="propertyAddress">Property Address</Label>
                        <Textarea
                          id="propertyAddress"
                          value={formData.property_address}
                          onChange={(e) => updateField('property_address', e.target.value)}
                          placeholder="Complete property address"
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Loan Details */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">Loan Requirements</h3>
                <p className="text-muted-foreground text-sm">Tell us about your loan needs</p>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productType">Product Type *</Label>
                  <Select value={formData.product_type} onValueChange={(v) => updateField('product_type', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select loan type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRODUCT_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Loan Amount (₹) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.requested_amount}
                      onChange={(e) => updateField('requested_amount', e.target.value)}
                      placeholder="e.g., 500000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenure">Tenure (months)</Label>
                    <Input
                      id="tenure"
                      type="number"
                      value={formData.requested_tenure_months}
                      onChange={(e) => updateField('requested_tenure_months', e.target.value)}
                      placeholder="e.g., 36"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose of Loan</Label>
                  <Textarea
                    id="purpose"
                    value={formData.purpose_of_loan}
                    onChange={(e) => updateField('purpose_of_loan', e.target.value)}
                    placeholder="Describe how you plan to use the loan"
                    rows={2}
                  />
                </div>

                {/* Co-applicant (optional) */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-4">Co-Applicant Details (Optional)</h4>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="coName">Co-Applicant Name</Label>
                        <Input
                          id="coName"
                          value={formData.co_applicant_name}
                          onChange={(e) => updateField('co_applicant_name', e.target.value)}
                          placeholder="Full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="coRelation">Relation</Label>
                        <Select value={formData.co_applicant_relation} onValueChange={(v) => updateField('co_applicant_relation', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="sibling">Sibling</SelectItem>
                            <SelectItem value="business_partner">Business Partner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="coPhone">Phone</Label>
                        <Input
                          id="coPhone"
                          type="tel"
                          value={formData.co_applicant_phone}
                          onChange={(e) => updateField('co_applicant_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="10-digit number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="coPan">PAN</Label>
                        <Input
                          id="coPan"
                          value={formData.co_applicant_pan}
                          onChange={(e) => updateField('co_applicant_pan', e.target.value.toUpperCase().slice(0, 10))}
                          placeholder="ABCDE1234F"
                          className="uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {currentStep < STEPS.length ? (
          <Button
            onClick={handleNext}
            disabled={
              (currentStep === 1 && !canProceedStep1) ||
              (currentStep === 2 && !canProceedStep2) ||
              (currentStep === 3 && !canProceedStep3)
            }
            className="gap-2"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
