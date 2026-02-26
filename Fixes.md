Two fixes for Harmonic Intake:

1. COMPARISON VIEW — Add download and share buttons:
   - When the comparison view is showing (before/after results), add a button row at the top or bottom: [← Back] [Share] [Download]
   - Share and Download should generate a combined comparison card (PNG) showing both sessions side by side:
     - Left: "Before" with key metrics (F0, note, stability, dominant chakra)
     - Right: "After" with the same metrics
     - Arrows or colour coding showing improvements (green up) or changes (amber)
     - Title: "My Voice Journey" or similar
     - Branded with Harmonic Intake logo/name
   - Use the same Web Share API approach as the main results (navigator.share with file on mobile, download fallback on desktop)

2. MICROPHONE PERMISSION — Can't style the native iOS/Android dialog (that's controlled by the OS), BUT we can improve the experience around it:
   - BEFORE triggering getUserMedia, show a custom branded pre-permission screen:
     - Full-screen overlay matching the app's dark glass morphism style
     - Microphone icon (large, animated gentle pulse)
     - Text: "Harmonic Intake needs your microphone to analyse your voice"
     - Subtext: "Your voice is processed locally — nothing is recorded or sent anywhere"
     - A clear "Enable Microphone" button that the user taps
     - ONLY when they tap this button, call getUserMedia (which triggers the native dialog)
   - This way the user expects the permission prompt and it feels intentional, not jarring
   - If permission is denied, show a friendly message explaining how to enable it in Settings

Push to GitHub when done.