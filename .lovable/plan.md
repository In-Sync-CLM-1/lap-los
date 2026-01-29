

# Implementation Plan: 5 Missing Lead Capture Features

## Overview

This plan addresses 5 gaps identified in the Niyara LOS lead capture system:

1. **Resi/Rented Status** - Not captured in the form
2. **Partnership Channel** - Fields exist but no separate capture UI
3. **Tech Channel (WhatsApp/Website)** - Only physical mode UI exists
4. **OCR for Aadhaar/PAN** - No OCR implementation
5. **Lead Scoring & Nurturing** - No scoring/nurturing stage before LOS initiation

---

## Feature 1: Resi/Rented Status

### What's Missing
The customer's residence ownership status (Owned vs Rented) is not captured anywhere in the lead form.

### Solution
Add a "Residence Status" field to the Customer Details tab with options:
- Owned
- Rented
- Family-owned
- Company-provided

### Changes Required
- **Database**: Add `residence_status` column to `leads` table
- **UI**: Add Select dropdown in NewLead.tsx Customer tab
- **Types**: Update Lead interface in database.ts

---

## Feature 2: Partnership Channel UI

### What's Missing
Database has `source_channel` and `partner_code` fields, but currently form always submits `source_channel: 'physical'` with no UI for partnership leads.

### Solution
Create a channel selection at the start of lead capture with dedicated Partnership mode:
- Physical Mode (current default)
- Partnership Mode with partner code input

### Changes Required
- **UI**: Add channel selector at top of NewLead.tsx
- **UI**: Show partner code field when Partnership selected
- **Logic**: Update form submission to include selected channel

---

## Feature 3: Tech Channel (WhatsApp/Website)

### What's Missing
No way to capture leads coming from WhatsApp or Website channels.

### Solution
Extend channel selector to include:
- Tech - WhatsApp (simplified form with pre-filled data)
- Tech - Website (for API-submitted leads)

Create a dedicated component for quick lead capture optimized for these channels.

### Changes Required
- **New Page**: `LeadCapture.tsx` - minimal form for tech channels
- **UI**: Channel tabs with Physical, Partnership, Tech modes
- **Database**: Add `tech_source_reference` column for tracking WhatsApp/Web IDs

---

## Feature 4: OCR for Aadhaar/PAN

### What's Missing
No OCR capability to extract data from uploaded Aadhaar/PAN documents.

### Solution
Implement mock OCR API that:
1. Accepts document image
2. Returns extracted data (name, number, DOB, address)
3. Pre-fills form fields with extracted data

Since real integrations come later, this creates the framework with mock responses.

### Changes Required
- **New API**: Add `performOCR()` function in mock-apis.ts
- **New Component**: `OCRDocumentCapture.tsx` - camera/upload with OCR processing
- **UI**: Add OCR button next to PAN/Aadhaar fields
- **Logic**: Auto-fill form fields after successful OCR

---

## Feature 5: Lead Scoring & Nurturing

### What's Missing
No pre-LOS stage where leads are scored and nurtured before formal application initiation.

### Solution
Implement a lead scoring system with:
1. **Auto-calculated lead score** based on:
   - Business vintage
   - Requested amount vs profile
   - Document completeness
   - Property availability
   - Previous history (dedupe result)

2. **Lead stages**:
   - Raw Lead → Scored → Qualified → Ready for LOS

3. **Nurturing indicators**:
   - Hot/Warm/Cold classification
   - Follow-up reminders
   - Conversion probability

### Changes Required
- **Database**: Add columns to leads table:
  - `lead_score` (integer 0-100)
  - `lead_temperature` (enum: hot/warm/cold)
  - `qualification_status` (enum: raw/scored/qualified/los_ready)
  - `scoring_factors` (jsonb for breakdown)
  - `next_followup_at` (timestamp)
- **New Component**: `LeadScoreCard.tsx` - displays score with breakdown
- **New Component**: `LeadNurturing.tsx` - follow-up actions
- **Logic**: `calculateLeadScore()` function
- **UI**: Score display on lead cards and lead detail page

