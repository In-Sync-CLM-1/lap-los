import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  User, 
  Briefcase, 
  Home, 
  CreditCard,
  MapPin,
  Loader2,
  Save,
  Send,
  WifiOff
} from 'lucide-react';
import type { ProductType } from '@/types/database';
import { PRODUCT_LABELS } from '@/types/database';

export function NewLead() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline, queueAction } = useOfflineSync();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('customer');
  
  // Form state
  const [formData, setFormData] = useState({
    // Customer
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_pan: '',
    customer_aadhaar: '',
    gender: '',
    date_of_birth: '',
    
    // Co-applicant
    has_co_applicant: false,
    co_applicant_name: '',
    co_applicant_phone: '',
    co_applicant_pan: '',
    co_applicant_relation: '',
    
    // Business
    business_name: '',
    business_type: '',
    business_address: '',
    business_vintage_years: '',
    gst_number: '',
    udyam_number: '',
    
    // Property
    has_property: false,
    property_type: '',
    property_address: '',
    property_value: '',
    
    // Loan
    product_type: '' as ProductType | '',
    requested_amount: '',
    requested_tenure_months: '',
    purpose_of_loan: '',
  });

  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getLocation = async () => {
    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
      
      const { latitude, longitude } = position.coords;
      // In production, reverse geocode to get address
      setLocation({
        lat: latitude,
        lng: longitude,
        address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      });
      
      toast({
        title: 'Location captured',
        description: 'GPS coordinates saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Location error',
        description: 'Unable to get your location. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async (asDraft = false) => {
    if (!formData.customer_name || !formData.customer_phone || !formData.product_type || !formData.requested_amount) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in to create a lead',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    // Prepare lead data
    const leadData = {
      ro_id: user.id,
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      customer_email: formData.customer_email || null,
      customer_pan: formData.customer_pan || null,
      customer_aadhaar: formData.customer_aadhaar || null,
      gender: formData.gender || null,
      date_of_birth: formData.date_of_birth || null,
      co_applicant_name: formData.has_co_applicant ? formData.co_applicant_name || null : null,
      co_applicant_phone: formData.has_co_applicant ? formData.co_applicant_phone || null : null,
      co_applicant_pan: formData.has_co_applicant ? formData.co_applicant_pan || null : null,
      co_applicant_relation: formData.has_co_applicant ? formData.co_applicant_relation || null : null,
      business_name: formData.business_name || null,
      business_type: formData.business_type || null,
      business_address: formData.business_address || null,
      business_vintage_years: formData.business_vintage_years ? parseInt(formData.business_vintage_years) : null,
      gst_number: formData.gst_number || null,
      udyam_number: formData.udyam_number || null,
      has_property: formData.has_property,
      property_type: formData.has_property ? formData.property_type || null : null,
      property_address: formData.has_property ? formData.property_address || null : null,
      property_value: formData.has_property && formData.property_value ? parseFloat(formData.property_value) : null,
      product_type: formData.product_type as ProductType,
      requested_amount: parseFloat(formData.requested_amount),
      requested_tenure_months: formData.requested_tenure_months ? parseInt(formData.requested_tenure_months) : null,
      purpose_of_loan: formData.purpose_of_loan || null,
      capture_latitude: location?.lat || null,
      capture_longitude: location?.lng || null,
      capture_address: location?.address || null,
      status: asDraft ? 'new' : 'submitted',
      source_channel: 'physical',
    };

    try {
      if (isOnline) {
        // Insert directly to Supabase
        const { data, error } = await supabase
          .from('leads')
          .insert([leadData as never])
          .select('lead_number')
          .single();

        if (error) throw error;

        toast({
          title: asDraft ? 'Lead saved as draft' : 'Lead created successfully',
          description: `Lead number: ${data?.lead_number || 'Generated'}`,
        });
      } else {
        // Queue for offline sync
        await queueAction('lead', 'create', leadData);
        
        toast({
          title: 'Lead queued for sync',
          description: 'Lead will be synced when you are back online',
        });
      }
      
      navigate('/leads');
    } catch (error: unknown) {
      console.error('Error creating lead:', error);
      toast({
        title: 'Error creating lead',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">New Lead</h1>
          <p className="text-muted-foreground">Capture new customer details</p>
        </div>
        {!isOnline && (
          <div className="flex items-center gap-2 text-warning">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm">Offline</span>
          </div>
        )}
      </div>

      {/* Location Bar */}
      <Card>
        <CardContent className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            {location ? (
              <span className="text-sm">{location.address}</span>
            ) : (
              <span className="text-sm text-muted-foreground">Location not captured</span>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={getLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                {location ? 'Update' : 'Capture Location'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Form Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="customer" className="gap-2">
            <User className="w-4 h-4 hidden sm:inline" />
            Customer
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-2">
            <Briefcase className="w-4 h-4 hidden sm:inline" />
            Business
          </TabsTrigger>
          <TabsTrigger value="property" className="gap-2">
            <Home className="w-4 h-4 hidden sm:inline" />
            Property
          </TabsTrigger>
          <TabsTrigger value="loan" className="gap-2">
            <CreditCard className="w-4 h-4 hidden sm:inline" />
            Loan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customer" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
              <CardDescription>Primary applicant information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Full Name *</Label>
                  <Input
                    id="customer_name"
                    placeholder="Enter full name"
                    value={formData.customer_name}
                    onChange={(e) => handleInputChange('customer_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_phone">Phone Number *</Label>
                  <Input
                    id="customer_phone"
                    placeholder="+91 98765 43210"
                    value={formData.customer_phone}
                    onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_email">Email</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.customer_email}
                    onChange={(e) => handleInputChange('customer_email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(v) => handleInputChange('gender', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_pan">PAN Number</Label>
                  <Input
                    id="customer_pan"
                    placeholder="ABCDE1234F"
                    value={formData.customer_pan}
                    onChange={(e) => handleInputChange('customer_pan', e.target.value.toUpperCase())}
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_aadhaar">Aadhaar Number</Label>
                  <Input
                    id="customer_aadhaar"
                    placeholder="1234 5678 9012"
                    value={formData.customer_aadhaar}
                    onChange={(e) => handleInputChange('customer_aadhaar', e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Checkbox
                    id="has_co_applicant"
                    checked={formData.has_co_applicant}
                    onCheckedChange={(v) => handleInputChange('has_co_applicant', !!v)}
                  />
                  <Label htmlFor="has_co_applicant">Add Co-Applicant</Label>
                </div>

                {formData.has_co_applicant && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="co_applicant_name">Co-Applicant Name</Label>
                      <Input
                        id="co_applicant_name"
                        placeholder="Enter name"
                        value={formData.co_applicant_name}
                        onChange={(e) => handleInputChange('co_applicant_name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="co_applicant_phone">Phone Number</Label>
                      <Input
                        id="co_applicant_phone"
                        placeholder="+91 98765 43210"
                        value={formData.co_applicant_phone}
                        onChange={(e) => handleInputChange('co_applicant_phone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="co_applicant_relation">Relationship</Label>
                      <Select 
                        value={formData.co_applicant_relation} 
                        onValueChange={(v) => handleInputChange('co_applicant_relation', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="business_partner">Business Partner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="co_applicant_pan">PAN Number</Label>
                      <Input
                        id="co_applicant_pan"
                        placeholder="ABCDE1234F"
                        value={formData.co_applicant_pan}
                        onChange={(e) => handleInputChange('co_applicant_pan', e.target.value.toUpperCase())}
                        maxLength={10}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Details</CardTitle>
              <CardDescription>Information about the business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    placeholder="Enter business name"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_type">Business Type</Label>
                  <Select 
                    value={formData.business_type} 
                    onValueChange={(v) => handleInputChange('business_type', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="trading">Trading</SelectItem>
                      <SelectItem value="food">Food & Beverages</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="business_address">Business Address</Label>
                  <Textarea
                    id="business_address"
                    placeholder="Enter full business address"
                    value={formData.business_address}
                    onChange={(e) => handleInputChange('business_address', e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_vintage_years">Business Vintage (Years)</Label>
                  <Input
                    id="business_vintage_years"
                    type="number"
                    placeholder="0"
                    min="0"
                    value={formData.business_vintage_years}
                    onChange={(e) => handleInputChange('business_vintage_years', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gst_number">GST Number</Label>
                  <Input
                    id="gst_number"
                    placeholder="27ABCDE1234F1Z5"
                    value={formData.gst_number}
                    onChange={(e) => handleInputChange('gst_number', e.target.value.toUpperCase())}
                    maxLength={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="udyam_number">Udyam Number</Label>
                  <Input
                    id="udyam_number"
                    placeholder="UDYAM-XX-00-0000000"
                    value={formData.udyam_number}
                    onChange={(e) => handleInputChange('udyam_number', e.target.value.toUpperCase())}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="property" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
              <CardDescription>Collateral information (if any)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="has_property"
                  checked={formData.has_property}
                  onCheckedChange={(v) => handleInputChange('has_property', !!v)}
                />
                <Label htmlFor="has_property">Customer has property to offer as collateral</Label>
              </div>

              {formData.has_property && (
                <div className="grid gap-4 sm:grid-cols-2 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="property_type">Property Type</Label>
                    <Select 
                      value={formData.property_type} 
                      onValueChange={(v) => handleInputChange('property_type', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
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
                    <Label htmlFor="property_value">Estimated Value (₹)</Label>
                    <Input
                      id="property_value"
                      type="number"
                      placeholder="0"
                      min="0"
                      value={formData.property_value}
                      onChange={(e) => handleInputChange('property_value', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="property_address">Property Address</Label>
                    <Textarea
                      id="property_address"
                      placeholder="Enter full property address"
                      value={formData.property_address}
                      onChange={(e) => handleInputChange('property_address', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loan" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Loan Requirements</CardTitle>
              <CardDescription>Loan product and amount details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="product_type">Product Type *</Label>
                  <Select 
                    value={formData.product_type} 
                    onValueChange={(v) => handleInputChange('product_type', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRODUCT_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requested_amount">Requested Amount (₹) *</Label>
                  <Input
                    id="requested_amount"
                    type="number"
                    placeholder="500000"
                    min="0"
                    value={formData.requested_amount}
                    onChange={(e) => handleInputChange('requested_amount', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requested_tenure_months">Tenure (Months)</Label>
                  <Select 
                    value={formData.requested_tenure_months} 
                    onValueChange={(v) => handleInputChange('requested_tenure_months', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenure" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 Months</SelectItem>
                      <SelectItem value="12">12 Months</SelectItem>
                      <SelectItem value="18">18 Months</SelectItem>
                      <SelectItem value="24">24 Months</SelectItem>
                      <SelectItem value="36">36 Months</SelectItem>
                      <SelectItem value="48">48 Months</SelectItem>
                      <SelectItem value="60">60 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose_of_loan">Purpose of Loan</Label>
                <Textarea
                  id="purpose_of_loan"
                  placeholder="Describe the purpose of this loan"
                  value={formData.purpose_of_loan}
                  onChange={(e) => handleInputChange('purpose_of_loan', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pb-20 lg:pb-0">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => handleSubmit(true)}
          disabled={isSubmitting}
        >
          <Save className="w-4 h-4 mr-2" />
          Save as Draft
        </Button>
        <Button 
          className="flex-1"
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Submit Lead
        </Button>
      </div>
    </div>
  );
}
