

# Complete Onboarding Walkthrough for New Users

## Overview

This plan implements a guided, step-by-step onboarding experience for new users of the Loan Origination System. The walkthrough will help users understand the platform essentials and be productive from day one.

## Features Included

### 1. Welcome Modal
- Personalized greeting with user's name
- Role-based introduction explaining their specific capabilities
- Quick system overview

### 2. Interactive Guided Tour
- Step-by-step walkthrough highlighting key UI elements
- Tooltips and spotlights on important features
- "Next", "Back", and "Skip" navigation controls

### 3. Tour Steps by Role

**For All Users:**
- Dashboard overview (stats, recent leads, quick actions)
- Creating a new lead (New Lead button)
- Leads list and filtering
- Applications list
- Settings and profile

**For Credit Officers (additional):**
- Underwriting queue
- Application processing

**For Managers (additional):**
- Approvals queue
- Analytics dashboard
- Deviation management

**For Admins (additional):**
- User Management module

### 4. Progress Tracking
- Persistent state tracking (user has completed onboarding)
- Option to restart tour from Settings
- Dismissable but recoverable

## Implementation Approach

### New Components

1. **OnboardingProvider** (`src/contexts/OnboardingContext.tsx`)
   - Global state management for onboarding
   - Tracks current step, completion status
   - Persists to localStorage + database

2. **OnboardingTour** (`src/components/onboarding/OnboardingTour.tsx`)
   - Main tour container
   - Uses spotlight/tooltip approach
   - Mobile-responsive design

3. **OnboardingStep** (`src/components/onboarding/OnboardingStep.tsx`)
   - Individual step display component
   - Tooltip with title, description, action buttons

4. **WelcomeModal** (`src/components/onboarding/WelcomeModal.tsx`)
   - Initial welcome dialog
   - Role-specific content
   - Start tour or skip options

5. **TourSteps** (`src/lib/tour-steps.ts`)
   - Configuration file defining all tour steps
   - Role-based filtering
   - Target element selectors

### Database Changes

Add an `onboarding_completed` boolean field to the `profiles` table to track completion:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
```

### Integration Points

- **AppLayout**: Include OnboardingTour component
- **AuthContext**: Trigger welcome modal for new users
- **Settings page**: Add "Restart Tour" button

### Tour Steps Configuration

```text
Step 1: Welcome Modal
+-------------------------------------------+
|     Welcome to the Loan System!           |
|                                           |
|  Hi [Name], you're logged in as a         |
|  [Role]. Let's show you around.           |
|                                           |
|     [ Start Tour ]    [ Skip for now ]    |
+-------------------------------------------+

Step 2: Dashboard Overview
Target: Dashboard stats cards
"This is your command center - see leads, pending items, and conversion rates at a glance."

Step 3: Create New Lead
Target: "New Lead" button
"Click here to capture a new customer lead. You can add customer, business, and loan details."

Step 4: Leads List
Target: Sidebar "Leads" menu item
"View and manage all your leads here. Use filters to find specific leads quickly."

Step 5: Applications
Target: Sidebar "Applications" menu item
"Track loan applications from submission through approval and disbursal."

Step 6 (Credit Officers): Underwriting Queue
Target: Sidebar "Underwriting" menu item
"Review and process applications assigned to you."

Step 7 (Managers): Approvals
Target: Sidebar "Approvals" menu item
"Approve or reject applications that need your attention."

Step 8 (Managers): Analytics
Target: Sidebar "Analytics" menu item
"View performance metrics and business insights."

Step 9 (Admins): User Management
Target: Sidebar "User Management" menu item
"Manage users, departments, designations, and approval matrix."

Step 10: Profile & Settings
Target: User avatar dropdown
"Access your profile settings and sign out here."

Completion: Success Modal
"You're all set! You can restart this tour anytime from Settings."
```

### Visual Design

- Spotlight overlay darkens the rest of the screen
- Tooltip positioned near the highlighted element
- Smooth animations for transitions
- Progress indicator (dots or bar)
- Mobile-first responsive design

## Technical Details

### Library Approach

Build a lightweight custom solution without external dependencies, using:
- CSS-based spotlight effect with backdrop
- React portals for tooltip rendering
- CSS transitions for animations
- `data-tour` attributes on target elements

### Key Files to Create

| File | Purpose |
|------|---------|
| `src/contexts/OnboardingContext.tsx` | State management |
| `src/components/onboarding/OnboardingTour.tsx` | Main tour controller |
| `src/components/onboarding/TourTooltip.tsx` | Positioned tooltip |
| `src/components/onboarding/TourSpotlight.tsx` | Overlay with cutout |
| `src/components/onboarding/WelcomeModal.tsx` | Initial welcome screen |
| `src/components/onboarding/CompletionModal.tsx` | Success screen |
| `src/lib/tour-steps.ts` | Step definitions |

### Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add OnboardingProvider |
| `src/components/layout/AppLayout.tsx` | Add data-tour attributes, include Tour |
| `src/pages/Dashboard.tsx` | Add data-tour attributes |
| `src/pages/Settings.tsx` | Add "Restart Tour" button |

### Database Migration

```sql
-- Add onboarding tracking to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
```

## Estimated Scope

- **New files**: 7 components + 1 config file
- **Modified files**: 4 existing files
- **Database**: 1 migration (2 new columns)
- **No external dependencies** needed

