# Design System Specification: The Obsidian Aesthetic

## 1. Overview & Creative North Star: "The Digital Curator"
The North Star for this design system is **The Digital Curator**. We are moving away from the "utility-first" look of standard SaaS platforms toward a high-end, editorial experience that feels like a bespoke digital atelier.

The interface must feel intentional, quiet, and authoritative. We achieve this through **Intentional Asymmetry** and **Tonal Depth**. By utilizing a vertical split-screen architecture for our core AI interaction, we create a "workspace vs. dialogue" relationship that mirrors a researcher's desk. The layout is not a grid to be filled, but a canvas where negative space is as functional as the components themselves.

---

## 2. Color Strategy & The "No-Line" Philosophy
Our palette is rooted in deep violets and obsidian blacks, using the `primary` (#cc97ff) as a sophisticated accent rather than a blunt instrument.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections.
* **Boundaries** must be defined solely through background shifts. For example, a `surface-container-low` (#22072d) sidebar sitting against a `surface` (#1b0425) main deck.
* **Surface Hierarchy:** Use the hierarchy of `surface-container-lowest` to `highest` to create nesting. An inner chat bubble should use `surface-container-high` (#31113e) to naturally "lift" from the `surface-container` background.

### The Glass & Gradient Rule
To prevent the UI from feeling "flat," use Glassmorphism for floating elements (like hover menus or tooltips).
* **Formula:** `surface-variant` at 60% opacity + 12px Backdrop Blur.
* **Signature Textures:** Main Action Buttons should utilize a linear gradient from `primary` (#cc97ff) to `primary-dim` (#9c48ea) at a 135° angle to provide a sense of "lit" depth.

---

## 3. Typography: Editorial Authority
We use **Manrope** exclusively. Its geometric yet slightly condensed nature provides the professional "Obsidian" look.

* **Display (lg/md):** Reserved for high-level immersion. Use `display-md` (2.75rem) for document titles to establish an editorial lead.
* **Headline (sm):** Use for section headers in the AI Chat.
* **Body (md):** The workhorse. All AI-generated content and document text must use `body-md` (0.875rem) with a line height of 1.6x to ensure long-form readability.
* **Label (sm):** Used for metadata and "AI Thinking" states. Always in `on-surface-variant` (#c2a0ca) to recede visually.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "cheap" for this aesthetic. We define depth through light, not ink.

* **The Layering Principle:** Stack surfaces to create focus.
* *Level 0:* `surface` (The Base) — `#1b0425`
* *Level 1:* `surface-container-low` (The Document Panel) — `#22072d`
* *Level 2:* `surface-container-highest` (The Chat Input) — `#31113e`
* **Ambient Shadows:** If a card *must* float, use a shadow with a 40px blur, 0% spread, and a color of `secondary_container` (#6a2785) at 8% opacity. This creates a "glow" rather than a "shadow."
* **The Ghost Border Fallback:** Only if accessibility requires it, use `outline-variant` (#593e63) at **15% opacity**.

---

## 5. Component Guidelines

### The Split-Screen Workspace
The interface is divided by a vertical spine.
* **Left (Document):** `surface-container-low`. Minimalist, wide margins (Spacing 16).
* **Right (Chat):** `surface`. More condensed, utilizing `surface-container` for message blocks.

### Buttons & Inputs
* **Primary Action:** Gradient fill (`primary` → `primary-dim`), 135° angle. Border-radius: `md` (0.375rem). No border.
* **Secondary/Ghost:** No background. Text in `primary`. On hover, transition to `surface-bright` (#411b50).
* **Input Fields:** Use `surface-container-lowest` (#000000). Forgo the bottom line; use a subtle background shift on focus to `surface-container-high`.

### AI Chat Bubbles
* **User Message:** `surface-container-highest`. Aligned right.
* **AI Message:** No container. Use `on-surface` text on the `surface` background. Separate using Spacing `8` (2.75rem) to allow the "Curator" voice to feel like part of the page, not a boxed-in response.

### Chips & Tags
* Use `rounded-full` (9999px).
* Background: `surface-variant` (#391647).
* Text: `on-surface-variant` (#c2a0ca).

---

## 6. Do's and Don'ts

### Do
* **DO** use whitespace as a separator. Use Spacing `6` (2rem) between major content blocks instead of dividers.
* **DO** treat the AI chat as a conversation with an expert; use `title-md` for AI-generated subheads within the chat.
* **DO** use `tertiary` (#ff95a0) very sparingly for critical alerts or "stop" actions to maintain the purple/dark harmony.

### Don't
* **DON'T** use 100% white (#ffffff). Always use `on-surface` (#fadcff) to reduce eye strain in the dark theme.
* **DON'T** use standard "Blue" for links. Use `primary` (#cc97ff) with a `px` height underline.
* **DON'T** use heavy card shadows. If the content doesn't feel separated enough, darken the background behind it rather than adding a shadow.

---

## 7. Token Reference Summary

| Token | Value | Application |
| :--- | :--- | :--- |
| **Primary** | #cc97ff | CTAs, Primary Brand Accents |
| **Primary-Dim** | #9c48ea | Gradient end stop on buttons |
| **Surface** | #1b0425 | Main Application Background |
| **Surface-Low** | #22072d | Document Panel / Card Background |
| **Surface-High** | #31113e | Active / Hovered Elements |
| **Surface-Variant** | #391647 | Chips, Icon Backgrounds |
| **On-Surface** | #fadcff | High-emphasis Typography |
| **On-Surface-Variant** | #c2a0ca | Metadata, Label Text |
| **Tertiary** | #ff95a0 | Destructive / Stop Actions |
| **Outline-Variant** | #593e63 | Ghost Border Fallback (15% opacity) |
| **Secondary-Container** | #6a2785 | Ambient Glow Shadow (8% opacity) |
| **Radius-MD** | 0.375rem | Standard Component Curves |
| **Spacing-4** | 1.4rem | Standard Gutter/Padding |

---

## 8. Implementation Notes (Tailwind / Next.js)

All tokens are mapped to CSS custom properties in `frontend/app/globals.css` and exposed to Tailwind via `@theme inline`.

| CSS Variable | Tailwind Token |
| :--- | :--- |
| `--background` | `bg-background` |
| `--foreground` | `text-foreground` |
| `--card` | `bg-card` |
| `--primary` | `text-primary` / `bg-primary` |
| `--muted-foreground` | `text-muted-foreground` |
| `--accent` | `bg-accent` (surface-high, hover state) |
| `--destructive` | `text-destructive` / `bg-destructive` |
| `--surface-variant` | Use `bg-[#391647]` directly |

Font: **Manrope** loaded via `next/font/google`, variable `--font-manrope`, mapped to `--font-sans` in `@theme inline`.
