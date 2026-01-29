-- Add unique referral code to each profile
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- Create trigger to auto-generate referral code on profile creation
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'NC-' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_referral_code ON profiles;
CREATE TRIGGER set_referral_code
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- Update existing profiles with referral codes
UPDATE profiles SET referral_code = 'NC-' || UPPER(SUBSTRING(MD5(id::text) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Allow public to read profiles by referral_code (for looking up referrer name)
CREATE POLICY "Allow public to read profiles by referral_code" ON profiles
  FOR SELECT
  USING (referral_code IS NOT NULL);

-- Allow public referral lead inserts
CREATE POLICY "Allow public referral lead inserts" ON leads
  FOR INSERT
  WITH CHECK (
    source_channel = 'referral' 
    AND partner_code IS NOT NULL
  );