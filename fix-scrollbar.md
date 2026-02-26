# Fix: Remove Browser Scrollbar

Remove the visible scrollbar from the app while keeping scroll functionality.

Add these styles to the global CSS file (globals.css, global.css, or styles.css — whichever exists):

```css
/* Hide scrollbar across all browsers */
html, body {
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

html::-webkit-scrollbar,
body::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}
```

Also apply to any scrollable containers in the app that show a visible scrollbar.

Commit as `style: hide browser scrollbar` and push to main.
