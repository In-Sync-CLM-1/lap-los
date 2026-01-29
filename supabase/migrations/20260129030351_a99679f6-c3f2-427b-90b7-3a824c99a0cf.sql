-- Create departments table
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create designations table (linked to app_role)
CREATE TABLE public.designations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    mapped_role app_role NOT NULL,
    level INTEGER NOT NULL DEFAULT 1, -- hierarchy level for approval chain
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create approval_matrix table (product + amount based)
CREATE TABLE public.approval_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_type product_type NOT NULL,
    min_amount NUMERIC NOT NULL DEFAULT 0,
    max_amount NUMERIC NOT NULL,
    required_role app_role NOT NULL,
    approval_level INTEGER NOT NULL DEFAULT 1, -- order in approval chain
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(product_type, min_amount, max_amount, approval_level)
);

-- Add department and designation to profiles
ALTER TABLE public.profiles 
ADD COLUMN department_id UUID REFERENCES public.departments(id),
ADD COLUMN designation_id UUID REFERENCES public.designations(id);

-- Enable RLS on new tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_matrix ENABLE ROW LEVEL SECURITY;

-- Departments policies
CREATE POLICY "Anyone can view active departments" ON public.departments
FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage departments" ON public.departments
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Designations policies
CREATE POLICY "Anyone can view active designations" ON public.designations
FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage designations" ON public.designations
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Approval matrix policies
CREATE POLICY "Anyone can view active approval matrix" ON public.approval_matrix
FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage approval matrix" ON public.approval_matrix
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Update triggers for updated_at
CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON public.departments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_designations_updated_at
BEFORE UPDATE ON public.designations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_approval_matrix_updated_at
BEFORE UPDATE ON public.approval_matrix
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get required approvers based on product and amount
CREATE OR REPLACE FUNCTION public.get_required_approvers(
    _product_type product_type,
    _amount NUMERIC
)
RETURNS TABLE(role app_role, approval_level INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT required_role, approval_level
    FROM public.approval_matrix
    WHERE product_type = _product_type
      AND _amount >= min_amount
      AND _amount <= max_amount
      AND is_active = true
    ORDER BY approval_level ASC
$$;

-- Seed default departments
INSERT INTO public.departments (name, code, description) VALUES
('Sales', 'SALES', 'Sales and Business Development'),
('Credit', 'CREDIT', 'Credit Underwriting and Assessment'),
('Operations', 'OPS', 'Loan Operations and Processing'),
('Collections', 'COLL', 'Collections and Recovery'),
('Risk', 'RISK', 'Risk Management'),
('IT', 'IT', 'Information Technology');

-- Seed default designations mapped to roles
INSERT INTO public.designations (name, code, mapped_role, level, description) VALUES
('Relationship Officer', 'RO', 'ro', 1, 'Field sales officer'),
('Senior Relationship Officer', 'SRO', 'ro', 2, 'Senior field officer'),
('Credit Officer', 'CO', 'credit_officer', 3, 'Credit assessment officer'),
('Senior Credit Officer', 'SCO', 'credit_officer', 4, 'Senior credit officer'),
('Sales Manager', 'SM', 'sales_manager', 5, 'Branch sales manager'),
('Branch Credit Manager', 'BCM', 'sales_manager', 5, 'Branch credit head'),
('Regional Sales Head', 'RSH', 'regional_head', 6, 'Regional sales head'),
('Regional Credit Head', 'RCH', 'regional_head', 6, 'Regional credit head'),
('Zonal Head', 'ZH', 'zonal_head', 7, 'Zonal business head'),
('Chief Credit Officer', 'CCO', 'zonal_head', 7, 'Chief credit officer'),
('CEO', 'CEO', 'ceo', 8, 'Chief Executive Officer'),
('Platform Admin', 'ADMIN', 'admin', 9, 'System administrator');

-- Seed default approval matrix for all product types
-- Business Loan
INSERT INTO public.approval_matrix (product_type, min_amount, max_amount, required_role, approval_level, description) VALUES
('business_loan', 0, 500000, 'sales_manager', 1, 'Up to 5L - Sales Manager approval'),
('business_loan', 500001, 2000000, 'regional_head', 1, '5L-20L - Regional Head approval'),
('business_loan', 2000001, 5000000, 'zonal_head', 1, '20L-50L - Zonal Head approval'),
('business_loan', 5000001, 999999999, 'ceo', 1, 'Above 50L - CEO approval');

-- Personal Loan
INSERT INTO public.approval_matrix (product_type, min_amount, max_amount, required_role, approval_level, description) VALUES
('personal_loan', 0, 200000, 'sales_manager', 1, 'Up to 2L - Sales Manager approval'),
('personal_loan', 200001, 500000, 'regional_head', 1, '2L-5L - Regional Head approval'),
('personal_loan', 500001, 999999999, 'zonal_head', 1, 'Above 5L - Zonal Head approval');

-- STPL
INSERT INTO public.approval_matrix (product_type, min_amount, max_amount, required_role, approval_level, description) VALUES
('stpl', 0, 300000, 'sales_manager', 1, 'Up to 3L - Sales Manager approval'),
('stpl', 300001, 1000000, 'regional_head', 1, '3L-10L - Regional Head approval'),
('stpl', 1000001, 999999999, 'zonal_head', 1, 'Above 10L - Zonal Head approval');

-- PO Finance
INSERT INTO public.approval_matrix (product_type, min_amount, max_amount, required_role, approval_level, description) VALUES
('po_finance', 0, 1000000, 'sales_manager', 1, 'Up to 10L - Sales Manager approval'),
('po_finance', 1000001, 5000000, 'regional_head', 1, '10L-50L - Regional Head approval'),
('po_finance', 5000001, 10000000, 'zonal_head', 1, '50L-1Cr - Zonal Head approval'),
('po_finance', 10000001, 999999999, 'ceo', 1, 'Above 1Cr - CEO approval');