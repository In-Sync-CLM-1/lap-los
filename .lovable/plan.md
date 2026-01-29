

# Add Referral Link to Sidebar Profile Section

## Overview

Currently, the referral link and QR code are only accessible on the Settings page. You want a quick-access link directly in the sidebar profile section (where the email and "Administrator" role are displayed) so users can easily copy/share their referral link without navigating away from their current page.

---

## Current State

The sidebar profile section (in `AppLayout.tsx`) currently shows:
- User avatar
- User email/name
- Role badge

The referral code is only accessible by going to **Settings → Referral QR Card**.

---

## Proposed Solution

Add a clickable referral link button/icon directly in the sidebar profile area that:
1. Shows a **Share/QR icon** next to user info
2. Opens a **popover or dialog** with the referral link and quick copy option
3. Includes a link to full Settings page for QR code download

---

## UI Design

```text
Sidebar Profile Section (Enhanced)
+--------------------------------------------+
|  [Avatar]  a@in-sync.co.in                 |
|            Administrator                    |
|            [🔗 My Referral Link]           |
+--------------------------------------------+

When clicked, shows popover:
+--------------------------------------------+
|  Share your referral link                  |
|                                            |
|  [https://niyara.lovable.app/apply/NC-XX] |
|                                            |
|  [Copy Link] [Open] [View QR in Settings] |
+--------------------------------------------+
```

---

## Implementation Changes

### File: `src/components/layout/AppLayout.tsx`

1. **Add state and effect** to fetch referral code (similar to Settings page)
2. **Add referral link button** in the sidebar profile section
3. **Add Popover component** for quick access to copy/share

### Key Changes:

```text
// Add imports
- useState, useEffect
- Popover, PopoverTrigger, PopoverContent
- Link2, Copy, ExternalLink icons
- generateReferralUrl from referral-utils

// Add state
const [referralCode, setReferralCode] = useState<string | null>(null);

// Add useEffect to fetch referral code
useEffect(() => {
  // Fetch referral_code from profiles table
}, [user?.id]);

// Add to profile section (lines 131-148)
<Button variant="ghost" size="sm" className="gap-1">
  <Link2 className="w-4 h-4" />
  My Referral Link
</Button>
```

---

## Component Structure

### Sidebar Profile Section Enhancement

```tsx
{/* User Profile with Referral Link */}
<div className="border-t border-sidebar-border p-4">
  <div className="flex items-center gap-3">
    <Avatar>...</Avatar>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium">{profile?.full_name}</p>
      <p className="text-xs text-muted">{ROLE_LABELS[primaryRole]}</p>
    </div>
  </div>
  
  {/* NEW: Referral Link Button */}
  {referralCode && (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full mt-2 gap-2">
          <Link2 className="w-4 h-4" />
          My Referral Link
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <h4 className="font-medium">Share Your Referral Link</h4>
          <div className="flex gap-2">
            <Input value={referralUrl} readOnly className="text-xs" />
            <Button size="icon" onClick={handleCopyLink}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openLink}>
              <ExternalLink /> Open
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings">View QR Code</Link>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )}
</div>
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/layout/AppLayout.tsx` | Add referral link popover button to sidebar profile section |

**No new files needed** - only enhancing the existing sidebar component.

---

## Technical Notes

- Uses existing `generateReferralUrl()` from `src/lib/referral-utils.ts`
- Fetches `referral_code` from the `profiles` table using existing Supabase client
- Popover provides quick copy without leaving current page
- Links to Settings page for full QR code and download options

