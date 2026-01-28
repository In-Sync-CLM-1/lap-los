-- Create role enum for the organization hierarchy
CREATE TYPE public.app_role AS ENUM ('ro', 'credit_officer', 'sales_manager', 'regional_head', 'zonal_head', 'ceo', 'admin');

-- Create product type enum
CREATE TYPE public.product_type AS ENUM ('business_loan', 'personal_loan', 'stpl', 'po_finance');

-- Create lead status enum
CREATE TYPE public.lead_status AS ENUM ('new', 'in_progress', 'documents_pending', 'submitted', 'under_review', 'approved', 'rejected', 'disbursed', 'closed');

-- Create application status enum
CREATE TYPE public.application_status AS ENUM ('draft', 'submitted', 'bre_processing', 'underwriting', 'pending_approval', 'approved', 'rejected', 'deviation', 'disbursed', 'closed');

-- Create decision type enum
CREATE TYPE public.decision_type AS ENUM ('stp_approved', 'non_stp', 'rejected', 'deviation');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    employee_id TEXT UNIQUE,
    branch_code TEXT,
    region TEXT,
    zone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Create leads table
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_number TEXT UNIQUE NOT NULL,
    ro_id UUID REFERENCES auth.users(id) NOT NULL,
    
    -- Customer Details
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    customer_pan TEXT,
    customer_aadhaar TEXT,
    date_of_birth DATE,
    gender TEXT,
    
    -- Co-applicant Details
    co_applicant_name TEXT,
    co_applicant_phone TEXT,
    co_applicant_pan TEXT,
    co_applicant_aadhaar TEXT,
    co_applicant_relation TEXT,
    
    -- Business Details
    business_name TEXT,
    business_type TEXT,
    business_address TEXT,
    business_vintage_years INTEGER,
    gst_number TEXT,
    udyam_number TEXT,
    
    -- Property Details
    has_property BOOLEAN DEFAULT false,
    property_type TEXT,
    property_address TEXT,
    property_value DECIMAL(15,2),
    
    -- Loan Request
    product_type product_type NOT NULL,
    requested_amount DECIMAL(15,2) NOT NULL,
    requested_tenure_months INTEGER,
    purpose_of_loan TEXT,
    
    -- Lead Source
    source_channel TEXT DEFAULT 'physical',
    partner_code TEXT,
    
    -- Location Data
    capture_latitude DECIMAL(10,8),
    capture_longitude DECIMAL(11,8),
    capture_address TEXT,
    
    -- Status
    status lead_status DEFAULT 'new' NOT NULL,
    is_dedupe_clean BOOLEAN,
    dedupe_checked_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create applications table (after BRE processing)
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number TEXT UNIQUE NOT NULL,
    lead_id UUID REFERENCES public.leads(id) NOT NULL,
    
    -- Assigned Users
    ro_id UUID REFERENCES auth.users(id) NOT NULL,
    assigned_underwriter_id UUID REFERENCES auth.users(id),
    
    -- BRE Results
    bre_score INTEGER,
    bre_decision decision_type,
    bre_reasons JSONB,
    bre_processed_at TIMESTAMP WITH TIME ZONE,
    
    -- FOIR Calculation
    monthly_turnover DECIMAL(15,2),
    gross_margin_percent DECIMAL(5,2),
    monthly_expenses DECIMAL(15,2),
    existing_obligations DECIMAL(15,2),
    calculated_foir DECIMAL(5,2),
    max_eligible_emi DECIMAL(15,2),
    
    -- Offers
    offer1_amount DECIMAL(15,2),
    offer1_tenure_months INTEGER,
    offer1_interest_rate DECIMAL(5,2),
    offer1_emi DECIMAL(15,2),
    
    offer2_amount DECIMAL(15,2),
    offer2_tenure_months INTEGER,
    offer2_interest_rate DECIMAL(5,2),
    offer2_emi DECIMAL(15,2),
    
    counter_offer_amount DECIMAL(15,2),
    counter_offer_tenure_months INTEGER,
    counter_offer_interest_rate DECIMAL(5,2),
    counter_offer_emi DECIMAL(15,2),
    counter_offer_approved_by UUID REFERENCES auth.users(id),
    
    -- Selected Offer
    selected_offer TEXT,
    final_amount DECIMAL(15,2),
    final_tenure_months INTEGER,
    final_interest_rate DECIMAL(5,2),
    final_emi DECIMAL(15,2),
    
    -- Approval Workflow
    status application_status DEFAULT 'draft' NOT NULL,
    current_approver_id UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_by UUID REFERENCES auth.users(id),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Deviation
    has_deviation BOOLEAN DEFAULT false,
    deviation_type TEXT,
    deviation_reason TEXT,
    deviation_approved_by UUID REFERENCES auth.users(id),
    
    -- CAM Sheet
    cam_notes TEXT,
    cam_recommendation TEXT,
    
    -- Disbursal
    sanction_letter_generated_at TIMESTAMP WITH TIME ZONE,
    disbursed_amount DECIMAL(15,2),
    disbursed_at TIMESTAMP WITH TIME ZONE,
    bank_account_number TEXT,
    bank_ifsc TEXT,
    bank_name TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create documents table
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    
    document_type TEXT NOT NULL,
    document_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    
    -- Geo-tagging for photos
    capture_latitude DECIMAL(10,8),
    capture_longitude DECIMAL(11,8),
    capture_address TEXT,
    captured_at TIMESTAMP WITH TIME ZONE,
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_notes TEXT,
    
    -- OCR/API Results
    ocr_data JSONB,
    api_validation_result JSONB,
    
    uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create workflow_history table for audit trail
