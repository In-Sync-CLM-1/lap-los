

# Add Help Widget Script

## Overview
Add the Go In-Sync help widget script to the application by inserting the provided script tag into `index.html`.

## Changes

### File: `index.html`
Add the following script tag before the closing `</body>` tag:

```html
<script src="https://go-in-sync.lovable.app/help-widget.js" data-source="NC"></script>
```

This will load the external help widget on all pages of the application with the "NC" (Niyara Capital) data source identifier.

## Technical Notes
- The script loads asynchronously from an external domain
- The `data-source="NC"` attribute identifies this app to the widget
- No other files need modification -- this is a single-line addition

