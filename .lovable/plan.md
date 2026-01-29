

# Reports Section with Downloadable CSV Reports

## Overview

This plan adds a dedicated **Reports** section to the LOS with comprehensive downloadable reports in CSV format. The reports will include Application Number, Loan ID, and Client ID fields, grouped appropriately across different report types for MIS and audit purposes.

---

## Report Types

### 1. Lead Report
All leads with customer and scoring information

| Column | Description |
|--------|-------------|
| Lead Number (Lead ID) | NC-L-YYYYMMDD-XXXXX |
| Client Name | Customer name |
| Phone | Contact number |
| Email | Email address |
| Product Type | Business Loan, Personal Loan, etc. |
| Requested Amount | Loan amount requested |
| Lead Score | 0-100 score |
| Temperature | Hot/Warm/Cold |
| Qualification Status | Raw/Scored/Qualified/LOS Ready |
| Source Channel | Physical/Partnership/WhatsApp/Website |
| Status | Lead status |
| RO Name | Assigned relationship officer |
| Created Date | Lead creation date |

### 2. Application Report
All applications with processing details

| Column | Description |
|--------|-------------|
| Application Number | NC-A-YYYYMMDD-XXXXX |
| Lead Number | Linked lead ID |
| Client Name | Customer name |
| Product Type | Loan type |
| Requested Amount | Original request |
| Final Amount | Sanctioned amount |
| BRE Score | Business rule engine score |
| BRE Decision | STP/Non-STP/Rejected |
| Status | Current application status |
| Interest Rate | Final rate % |
| Tenure | Months |
| EMI | Monthly installment |
| RO Name | Relationship officer |
| Underwriter Name | Assigned underwriter |
| Created Date | Application date |
| Approved Date | Approval date |

### 3. Disbursal Report
Disbursed loans with bank details

| Column | Description |
|--------|-------------|
| Application Number | Loan ID reference |
| Lead Number | Lead reference |
| Client Name | Borrower name |
| Product Type | Loan type |
| Sanctioned Amount | Approved amount |
| Disbursed Amount | Amount disbursed |
| Bank Name | Beneficiary bank |
| Account Number | Bank account |
| IFSC Code | Bank branch code |
| Disbursed Date | Disbursal date |
| RO Name | Sourcing officer |

### 4. Rejection Analysis Report
Rejected applications with reasons

| Column | Description |
|--------|-------------|
| Application Number | Application ID |
| Lead Number | Lead reference |
| Client Name | Applicant name |
| Product Type | Loan type |
| Requested Amount | Original request |
| BRE Score | Score at rejection |
| Rejection Reason | Reason for rejection |
| Rejected By | Rejecting officer |
| Rejected Date | Date of rejection |

### 5. Pipeline Report
Active applications in progress

| Column | Description |
|--------|-------------|
| Application Number | Application ID |
| Lead Number | Lead reference |
| Client Name | Applicant name |
| Product Type | Loan type |
| Amount | Loan amount |
| Status | Current stage |
| Days in Stage | TAT tracking |
| Current Assignee | Who owns it now |
| Created Date | When created |

---

## UI Design

```text
Reports Page
+------------------------------------------------------------------+
|  📊 Reports & MIS                                                |
|  Download comprehensive reports for analysis and audit           |
+------------------------------------------------------------------+
|                                                                  |
|  Date Range: [From: ___] [To: ___]   [Apply Filters]            |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  ┌─────────────────────────────────────────────────────────┐    |
|  │  📋 Lead Report                                          │    |
|  │  All leads with customer details and scoring             │    |
|  │                                                          │    |
|  │  Records: 1,234  |  Last Updated: Just now               │    |
|  │                                                          │    |
|  │  [Download CSV]  [Download Excel]                        │    |
|  └─────────────────────────────────────────────────────────┘    |
|                                                                  |
|  ┌─────────────────────────────────────────────────────────┐    |
|  │  📄 Application Report                                   │    |
|  │  All applications with BRE results and offer details     │    |
|  │                                                          │    |
|  │  Records: 456  |  Last Updated: Just now                 │    |
|  │                                                          │    |
|  │  [Download CSV]  [Download Excel]                        │    |
|  └─────────────────────────────────────────────────────────┘    |
|                                                                  |
|  ┌─────────────────────────────────────────────────────────┐    |
|  │  💰 Disbursal Report                                     │    |
|  │  Disbursed loans with bank and amount details            │    |
|  │                                                          │    |
|  │  Records: 123  |  Total: ₹45.6 Cr                        │    |
|  │                                                          │    |
|  │  [Download CSV]  [Download Excel]                        │    |
|  └─────────────────────────────────────────────────────────┘    |
|                                                                  |
|  ┌─────────────────────────────────────────────────────────┐    |
|  │  ❌ Rejection Analysis                                   │    |
|  │  Rejected applications with reasons                      │    |
|  │                                                          │    |
|  │  Records: 89  |  Rejection Rate: 12.3%                   │    |
|  │                                                          │    |
|  │  [Download CSV]  [Download Excel]                        │    |
|  └─────────────────────────────────────────────────────────┘    |
|                                                                  |
|  ┌─────────────────────────────────────────────────────────┐    |
|  │  🔄 Pipeline Report                                      │    |
|  │  Active applications with TAT tracking                   │    |
|  │                                                          │    |
|  │  Records: 78  |  Avg TAT: 2.4 days                       │    |
|  │                                                          │    |
|  │  [Download CSV]  [Download Excel]                        │    |
|  └─────────────────────────────────────────────────────────┘    |
|                                                                  |
+------------------------------------------------------------------+
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Reports.tsx` | Main reports page with all report cards |
| `src/components/reports/ReportCard.tsx` | Reusable report card component |
| `src/lib/report-generators.ts` | Functions to format data for each report type |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/reports` route (management access) |
| `src/components/layout/AppLayout.tsx` | Add "Reports" to navigation |
| `src/lib/export-utils.ts` | Add new export formatters if needed |

---

## Technical Implementation

### Report Data Fetching

Each report will fetch data from Supabase with appropriate joins:

```typescript
// Lead Report - joins profiles for RO name
const leadsQuery = supabase
  .from('leads')
  .select(`
    lead_number,
    customer_name,
    customer_phone,
    customer_email,
    product_type,
    requested_amount,
    lead_score,
    lead_temperature,
    qualification_status,
    source_channel,
    status,
    created_at,
    profiles!ro_id(full_name)
  `)
  .gte('created_at', dateFrom)
  .lte('created_at', dateTo);

