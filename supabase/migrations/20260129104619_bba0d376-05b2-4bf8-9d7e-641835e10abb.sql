-- Add missing columns to leads table for complete lead capture
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS residence_status text,
ADD COLUMN IF NOT EXISTS tech_source_reference text,
ADD COLUMN IF NOT EXISTS lead_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS lead_temperature text DEFAULT 'warm',
ADD COLUMN IF NOT EXISTS qualification_status text DEFAULT 'raw',
ADD COLUMN IF NOT EXISTS scoring_factors jsonb,
ADD COLUMN IF NOT EXISTS next_followup_at timestamptz;

-- Add comments for clarity
COMMENT ON COLUMN leads.residence_status IS 'Customer residence: owned, rented, family_owned, company_provided';
COMMENT ON COLUMN leads.lead_temperature IS 'Lead temperature: hot, warm, cold';
COMMENT ON COLUMN leads.qualification_status IS 'Lead qualification: raw, scored, qualified, los_ready';