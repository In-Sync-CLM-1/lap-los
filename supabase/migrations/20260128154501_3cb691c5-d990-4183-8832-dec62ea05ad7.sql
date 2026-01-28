-- Create storage bucket for loan documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('loan-documents', 'loan-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for loan-documents bucket
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'loan-documents' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view documents for their leads"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'loan-documents' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    public.has_role(auth.uid(), 'credit_officer') OR
    public.is_manager(auth.uid())
  )
);

CREATE POLICY "Credit officers can update documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'loan-documents' AND
  (
    public.has_role(auth.uid(), 'credit_officer') OR
    public.is_manager(auth.uid())
  )
);