// Application Report - joins leads and profiles
const applicationsQuery = supabase
  .from('applications')
  .select(`
    application_number,
    status,
    bre_score,
    bre_decision,
    final_amount,
    final_interest_rate,
    final_tenure_months,
    final_emi,
    created_at,
    approved_at,
    leads!inner(
      lead_number,
      customer_name,
      product_type,
      requested_amount
    ),
    ro:profiles!ro_id(full_name),
    underwriter:profiles!assigned_underwriter_id(full_name)
  `)
  .gte('created_at', dateFrom)
  .lte('created_at', dateTo);
```

### ID Grouping Strategy

Reports will include these ID fields for proper grouping:

1. **Lead Number** (Client ID): `NC-L-YYYYMMDD-XXXXX` - Primary identifier for the customer lead
2. **Application Number** (Loan ID): `NC-A-YYYYMMDD-XXXXX` - Unique loan application reference
3. **Client Name**: For human-readable identification

This allows:
- Grouping all applications by Lead Number to see customer history
- Tracking loan lifecycle by Application Number
- Cross-referencing between leads and applications

---

## Navigation Addition

Add to `navItems` array in AppLayout.tsx:

```typescript
{ 
  label: 'Reports', 
  href: '/reports', 
  icon: FileBarChart2, // or Download icon
  roles: ['sales_manager', 'regional_head', 'zonal_head', 'ceo', 'admin'],
  tourId: 'nav-reports'
},
```

Position: Between "Analytics" and "User Management"

---

## Date Filter Logic

```typescript
const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30));
const [dateTo, setDateTo] = useState<Date>(new Date());

// Quick presets
const presets = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'This Month', value: 'mtd' },
  { label: 'This Quarter', value: 'qtd' },
  { label: 'This Year', value: 'ytd' },
];
```

---

## Export Function Enhancement

Add to `src/lib/report-generators.ts`:

```typescript
export function formatLeadReport(leads: LeadWithProfile[]): ExportData {
  return {
    headers: [
      'Lead Number',
      'Client Name',
      'Phone',
      'Email',
      'Product Type',
      'Requested Amount',
      'Lead Score',
      'Temperature',
      'Qualification',
      'Source Channel',
      'Status',
      'RO Name',
      'Created Date'
    ],
    rows: leads.map(lead => [
      lead.lead_number,
      lead.customer_name,
      lead.customer_phone,
      lead.customer_email || '',
      PRODUCT_LABELS[lead.product_type],
      lead.requested_amount,
      lead.lead_score || 0,
      lead.lead_temperature || 'N/A',
      lead.qualification_status || 'raw',
      lead.source_channel,
      LEAD_STATUS_LABELS[lead.status],
      lead.profiles?.full_name || 'Unknown',
      format(new Date(lead.created_at), 'dd-MMM-yyyy')
    ])
  };
}

// Similar functions for other report types
```

---

## Access Control

Reports are accessible to management roles only:
- Sales Manager
- Regional Head
- Zonal Head
- CEO
- Admin

ROs and Credit Officers do not have access to the full reports section (they can export from their respective list views).

---

## Summary

| Item | Details |
|------|---------|
| New Files | 3 (Reports.tsx, ReportCard.tsx, report-generators.ts) |
| Modified Files | 2 (App.tsx, AppLayout.tsx) |
| Report Types | 5 (Lead, Application, Disbursal, Rejection, Pipeline) |
| Access | Management roles only |
| Features | Date filtering, CSV/Excel export, record counts |

