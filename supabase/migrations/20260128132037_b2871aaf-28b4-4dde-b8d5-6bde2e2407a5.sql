-- Fix function search path issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_lead_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.lead_number := 'NC-L-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('lead_number_seq')::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_application_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.application_number := 'NC-A-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('application_number_seq')::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix overly permissive RLS policy on api_logs
DROP POLICY IF EXISTS "System can insert api_logs" ON public.api_logs;

CREATE POLICY "Authenticated users can insert api_logs"
ON public.api_logs FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (SELECT 1 FROM public.leads WHERE id = lead_id AND ro_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND ro_id = auth.uid()) OR
    public.has_role(auth.uid(), 'credit_officer') OR
    public.is_manager(auth.uid())
);