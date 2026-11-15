---
name: Kinetic Glass
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363940'
  surface-container-lowest: '#0b0e14'
  surface-container-low: '#191c22'
  surface-container: '#1d2026'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2eb'
  on-surface-variant: '#d0c6ab'
  inverse-surface: '#e1e2eb'
  inverse-on-surface: '#2e3037'
  outline: '#999077'
  outline-variant: '#4d4732'
  surface-tint: '#e9c400'
  primary: '#fff6df'
  on-primary: '#3a3000'
  primary-container: '#ffd700'
  on-primary-container: '#705e00'
  inverse-primary: '#705d00'
  secondary: '#adc7ff'
  on-secondary: '#002e68'
  secondary-container: '#4a8eff'
  on-secondary-container: '#00285b'
  tertiary: '#e0ffda'
  on-tertiary: '#00390f'
  tertiary-container: '#7af386'
  on-tertiary-container: '#006f25'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe16d'
  primary-fixed-dim: '#e9c400'
  on-primary-fixed: '#221b00'
  on-primary-fixed-variant: '#544600'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc7ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#004493'
  tertiary-fixed: '#83fc8e'
  tertiary-fixed-dim: '#66df75'
  on-tertiary-fixed: '#002106'
  on-tertiary-fixed-variant: '#00531a'
  background: '#10131a'
  on-background: '#e1e2eb'
  surface-variant: '#32353c'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
The design system embodies a high-tech, premium aesthetic tailored for a youthful, tech-savvy audience. It shifts the existing brand identity toward a more sophisticated, "pro-grade" experience by leveraging **Glassmorphism** and **Modern Minimalism**. 

The personality is energetic and authoritative, utilizing deep, dark surfaces to allow vibrant brand colors to pop as functional signals rather than static fills. The emotional response is one of precision, speed, and high-quality craftsmanship, moving away from flat design toward a tactile, layered digital environment that feels like a futuristic command center.

## Colors
This design system uses a **Deep Charcoal (#0B0E14)** as the primary canvas to ensure high contrast and a premium feel. Brand colors are reimagined as "Luminous Accents":

*   **Kinetic Gold (#FFD700):** Used for primary actions, critical data highlights, and premium status.
*   **Electric Blue (#007BFF):** Used for information, links, and secondary interactive states.
*   **Growth Green (#28A745):** Used for positive trends, success states, and tertiary highlights.
*   **Urgent Red (#DC3545):** Reserved for alerts, destructive actions, and negative trends.

Gradients should be used sparingly, typically flowing from a brand color to a transparent or darker version of itself to create depth and a "glow" effect on the dark background.

## Typography
We utilize **Hanken Grotesk** across all levels to maintain a clean, sharp, and contemporary feel. 

*   **Display & Headlines:** Use heavier weights (700-800) with slight negative letter spacing to create a dense, high-impact look for marketing and dashboard headers.
*   **Body Text:** Prioritize readability with the 400 weight. Use `body-lg` for introductory paragraphs and `body-md` for standard content.
*   **Labels:** Labels and small UI triggers use the 600 weight and uppercase styling to distinguish them from body content, evoking a technical "readout" aesthetic.

## Layout & Spacing
The layout follows a **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

A strict 8px base unit (the "Kinetic Step") governs all spatial relationships. Spacing is intentionally generous to prevent the dark UI from feeling cramped. 
*   **Containers:** Use `lg` (48px) or `xl` (80px) padding for section headers to create clear visual separation.
*   **Components:** Small components like chips use `xs` (4px) vertical and `sm` (12px) horizontal padding.
*   **Desktop:** Max-width of 1440px with a center-aligned fixed gutter.
*   **Mobile:** Safe margins of 16px with stacked layout patterns.

## Elevation & Depth
Depth is created through **Glassmorphism** and luminosity rather than traditional drop shadows.

1.  **Level 0 (Base):** Deep charcoal background.
2.  **Level 1 (Cards/Panels):** Semi-transparent surfaces (`rgba(255, 255, 255, 0.03)`) with a `backdrop-filter: blur(20px)`.
3.  **Level 2 (Modals/Overlays):** Slightly more opaque glass with a subtle "inner glow" achieved via a 1px white border at 10% opacity.
4.  **Luminous Depth:** Instead of shadows, use subtle colored "blobs" or gradients behind cards to suggest the surface is floating above a light source. For example, a card might have a faint blue glow (`#007BFF` at 5% opacity) sitting directly behind it.

## Shapes
The shape language is refined and "semi-rounded" to balance approachability with a technical edge. 

*   **Standard Components:** Buttons, inputs, and small cards use a **0.5rem (8px)** radius.
*   **Feature Cards:** Larger layout containers and section blocks use **1rem (16px)** for a softer, more premium look.
*   **Interactive Elements:** Pill shapes (full rounding) are reserved exclusively for "Status Chips" or "Tags" to differentiate them from actionable buttons.

## Components

*   **Buttons:** 
    *   *Primary:* Solid Gold background with black text. No shadow, but a subtle outer glow on hover.
    *   *Secondary:* Glass background with a 1px white border and white text. 
*   **Input Fields:** Ghost-style inputs with a 1px border (`rgba(255, 255, 255, 0.1)`). On focus, the border transitions to Kinetic Gold with a subtle glow.
*   **Cards:** High-gloss glass panels with 20px backdrop blur. Borders must be 1px and semi-transparent. Feature cards should include a small "accent line" (2px) at the top using one of the brand colors to categorize the content.
*   **Chips:** Pill-shaped, semi-transparent backgrounds with brand-colored text (e.g., a green text on a 10% opacity green background).
*   **Navigation:** Top navigation bar should be a sticky glass element. Links use the `label-md` style, transitioning to Kinetic Gold on hover with a 2px underline glow.
*   **Data Visualizations:** Use neon-style lines for charts with "glow" filters to emphasize the tech-forward, kinetic nature of the data.