CREATE TABLE public.workflow_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    from_status application_status,
    to_status application_status,
    performed_by UUID REFERENCES auth.users(id) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create api_logs table for tracking mock/real API calls
CREATE TABLE public.api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id),
    application_id UUID REFERENCES public.applications(id),
    api_name TEXT NOT NULL,
    request_payload JSONB,
    response_payload JSONB,
    status_code INTEGER,
    is_success BOOLEAN,
    error_message TEXT,
    response_time_ms INTEGER,
    is_mock BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create offline_queue table for PWA sync
CREATE TABLE public.offline_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    action TEXT NOT NULL,
    payload JSONB NOT NULL,
    synced BOOLEAN DEFAULT false,
    synced_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_queue ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to check if user has any management role
CREATE OR REPLACE FUNCTION public.is_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('sales_manager', 'regional_head', 'zonal_head', 'ceo', 'admin')
    )
$$;

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.user_roles
    WHERE user_id = _user_id
    ORDER BY 
        CASE role
            WHEN 'ceo' THEN 1
            WHEN 'admin' THEN 2
            WHEN 'zonal_head' THEN 3
            WHEN 'regional_head' THEN 4
            WHEN 'sales_manager' THEN 5
            WHEN 'credit_officer' THEN 6
            WHEN 'ro' THEN 7
        END
    LIMIT 1
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Managers can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_manager(auth.uid()));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for leads
CREATE POLICY "ROs can view their own leads"
ON public.leads FOR SELECT
TO authenticated
USING (ro_id = auth.uid());

CREATE POLICY "Managers can view all leads"
ON public.leads FOR SELECT
TO authenticated
USING (public.is_manager(auth.uid()) OR public.has_role(auth.uid(), 'credit_officer'));

CREATE POLICY "ROs can create leads"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (ro_id = auth.uid());

CREATE POLICY "ROs can update their own leads"
ON public.leads FOR UPDATE
TO authenticated
USING (ro_id = auth.uid());

CREATE POLICY "Credit officers can update leads"
ON public.leads FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'credit_officer') OR public.is_manager(auth.uid()));

-- RLS Policies for applications
CREATE POLICY "ROs can view their own applications"
ON public.applications FOR SELECT
TO authenticated
USING (ro_id = auth.uid());

CREATE POLICY "Assigned underwriters can view applications"
ON public.applications FOR SELECT
TO authenticated
USING (assigned_underwriter_id = auth.uid());

CREATE POLICY "Managers can view all applications"
ON public.applications FOR SELECT
TO authenticated
USING (public.is_manager(auth.uid()) OR public.has_role(auth.uid(), 'credit_officer'));

CREATE POLICY "Credit officers can create applications"
ON public.applications FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'credit_officer') OR public.is_manager(auth.uid()));

CREATE POLICY "Credit officers can update applications"
ON public.applications FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'credit_officer') OR public.is_manager(auth.uid()));

-- RLS Policies for documents
CREATE POLICY "Users can view documents for their leads"
ON public.documents FOR SELECT
TO authenticated
USING (
    uploaded_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.leads WHERE id = lead_id AND ro_id = auth.uid()) OR
    public.has_role(auth.uid(), 'credit_officer') OR
    public.is_manager(auth.uid())
);

CREATE POLICY "Users can upload documents"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their documents"
ON public.documents FOR UPDATE
TO authenticated
USING (uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'credit_officer'));

-- RLS Policies for workflow_history
CREATE POLICY "Users can view workflow history for their applications"
ON public.workflow_history FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND ro_id = auth.uid()) OR
    public.has_role(auth.uid(), 'credit_officer') OR
    public.is_manager(auth.uid())
);

CREATE POLICY "Users can insert workflow history"
ON public.workflow_history FOR INSERT
TO authenticated
WITH CHECK (performed_by = auth.uid());

-- RLS Policies for api_logs
CREATE POLICY "Credit officers and managers can view api_logs"
ON public.api_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'credit_officer') OR public.is_manager(auth.uid()));

CREATE POLICY "System can insert api_logs"
ON public.api_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for offline_queue
CREATE POLICY "Users can manage their own offline queue"
ON public.offline_queue FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate lead number
CREATE OR REPLACE FUNCTION public.generate_lead_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.lead_number := 'NC-L-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('lead_number_seq')::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for lead numbers
CREATE SEQUENCE IF NOT EXISTS lead_number_seq START 1;

-- Apply lead number trigger
CREATE TRIGGER set_lead_number
    BEFORE INSERT ON public.leads
    FOR EACH ROW
    WHEN (NEW.lead_number IS NULL)
    EXECUTE FUNCTION public.generate_lead_number();

-- Function to generate application number
CREATE OR REPLACE FUNCTION public.generate_application_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.application_number := 'NC-A-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('application_number_seq')::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for application numbers
CREATE SEQUENCE IF NOT EXISTS application_number_seq START 1;

-- Apply application number trigger
CREATE TRIGGER set_application_number
    BEFORE INSERT ON public.applications
    FOR EACH ROW
    WHEN (NEW.application_number IS NULL)
    EXECUTE FUNCTION public.generate_application_number();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_leads_ro_id ON public.leads(ro_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_applications_lead_id ON public.applications(lead_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_assigned_underwriter ON public.applications(assigned_underwriter_id);
CREATE INDEX idx_documents_lead_id ON public.documents(lead_id);
CREATE INDEX idx_documents_application_id ON public.documents(application_id);
CREATE INDEX idx_workflow_history_application_id ON public.workflow_history(application_id);
CREATE INDEX idx_offline_queue_user_id_synced ON public.offline_queue(user_id, synced);