# Design System Strategy: The Architectural Minimalist

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Architect."** 

Unlike generic DIY tools that feel cluttered or purely utilitarian, this system adopts an editorial, high-end aesthetic that mirrors the precision of an architectural blueprint and the warmth of a premium lifestyle magazine. We move beyond the "standard startup" look by leveraging intentional asymmetry, expansive whitespace, and a "paper-on-glass" layering logic. 

The goal is to make the user feel like they are being guided by an expert consultant, not a chatbot. We achieve this through a sophisticated contrast between high-impact, geometric display type (Manrope) and ultra-legible, functional body type (Inter), paired with a "borderless" layout philosophy.

---

## 2. Colors & Surface Logic
Our palette is rooted in a sophisticated "Off-White & Forest" foundation. The primary goal is to use color to define space rather than lines.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section off content. Sectioning must be achieved through background color shifts. 
*   Example: A sidebar should use `surface-container-low` (#f6f3f5) to sit against a `surface` (#fcf8fa) main stage. This creates a clean, architectural break without the visual "noise" of a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of materials. 
*   **Base:** `surface` (#fcf8fa).
*   **Nesting Level 1:** Use `surface-container` (#f0edef) for primary content blocks.
*   **Nesting Level 2:** Use `surface-container-high` (#eae7e9) for nested elements like internal cards or search bars.
*   By shifting between these tiers, you create "soft depth" that feels premium and intentional.

### The "Glass & Gradient" Rule
To elevate the AI features (the "magic" of the assistant), use Glassmorphism. Floating panels should use a semi-transparent `surface_container_lowest` (#ffffff) with a 20px backdrop-blur. 
*   **Signature Textures:** For high-conversion CTAs or Hero sections, apply a subtle linear gradient from `primary` (#000000) to `primary_container` (#111c2d). This prevents the "flat" look and adds a sense of "visual soul."

---

## 3. Typography
The typography is the backbone of our editorial feel. We pair the geometric authority of **Manrope** with the technical precision of **Inter**.

*   **Display (Manrope):** Use `display-lg` (3.5rem) and `display-md` (2.75rem) for hero statements and AI insights. Tighten letter-spacing by -2% for a "custom-fit" look.
*   **Headlines (Manrope):** Use `headline-sm` (1.5rem) for section titles. These should feel like headers in a high-end design journal.
*   **Body (Inter):** All functional text uses Inter. `body-lg` (1rem) is the default for assistant responses to ensure maximum legibility during DIY tasks. 
*   **Labels (Inter):** `label-md` (0.75rem) should be used for technical specs or measurements, often in uppercase with a slight letter-spacing increase (+5%) to denote "technical data."

---

## 4. Elevation & Depth
Hierarchy is conveyed through **Tonal Layering** rather than traditional drop shadows.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background. This creates a natural, soft lift.
*   **Ambient Shadows:** For floating AI modules, use a "Ghost Shadow": `0px 20px 40px rgba(27, 27, 29, 0.05)`. The shadow color is derived from `on_surface`, keeping it organic and subtle.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline-variant` (#c6c6cd) at **15% opacity**. Never use a 100% opaque border.
*   **Glassmorphism:** Use semi-transparent `surface_container_lowest` for interactive floating elements (like a "Tools Needed" list) to allow the background project photos to bleed through softly.

---

## 5. Components

### Buttons
*   **Primary:** Solid `primary` (#000000) with `on_primary` (#ffffff) text. Use `xl` (0.75rem) roundedness. 
*   **Secondary:** `secondary_container` (#a6f2d1) with `on_secondary_container` (#237157). This "Forest Green" accent denotes "Action/Growth."
*   **Tertiary:** No background. Bold `primary` text with a subtle `primary_fixed_dim` underline on hover.

### Input Fields
*   **Styling:** Use `surface_container_highest` (#e4e2e4) as a subtle background. 
*   **State:** On focus, transition to a "Ghost Border" using `secondary` (#1b6b51) at 20% opacity. 
*   **Spacing:** Use `spacing-3` (1rem) internal padding.

### Cards & Lists
*   **Forbid Dividers:** Do not use line-rules between list items. Use `spacing-4` (1.4rem) of vertical whitespace or alternating `surface_container` shifts to separate items.
*   **The "AI Suggestion" Card:** Should use a subtle gradient background and a `lg` (0.5rem) corner radius to differentiate from static content.

### DIY Step-by-Step Indicators
*   Use `secondary` (#1b6b51) for completed steps and `primary_fixed` (#d8e3fb) for upcoming steps. These should be minimalist dots, not heavy numbered badges.

---

## 6. Do's and Don'ts

### Do
*   **DO** use whitespace as a functional element. If an interface feels "empty," increase the typography scale rather than adding more borders or boxes.
*   **DO** use the `secondary` forest green (#1b6b51) sparingly, as a "precision strike" color for success states or primary DIY actions.
*   **DO** align text to a strict baseline grid but allow image containers to be asymmetrical to create an editorial flow.

### Don't
*   **DON'T** use 100% black text on white. Always use `on_surface` (#1b1b1d) to reduce eye strain and feel more "premium."
*   **DON'T** use default Material Design shadows. They are too heavy for this "cool, minimal" aesthetic. Stick to Tonal Layering.
*   **DON'T** use standard "Select" dropdowns. Use custom, wide-spaced list components that feel like an extension of the page.

---

## 7. Spacing Logic
The spacing scale is built on a 0.7rem base (e.g., `spacing-2`). 
*   Use **large gaps** (`spacing-12` to `spacing-20`) between major conceptual sections. 
*   Use **tight gaps** (`spacing-1.5` to `spacing-3`) for related metadata. 
*   This extreme "High-Low" contrast in spacing is what gives the design its "YC-startup" sophistication.