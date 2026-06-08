---
version: alpha
name: KasKu
description: >
  Mobile-first financial tracking PWA for personal and small-business cash-flow
  management. Deep-space dark theme with violet and cyan accents.

colors:
  primary: "#7C3AED"
  primary-light: "#9F67FF"
  primary-dark: "#5B21B6"
  secondary: "#06B6D4"
  secondary-light: "#22D3EE"
  secondary-dark: "#0891B2"
  background: "#0A0A15"
  surface: "#13132B"
  on-surface: "#E2E8F0"
  on-surface-muted: "#94A3B8"
  error: "#F87171"
  success: "#34D399"
  warning: "#FBBF24"
  info: "#60A5FA"
  neutral: "#64748B"
  border: "rgba(124, 58, 237, 0.15)"

typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: -0.025em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.015em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.04em
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.4

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  page: 16px
  nav-height: 56px

rounded:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 14px
    typography: "{typography.body-md}"
  button-primary-hover:
    backgroundColor: "{colors.primary-light}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 14px
  card:
    backgroundColor: "rgba(19, 19, 43, 0.75)"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  input:
    backgroundColor: "rgba(19, 19, 43, 0.6)"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  bottom-nav:
    backgroundColor: "rgba(10, 10, 21, 0.95)"
    textColor: "{colors.neutral}"
    height: "{spacing.nav-height}"
  bottom-nav-active:
    textColor: "{colors.primary}"
  chip-in:
    backgroundColor: "rgba(52, 211, 153, 0.15)"
    textColor: "{colors.success}"
    rounded: "{rounded.full}"
  chip-out:
    backgroundColor: "rgba(248, 113, 113, 0.15)"
    textColor: "{colors.error}"
    rounded: "{rounded.full}"
---

# KasKu – Design System

## Overview

KasKu is a mobile-first PWA for tracking personal and small-business cash flows. The design evokes a **deep space / dark violet** atmosphere — confident, focused, and modern — to make financial data feel premium rather than intimidating.

The aesthetic is built on three pillars:

1. **Glassmorphism surfaces** — translucent dark panels with violet-tinted borders and backdrop blur give depth without heavy shadows.
2. **Violet & cyan duality** — the primary violet (`#7C3AED`) signals action and trust; the cyan accent (`#06B6D4`) adds energy in gradients and highlights.
3. **Smooth motion** — subtle floating blobs, fade-in-up entrances, and pulsing glows make the UI feel alive without being distracting.

The target audience is everyday users managing personal or micro-business finances on their smartphones. The tone is calm and reassuring: clear numbers, uncluttered layouts, and instant feedback.

## Colors

The palette is anchored in a near-black background with a vibrant violet primary and a cyan accent. Color carries semantic meaning — especially for financial data.

- **Primary (`#7C3AED`):** Deep violet used for all primary actions, selected navigation states, focus rings, and CTA buttons. It signals interactivity and brand identity.
- **Primary Light (`#9F67FF`):** Used in gradient text effects and hover states to lighten the primary.
- **Secondary (`#06B6D4`):** Cyan accent applied in gradient highlights and decorative blobs. Never used as a primary action color.
- **Background (`#0A0A15`):** Near-black with a dark violet undertone. All pages use this as the base.
- **Surface (`#13132B`):** Slightly lighter than background; the base color for card panels before the glass effect is applied.
- **On-Surface (`#E2E8F0`):** Cool slate-white for all primary text.
- **On-Surface Muted (`#94A3B8`):** Secondary text, timestamps, helper labels.
- **Success (`#34D399`):** Cash-IN amounts and positive indicators (green).
- **Error (`#F87171`):** Cash-OUT amounts and destructive actions (soft red).
- **Warning (`#FBBF24`):** Non-critical alerts.
- **Info (`#60A5FA`):** Informational callouts.
- **Border (`rgba(124, 58, 237, 0.15)`):** Subtle violet-tinted borders on glass cards and dividers.

## Typography

All text is set in **Inter**, loaded via `next/font/google` with `display: swap`. Inter's geometric clarity works well at small mobile sizes while feeling premium at display scale.

- **H1 / H2 / H3:** Heavy weights (800 / 700) with tight negative letter spacing for impactful headings, such as balance amounts and page titles.
- **Body:** Regular weight at 14–16px with comfortable line height for transaction lists and form labels.
- **Labels:** SemiBold at 10–12px with slight positive letter spacing for nav labels, chips, and metadata badges.
- **Caption:** Lightweight at 11px for timestamps and helper text.

