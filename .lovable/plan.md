

# Referral Form System for Loan Applications

## Overview

This plan implements a referral system where each logged-in user (RO, Sales Manager, etc.) gets a unique QR code and shareable link in their profile. When a loan seeker accesses this link, they can fill out a comprehensive loan application form with KYC verification - all without requiring login.

---

## Features

### 1. User Profile Enhancements
- **QR Code Display**: Auto-generated QR code unique to each user
- **Shareable Link**: Copy-to-clipboard referral URL
- **Referral Stats**: Track leads generated via referral (optional)

### 2. Public Loan Application Form
- **No Login Required**: Accessible to anyone with the link
- **Full Application Fields**: Customer details, business info, loan requirements
- **KYC Validation**: Mock Aadhaar and PAN verification
- **File Upload**: Document uploads (ID proofs, photos)
- **Mobile-Optimized**: Responsive design for phone submissions

### 3. Lead Attribution
- **Referrer Tracking**: Leads are automatically assigned to the referrer
- **Source Channel**: Marked as "referral" in source_channel
- **Referral Code**: User's unique code stored with the lead

---

## Technical Implementation

### Database Changes

Add referral code column to profiles and new source channel option:

```sql
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

CREATE TRIGGER set_referral_code
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- Update existing profiles with referral codes
UPDATE profiles SET referral_code = 'NC-' || UPPER(SUBSTRING(MD5(id::text) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Add 'referral' to source_channel options (already handled via text column)
```

### New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/ReferralApplication.tsx` | Public loan application form |
| `src/components/referral/ReferralQRCard.tsx` | QR code and link display for Settings page |
| `src/components/referral/PublicApplicationForm.tsx` | Multi-step public application form |
| `src/components/referral/KYCVerificationStep.tsx` | KYC verification UI with mock APIs |
| `src/lib/referral-utils.ts` | QR generation and referral code utilities |

### Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add public route for `/apply/:referralCode` |
| `src/pages/Settings.tsx` | Add Referral QR Card section |
| `src/types/database.ts` | Add referral_code to Profile, 'referral' to SourceChannel |
| `src/lib/mock-apis.ts` | Ensure KYC mocks work without auth context |

---

## User Flow

### For RO/Users (Getting Their Referral Link)

```text
Settings Page
+----------------------------------------------------+
|  My Referral Link                                  |
|                                                    |
|  ┌──────────────────────────────────────────────┐  |
|  │  Share this link with potential customers:   │  |
|  │                                              │  |
|  │  https://niyara.lovable.app/apply/NC-A3B2C1  │  |
|  │                                              │  |
|  │  [Copy Link]                                 │  |
|  └──────────────────────────────────────────────┘  |
|                                                    |
|  ┌─────────────┐                                   |
|  │  ▓▓▓▓▓▓▓▓▓  │   Scan to Apply                  |
|  │  ▓ QR    ▓  │                                   |
|  │  ▓ CODE  ▓  │   Your Referral Code:            |
|  │  ▓▓▓▓▓▓▓▓▓  │   NC-A3B2C1                      |
|  └─────────────┘                                   |
|                                                    |
|  [Download QR]  [Share via WhatsApp]               |
+----------------------------------------------------+
```

### For Loan Seekers (Applying via Link)

```text
Step 1: Personal Details
+----------------------------------------------------+
|     🏦 Niyara Capital                              |
|     Apply for a Loan                               |
|                                                    |
|     Referred by: Rahul Sharma (RO)                 |
+----------------------------------------------------+
|                                                    |
|  Full Name *          [____________________]       |
|  Phone Number *       [____________________]       |
|  Email                [____________________]       |
|  Date of Birth        [____________________]       |
|  Residence Status     [Owned / Rented / ...]       |
|                                                    |
|            [Next: KYC Verification →]              |
+----------------------------------------------------+

Step 2: KYC Verification
+----------------------------------------------------+
|  Verify Your Identity                              |
|                                                    |
|  PAN Number *         [ABCDE1234F_________]        |
|                       [Verify PAN]  ✓ Verified     |
|                                                    |
|  Aadhaar Number *     [1234 5678 9012_____]        |
|                       [Verify Aadhaar] ✓ Verified  |
|                                                    |
|  Upload Documents (Optional)                       |
|  [+ PAN Card Photo]  [+ Aadhaar Photo]             |
|                                                    |
|        [← Back]    [Next: Business Details →]      |
+----------------------------------------------------+

Step 3: Business Details (for Business Loans)
+----------------------------------------------------+
|  Business Information                              |
|                                                    |
|  Business Name        [____________________]       |
|  Business Type        [Proprietorship / ...]       |
|  Years in Business    [____________________]       |
|  GST Number           [____________________]       |
|  Business Address     [____________________]       |
|                                                    |
|        [← Back]    [Next: Loan Details →]          |
+----------------------------------------------------+

Step 4: Loan Details
+----------------------------------------------------+
|  Loan Requirements                                 |
|                                                    |
|  Product Type *       [Business Loan / ...]        |
|  Loan Amount *        [₹ _________________]        |
|  Tenure (months)      [____________________]       |
|  Purpose of Loan      [____________________]       |
|                                                    |
|        [← Back]    [Submit Application →]          |
+----------------------------------------------------+

Step 5: Confirmation
+----------------------------------------------------+
|     ✅ Application Submitted!                      |
|                                                    |
|     Reference: NC-L-20260129-00045                 |
|                                                    |
|     Our team will contact you shortly.             |
|     Expected callback within 24 hours.             |
|                                                    |
|     [Track Application Status]                     |
+----------------------------------------------------+
```

