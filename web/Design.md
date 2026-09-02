---
name: Kawaii Pop
colors:
  primary: "#f8be9e"
  secondary: "#70d6ff"
  background: "#ffffff"
  surface: "#ffffff"
  foreground: "#0a0a0a"
  border: "#0a0a0a"
  accent: "#ffd670"
  success: "#bcffbe"
  info: "#70d6ff"
  warning: "#ffd670"
  danger: "#ff7096"
colors-dark:
  primary: "#f8be9e"
  secondary: "#70d6ff"
  background: "#0a0a0a"
  surface: "#1e1e1e"
  foreground: "#f5f5f5"
  border: "#ffffff"
  accent: "#ffd670"
  success: "#bcffbe"
  info: "#70d6ff"
  warning: "#ffd670"
  danger: "#ff7096"
typography:
  display-lg:
    fontFamily: '"Nunito", sans-serif'
    fontSize: 2.25rem
    fontWeight: 800
  heading-md:
    fontFamily: '"Nunito", sans-serif'
    fontSize: 1.5rem
    fontWeight: 700
  body-md:
    fontFamily: '"Inter", system-ui, sans-serif'
    fontSize: 1rem
    fontWeight: 400
  label-md:
    fontFamily: '"Inter", system-ui, sans-serif'
    fontSize: 0.875rem
    fontWeight: 500
  caption-sm:
    fontFamily: '"Inter", system-ui, sans-serif'
    fontSize: 0.75rem
    fontWeight: 500
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
rounded:
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  full: 9999px
elevation:
  level0: none
  level1: 0 1px 3px rgba(0, 0, 0, 0.08)
  level2: 0 4px 12px -2px rgba(0, 0, 0, 0.06)
  level3: 0 10px 40px -10px rgba(0, 0, 0, 0.08)
  level4: 0 10px 40px rgba(0, 0, 0, 0.1)
  level5: 0 20px 50px rgba(0, 0, 0, 0.15)
---

## Overview

This design system channels the joy and playfulness of a Japanese kawaii stationery shop — soft pastel colors like strawberry milk and blueberry chiffon, bold black outlines that create the signature sticker effect, and generous rounded corners that feel huggable. It is the aesthetic of a creative lifestyle brand: cute without being childish, bold without being aggressive.

The Kawaii Pop design system embodies a cute kawaii-inspired aesthetic with soft pastel colors, rounded elements, and Japanese kawaii culture influences.

---

## Colors

### Foundation

The palette draws from Japanese kawaii culture: warm peachy coral (#f8be9e) for primary actions, bright sky blue (#70d6ff) for secondary, and golden yellow (#ffd670) for accents.

### Action Tones

- **Primary — Peachy Coral (#f8be9e)**: Primary actions and highlights. Soft and inviting.
- **Secondary — Sky Blue (#70d6ff)**: Secondary actions and interactive elements.
- **Accent — Golden Yellow (#ffd670)**: Highlights and special callouts.

### Surface Hierarchy

| Level | Light | Dark | Use |
|-------|-------|------|-----|
| Background | #ffffff | #0a0a0a | Clean white canvas |
| Surface | #ffffff | #1e1e1e | Cards and panels |
| Border | #0a0a0a | #ffffff | Sticker borders |

---

## Typography

### Font Stack

**Nunito** — Rounded and friendly for headings (400-900). **Inter** — Clean body text (400-600). **Noto Sans SC** — For CJK character support.

### Type Scale

| Role | Font | Size | Weight | Usage |
|------|------|------|--------|-------|
| Display | Nunito | 2.25rem | 800 | Hero headlines |
| Headline | Nunito | 1.5rem | 700 | Section titles |
| Title | Nunito | 1.25rem | 600 | Card titles |
| Body | Inter | 1rem | 400 | Content text |

---

## Layout & Spacing

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Micro spacing |
| sm | 8px | Tight spacing |
| md | 16px | Default spacing |
| lg | 24px | Section spacing |
| xl | 32px | Large margins |

---

## Elevation & Depth

The signature kawaii shadow effect uses chunky, offset shadows:

| Level | Shadow | Usage |
|-------|--------|-------|
| Level 0 | none | Flat surfaces |
| Level 1 | `0 1px 3px rgba(0,0,0,0.08)` | Subtle elements |
| Level 2 | `0 4px 12px -2px rgba(0,0,0,0.06)` | Card default |
| Level 3 | `0 10px 40px -10px rgba(0,0,0,0.08)` | Card hover |
| Level 4 | `0 10px 40px rgba(0,0,0,0.1)` | Modals |
| Level 5 | `0 20px 50px rgba(0,0,0,0.15)` | Overlays |

---

## Shapes

Generous rounding is key to the kawaii feel:

| Token | Value | Usage |
|-------|-------|-------|
| sm | 8px | Small elements |
| md | 16px | Buttons, inputs |
| lg | 24px | Standard cards |
| xl | 32px | Large cards |
| full | 9999px | Pills, badges |

---

## Components

### Buttons & Interaction

**Shape**: rounded-2xl (24px) default — big, bouncy, huggable. Some use full pill. Thick black borders (3px) for sticker effect. On hover: translateY(-4px) with shadow expansion.

### Inputs

rounded-2xl (16px) default. Thick black borders (2-3px) for sticker input effect.

### Chips

Pill shape. Selected chips use signature peachy color with dark text.

### Data & Containers

Cards use thick borders plus shadows — the full sticker treatment. rounded-3xl for large cards.

---

## Do's and Don'ts

### Do

- ✅ Use chunky kawaii shadow — the signature detail
- ✅ Use thick black borders (2-3px) on interactive elements
- ✅ Use generous rounded corners (rounded-2xl minimum)
- ✅ Use Nunito for headings — rounded and playful
- ✅ Keep colors pastel but saturated

### Don't

- ❌ Don't use thin borders
- ❌ Don't use sharp corners
- ❌ Don't use subtle shadows
- ❌ Don't desaturate in dark mode
- ❌ Don't use corporate fonts