Gradient text (`.gradient-text`) is applied to the app name and key hero figures using a `#9F67FF → #7C3AED → #06B6D4` diagonal gradient.

## Layout

KasKu is **mobile-first**. All layouts target a single-column flow for screens up to ~430px, with no desktop breakpoints required for the core experience.

The layout is governed by two constants:

- **Page padding:** 16px horizontal on all pages.
- **Bottom navigation bar:** Fixed 56px bar at the bottom of the viewport. All page content must include sufficient bottom padding (`padding-bottom: 72px`) to avoid being hidden behind the nav bar.

A strict **8px spacing scale** (xs=4, sm=8, md=16, lg=24, xl=32) maintains visual rhythm across components. Cards have 24px internal padding.

## Elevation & Depth

Depth is conveyed through **glassmorphism** rather than traditional drop shadows. Cards and panels are rendered as translucent layers using backdrop blur:

```
background: rgba(19, 19, 43, 0.75)
backdrop-filter: blur(24px)
border: 1px solid rgba(124, 58, 237, 0.2)
```

Background depth is enhanced by large, blurred decorative blobs (absolute-positioned `div`s with radial gradient fills) that float with `animate-float-slow` and `animate-float-medium` animations. These never interfere with content.

The bottom navigation bar uses a slightly more opaque glass effect (`rgba(10, 10, 21, 0.95)`, blur 20px) to separate it clearly from page content.

## Shapes

The shape language is **softly rounded** — generous radii to feel friendly and modern, while remaining structured enough for a finance tool.

- **Small (8px):** Chips, badges, small tags.
- **Medium (12px):** Input fields, small cards.
- **Large (16px):** Main content cards, modal panels.
- **XL (24px):** Hero balance card, feature-level containers.
- **Full (9999px):** Pills — action chips (cash-in / cash-out type badges).

Inputs use MUI `outlined` variant with rounded corners styled to match the `md` token. The custom scrollbar uses a 3px radius on the thumb.

## Components

### Navigation

The bottom navigation bar (`MuiBottomNavigation`) is the primary wayfinding element. It displays five tabs — Dashboard, Masuk (In), Keluar (Out), Laporan (Report), Profil (Profile) — with labels always visible (`showLabels`). Active tab color is the primary violet; inactive tabs use the neutral slate. All tab elements carry unique IDs (`nav-dashboard`, `nav-masuk`, etc.) for test automation.

### Cards (`.glass`)

The glass card is the workhorse surface. It wraps summary stats, transaction list items, and form containers. All cards use the glassmorphism treatment: semi-transparent dark surface + backdrop blur + violet-tinted border.

### Transaction Chips

Cash-IN amounts are displayed in green pill chips (`rgba(52, 211, 153, 0.15)` background, `#34D399` text). Cash-OUT amounts use red pill chips (`rgba(248, 113, 113, 0.15)` background, `#F87171` text). These are always full-radius (pill) shape.

### Buttons

Primary CTAs use solid violet backgrounds with white text and a 14px padding. On hover, the background shifts to the lighter `primary-light`. Key submit buttons may carry a `pulse-glow` animation (violet glow pulsing every 3s) to draw attention on empty-state screens.

### Inputs

Text inputs are MUI `outlined` with a dark semi-transparent fill, `on-surface` text, and a violet-glow focus ring. Error states use the `error` red. Helper text uses the muted `on-surface-muted` color.

### Loading Screen

A full-screen overlay used during auth state resolution. Prevents flashes of unauthenticated content by blocking rendering until the AppContext has resolved user, vendor, and verification status.

## Do's and Don'ts

- **Do** use primary violet exclusively for the single most important interactive element per view (primary CTA or active nav tab). Don't apply it decoratively.
- **Do** use `#34D399` (success green) for all cash-IN amounts and `#F87171` (error red) for all cash-OUT amounts — these semantic colors must never be swapped.
- **Don't** place content below the bottom nav bar without 72px of bottom padding; it will be obscured on mobile.
- **Do** use `fade-in-up` animation (`0.6s ease-out`) on page/card entrance to provide a polished first-load feel.
- **Don't** declare components inside another component's render body — always define helper components at module scope.
- **Do** maintain WCAG AA contrast (4.5:1) for all body text against the `#0A0A15` background.
- **Don't** mix glassmorphism cards with opaque solid-color cards in the same view — use glass consistently.
- **Do** atomically write both `transactions` and `periodBalances` in a single Firestore `runTransaction` to guarantee data integrity.