---

## Database Migration

```sql
-- Add missing columns to leads table
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
```

---

## New Files to Create

| File | Purpose |
|------|---------|
| `src/lib/lead-scoring.ts` | Lead score calculation logic |
| `src/lib/ocr-mock.ts` | Mock OCR API functions |
| `src/components/leads/ChannelSelector.tsx` | Channel mode selector UI |
| `src/components/leads/LeadScoreCard.tsx` | Score display component |
| `src/components/leads/OCRDocumentCapture.tsx` | OCR-enabled document capture |
| `src/components/leads/PartnerCodeInput.tsx` | Partner code input with validation |
| `src/components/leads/LeadNurturingPanel.tsx` | Nurturing actions panel |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/NewLead.tsx` | Add channel selector, residence status, OCR integration |
| `src/pages/LeadsList.tsx` | Show lead score/temperature badges |
| `src/pages/LeadDetail.tsx` | Show full scoring breakdown and nurturing panel |
| `src/types/database.ts` | Add new fields to Lead interface |
| `src/lib/mock-apis.ts` | Add OCR mock API |

---

## UI Flow Changes

### Lead Capture Entry Point

```text
+--------------------------------------------------+
|  How is this lead being sourced?                 |
|                                                  |
|  [Physical]  [Partnership]  [WhatsApp]  [Web]    |
|                                                  |
+--------------------------------------------------+

Physical Mode:
- Full form with geo-tagging
- All fields visible

Partnership Mode:
- Partner Code field required
- Source channel = 'partnership'
- Partner lookup/validation

WhatsApp/Web Mode:
- Minimal quick entry
- Auto-fill capabilities
- Source channel = 'whatsapp' or 'website'
```

### Lead Score Display

```text
Lead Card:
+------------------------------------------+
|  John Doe                 [Score: 78]    |
|  NC-L-20250129-00001  •  Business Loan   |
|  🔥 HOT  •  Qualified                    |
+------------------------------------------+

Score Breakdown:
+------------------------------------------+
|  Lead Score: 78/100                      |
|  ══════════════════════════════          |
|                                          |
|  ✓ Business Vintage (5+ years)    +20   |
|  ✓ Property Available             +15   |
|  ✓ Documents Complete             +25   |
|  ✓ Bureau Score 750+              +10   |
|  △ High Loan Amount               -5    |
|  ✓ Dedupe Clean                   +13   |
+------------------------------------------+
```

---

## Implementation Order

1. **Database migration** - Add all new columns
2. **Residence Status** - Quick win, simple addition
3. **Channel Selector + Partnership UI** - Foundational for other channels
4. **Lead Scoring Engine** - Core scoring logic
5. **OCR Mock API** - Framework for future real integration
6. **Nurturing Panel** - Completes the pre-LOS workflow

---

## Technical Notes

### Lead Scoring Algorithm

```javascript
function calculateLeadScore(lead: Lead): number {
  let score = 50; // Base score
  
  // Business Vintage (+20 max)
  if (lead.business_vintage_years >= 5) score += 20;
  else if (lead.business_vintage_years >= 2) score += 10;
  
  // Property (+15)
  if (lead.has_property) score += 15;
  
  // Document Completeness (+25 max)
  // Based on uploaded documents count vs required
  
  // GST/Udyam Registration (+10)
  if (lead.gst_number || lead.udyam_number) score += 10;
  
  // Amount reasonability (-10 to +10)
  // Based on product type and business profile
  
  return Math.min(100, Math.max(0, score));
}
```

### OCR Mock Response Structure

```typescript
interface OCRResult {
  documentType: 'aadhaar' | 'pan';
  extractedData: {
    name?: string;
    number: string;
    dateOfBirth?: string;
    address?: string;
    gender?: string;
  };
  confidence: number;
  rawText?: string;
}
```

---

## Estimated Scope

- **New files**: 7 components + 2 utility files
- **Modified files**: 4 existing files
- **Database**: 1 migration (7 new columns)
- **No external dependencies** needed

