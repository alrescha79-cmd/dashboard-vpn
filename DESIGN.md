# Design Direction: Modern Minimalist VPN Dashboard

**Context:** Production VPN Dashboard & Reseller Portal  
**Target Audience:** VPN users, resellers, server admins  
**Visual Tone:** Modern Minimalist, high contrast, clean typography, functional density  

## Dials
- **ENERGY:** 1 (Calm, clear, focused on utility)
- **RHYTHM:** 2 (Structured cards, data tables, and modal drawers)
- **MOTION:** 1 (Subtle hover and dropdown transitions only; no bouncing/flashy motion)

## Color Palette
- **Background Base:** Slate 950 (`#020617`)
- **Card / Surface:** Slate 900 (`#0f172a`)
- **Border / Divider:** Slate 800 (`#1e293b`)
- **Text Primary:** Slate 100 (`#f1f5f9`)
- **Text Muted:** Slate 400 (`#94a3b8`)
- **Primary Accent:** Indigo 500 (`#6366f1`)
- **Success / Balance:** Emerald 500 (`#10b981`)
- **Danger / Expired:** Rose 500 (`#f43f5e`)

## Typography & Components
- **Sans-serif:** System font stack (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)
- **Monospace:** JetBrains Mono / Fira Code / monospace for VPN credentials, config strings, and URLs
- **Buttons & Badges:** Rounded-lg (8px), no excessive pill styling, no stacked blur+glow
- **Accessibility:** Minimum contrast 4.5:1 on all text; visible focus rings; minimum 44px touch targets on mobile