---

## Form Fields Captured

### Personal Details
- Full Name (required)
- Phone Number (required)
- Email
- Date of Birth
- Gender
- Residence Status (Owned/Rented/Family/Company)

### KYC Verification
- PAN Number (with mock verification)
- Aadhaar Number (with mock verification)
- Document uploads (optional)

### Business Details (conditional)
- Business Name
- Business Type
- Business Vintage (years)
- GST Number
- Udyam Number
- Business Address

### Property Details (optional)
- Has Property
- Property Type
- Property Value
- Property Address

### Loan Details
- Product Type (required)
- Requested Amount (required)
- Tenure (months)
- Purpose of Loan

---

## KYC Mock Validation Flow

The form will use existing mock APIs from `src/lib/mock-apis.ts`:

```typescript
// PAN Verification
const panResult = await verifyPAN({
  panNumber: formData.customer_pan,
  name: formData.customer_name,
});

// Show verification status
if (panResult.success && panResult.data?.verified) {
  // Show green checkmark, name match status
} else {
  // Show warning or error
}

// Aadhaar Verification  
const aadhaarResult = await verifyAadhaar({
  aadhaarNumber: formData.customer_aadhaar,
  name: formData.customer_name,
});

// Similar handling
```

---

## Route Configuration

```typescript
// In App.tsx - Add public route OUTSIDE protected routes
<Routes>
  {/* Public Routes */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/apply/:referralCode" element={<ReferralApplication />} />
  
  {/* Protected Routes */}
  ...
</Routes>
```

---

## QR Code Generation

Using a simple QR code library approach (can generate client-side):

```typescript
// src/lib/referral-utils.ts

export function generateReferralUrl(referralCode: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/apply/${referralCode}`;
}

// QR Code will be generated using a lightweight library or API
// Option 1: Use qrcode.react library
// Option 2: Use free QR API like qr-code-generator
```

---

## Database RLS for Public Access

The public application form needs to insert leads without authentication:

```sql
-- Allow public inserts to leads table for referral applications
CREATE POLICY "Allow public referral lead inserts" ON leads
  FOR INSERT
  WITH CHECK (
    source_channel = 'referral' 
    AND partner_code IS NOT NULL
  );

-- The ro_id will be looked up from the referral code
-- and set server-side via the profiles table
```

---

## Lead Assignment Logic

When a public application is submitted:

1. Look up referrer's `user_id` from `profiles` using `referral_code`
2. Set `ro_id` to the referrer's user_id
3. Set `source_channel` to `'referral'`
4. Set `partner_code` to the referral code (for tracking)
5. Insert lead with status `'new'`

---

## Security Considerations

- **Rate Limiting**: Consider adding rate limiting for public form submissions
- **Captcha**: Could add reCAPTCHA for spam prevention (future enhancement)
- **Validation**: All inputs validated on client and RLS ensures proper data
- **Referral Code Validation**: Check code exists before allowing form submission

---

## Implementation Order

1. **Database migration** - Add referral_code column and trigger
2. **Referral utilities** - QR generation and URL helpers
3. **ReferralQRCard component** - Display in Settings page
4. **Public application form** - Multi-step form with all fields
5. **KYC verification step** - Mock API integration
6. **Route configuration** - Add public route
7. **Lead submission logic** - Handle attribution and insert

---

## Estimated Scope

- **New files**: 5 components/utilities
- **Modified files**: 4 existing files
- **Database**: 1 migration (referral_code column + trigger)
- **New dependency**: QR code generation (lightweight library or API-based)

