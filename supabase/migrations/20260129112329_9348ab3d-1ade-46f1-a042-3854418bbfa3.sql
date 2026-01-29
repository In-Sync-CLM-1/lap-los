-- Fix function search path for generate_referral_code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'NC-' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$;