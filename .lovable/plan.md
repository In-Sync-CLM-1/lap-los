
# Niyara Capital LOS - Complete Implementation Plan

## Executive Summary
This plan addresses all identified gaps to bring the system from ~85% to 100% completion without requiring external API integrations. The focus is on wiring up the database connections, fixing data flows, and ensuring all mock data transitions to realistic simulated database queries.

---

## Phase 1: Database-Connected Lead Management

### 1.1 Wire NewLead Form to Database
**Current State**: Form simulates submission and shows fake toast
**Target State**: Actually insert leads into `leads` table

**Changes to `src/pages/NewLead.tsx`**:
- Replace `handleSubmit()` simulation with actual Supabase insert
- Auto-generate lead number using database trigger (already exists)
- Save geo-location data properly
- Handle offline queue if network unavailable

### 1.2 Connect LeadsList to Database
**Current State**: Uses hardcoded `mockLeads` array
**Target State**: Fetch real leads from Supabase with proper filtering

**Changes to `src/pages/LeadsList.tsx`**:
- Replace mock data with `useQuery` hook to fetch from `leads` table
- Implement server-side filtering by status and product type
- Add real-time subscription for live updates
- Handle RO vs Manager visibility (ROs see own leads, managers see all)

### 1.3 Add Lead Detail/Edit Page (New Route)
**Current State**: Missing - clicking a lead goes to non-existent `/leads/:id`
**Target State**: Full lead detail view with edit capability

**New file: `src/pages/LeadDetail.tsx`**:
- Display all lead information in organized sections
- Allow editing for leads in `new`, `in_progress`, or `documents_pending` status
- Show document upload section
- Add status change actions (Mark as Documents Pending, Submit for Processing)
- Navigate to Application Processing if lead is converted

**Route Addition to `src/App.tsx`**:
- Add `/leads/:leadId` protected route

---

## Phase 2: Database-Connected Applications Pipeline

### 2.1 Connect Dashboard to Live Data
**Current State**: Uses `mockStats` and `recentLeads` arrays
**Target State**: Real aggregated metrics from database

**Changes to `src/pages/Dashboard.tsx`**:
- Query leads count with date filters
- Query applications by status
- Calculate real conversion rates
- Show actual recent leads from user's data
- Show real pending actions for credit officers/managers

### 2.2 Connect Underwriting Queue to Database
**Current State**: Uses `mockApplications` array
**Target State**: Fetch applications in underwriting/pending statuses

**Changes to `src/pages/Underwriting.tsx`**:
- Query applications with status IN (`submitted`, `underwriting`, `pending_approval`, `deviation`)
- Join with leads table for customer info
- Add real stats (count by status)
- Link Review button to `/applications/:id/process`

### 2.3 Connect ApplicationsList to Database
**Current State**: Uses mock array
**Target State**: Real application list with proper queries

**Changes to `src/pages/ApplicationsList.tsx`**:
- Query all applications visible to user (by RO or by role)
- Include lead data for customer name display
- Link to processing or disbursal pages based on status

### 2.4 Connect Approvals Queue to Database
**Current State**: Uses `mockApprovals` array
**Target State**: Fetch deviation applications pending manager approval

**Changes to `src/pages/Approvals.tsx`**:
- Query applications with `status = 'deviation'` or `has_deviation = true`
- Implement approve/reject actions that update database
- Log workflow history on decision
- Add counter-offer integration (open CounterOfferForm dialog)
- Show real approval history from workflow_history table

---

## Phase 3: Analytics with Aggregated Data

### 3.1 Connect Analytics to Database Queries
**Current State**: All charts use hardcoded mock arrays
**Target State**: Real aggregated data with date range filters

**Changes to `src/pages/Analytics.tsx`**:
- Create Supabase queries for:
  - Lead funnel: count by status
  - Trend data: group by month/week
  - Product mix: count by product_type
  - Rejection reasons: count by rejection_reason
- Dynamically update based on selected date range
- For Top ROs: query profiles joined with leads/applications

---

## Phase 4: Seed Data & Demo Experience

### 4.1 Create Database Seed Function
**Purpose**: Populate database with realistic demo data for customer presentations

**New Edge Function: `supabase/functions/seed-demo-data/index.ts`**:
- Create 20-30 sample leads across all statuses
- Create 15-20 applications in various stages
- Create workflow history entries
- Create sample documents records (metadata only)
- All tied to the current user as RO for visibility

**Trigger**: Button in settings or admin panel (or manual invoke)

### 4.2 Add Demo Data Button
**New file: `src/pages/Settings.tsx`**:
- Simple settings page
- "Seed Demo Data" button for admin users
- PWA settings display

**Route Addition to `src/App.tsx`**:
- Add `/settings` protected route

---

## Phase 5: PWA & Service Worker Fixes

### 5.1 Compile Service Worker
**Current State**: `public/sw.ts` is TypeScript, browsers need JavaScript
**Target State**: Compile to sw.js during build

**Changes to `vite.config.ts`**:
- Add Vite PWA plugin or manual TypeScript compilation step
- Ensure service worker is properly registered

**Alternative**: Rewrite as `public/sw.js` in plain JavaScript for simplicity

### 5.2 Fix Offline Sync Hook Usage
**Current State**: `useOfflineSync` hook exists but may not be used
**Target State**: Integrate into NewLead form for offline lead capture

**Changes**:
- Import and use in NewLead.tsx
- Queue leads when offline, sync when online

---

## Technical Implementation Details

### Database Queries Pattern
All data fetching will use TanStack Query for caching and loading states:

```text
const { data: leads, isLoading } = useQuery({
  queryKey: ['leads', filters],
  queryFn: async () => {
    const query = supabase.from('leads').select('*');
    // Apply filters...
    return query;
  }
});
```

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/NewLead.tsx` | Modify | Wire to Supabase insert |
| `src/pages/LeadsList.tsx` | Modify | Replace mock with DB query |
| `src/pages/LeadDetail.tsx` | Create | New lead detail/edit page |
| `src/pages/Dashboard.tsx` | Modify | Real metrics from DB |
| `src/pages/Underwriting.tsx` | Modify | Query applications |
| `src/pages/ApplicationsList.tsx` | Modify | Query applications |
| `src/pages/Approvals.tsx` | Modify | Query deviations, add actions |
| `src/pages/Analytics.tsx` | Modify | Aggregate queries |
| `src/pages/Settings.tsx` | Create | Settings + demo seed button |
| `src/App.tsx` | Modify | Add new routes |
| `supabase/functions/seed-demo-data/index.ts` | Create | Demo data seeder |
| `public/sw.js` | Create | Compiled service worker |

### New Routes

```text
/leads/:leadId     - Lead detail/edit page
/settings          - User settings page
```

---

## Implementation Sequence

1. **Phase 1**: Lead management (NewLead save, LeadsList query, LeadDetail page)
2. **Phase 2**: Applications pipeline (Dashboard, Underwriting, ApplicationsList, Approvals)
3. **Phase 3**: Analytics with real data
4. **Phase 4**: Demo data seeder + Settings page
5. **Phase 5**: PWA service worker fix

---

## Risk Mitigation

- **RLS Policies**: All queries will respect existing Row Level Security - ROs see their data, managers see all
- **Empty States**: All lists will gracefully handle zero results with appropriate messaging
- **Loading States**: TanStack Query provides built-in loading indicators
- **Error Handling**: Toast notifications for all database errors

---

## Estimated Scope

- **New Files**: 4 (LeadDetail.tsx, Settings.tsx, seed-demo-data/index.ts, sw.js)
- **Modified Files**: 8 (NewLead, LeadsList, Dashboard, Underwriting, ApplicationsList, Approvals, Analytics, App.tsx)
- **No External Dependencies**: All functionality uses existing Supabase tables and mock API simulations

This implementation will make the system fully functional with realistic data flows, ready for customer demonstration.
