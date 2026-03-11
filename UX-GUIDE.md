# Timeline Explorer — UX/UI Design Guide

A reference for building companion React apps that share Timeline Explorer's visual design language. This guide documents every design token, component pattern, and convention so a new app can look and feel like part of the same product family without sharing any functionality code.

**Design philosophy:** Academic, editorial warmth. Serif typography for content, monospace for UI chrome. Muted neutrals with a single gold accent. No CSS files — all styling is inline style objects using shared design tokens.

---

## Table of Contents

1. [Foundations](#1-foundations)
2. [Global Setup](#2-global-setup)
3. [Theme Integration](#3-theme-integration)
4. [Component Patterns](#4-component-patterns)
5. [Iconography](#5-iconography)
6. [Accessibility](#6-accessibility)
7. [Reusable Files](#7-reusable-files)

---

## 1. Foundations

### 1.1 Typography

Two font families carry the entire design. The contrast between serif and monospace creates the editorial feel.

| Token | Value | Used For |
|---|---|---|
| `FONT_SERIF` | `'Newsreader', 'Georgia', serif` | Headlines, body text, descriptions, hero text |
| `FONT_MONO` | `'Overpass Mono', monospace` | Labels, metadata, form fields, buttons, badges, sidebar text |

**Rule of thumb:** If it's content a human wrote (descriptions, titles, questions), use serif. If it's UI chrome (labels, counts, filters, buttons), use monospace.

#### Font Size Scale

All sizes are rem-based for accessibility (users can scale via browser settings).

| Token | Value | px Equiv. | Usage |
|---|---|---|---|
| `micro` | `0.6875rem` | 11px | Labels, timestamps, micro-metadata |
| `tiny` | `0.75rem` | 12px | Filter labels, tag pills, sidebar headings |
| `sm` | `0.8125rem` | 13px | Form labels, button text, metadata |
| `base` | `0.875rem` | 14px | Body text, inputs, descriptions |
| `md` | `1rem` | 16px | Card titles, modal subtitles |
| `lg` | `1.25rem` | 20px | Hero text, section headers |
| `xl` | `1.375rem` | 22px | Modal titles, admin section names |
| `xxl` | `1.75rem` | 28px | Page titles, h1s |

#### Line Heights

| Token | Value | Usage |
|---|---|---|
| `tight` | 1.2 | Headings, badges |
| `snug` | 1.35 | Card titles |
| `normal` | 1.5 | Form inputs, short text |
| `relaxed` | 1.6 | Body text, descriptions |

#### Font Weights

- **400** — Body text, descriptions
- **500** — Secondary labels, metadata
- **600** — Emphasized metadata, hero text, subtitles
- **700** — Headings, buttons, badges, form labels

#### Typography Hierarchy

| Level | Font | Size | Weight | Extra |
|---|---|---|---|---|
| Page title (h1) | Serif | `xxl` (28px) | 700 | `letterSpacing: -0.01em` |
| Section title (h2) | Serif | `lg` (20px) | 700 | |
| Card title (h3) | Serif | `md` (16px) | 700 | `lineHeight: 1.35` |
| Body text | Serif | `base` (14px) | 400 | `lineHeight: 1.6–1.7` |
| UI labels | Mono | `micro`–`sm` | 600–700 | `textTransform: uppercase`, `letterSpacing: 0.05–0.1em` |
| Buttons | Mono | `tiny`–`sm` | 700 | `letterSpacing: 0.02em` |

### 1.2 Color System

#### Light Theme

```
Page
  pageBg:              #F7F7F5          warm off-white
  pageText:            #1a1a1a          near-black

Header (always dark)
  headerBg:            #18181B          zinc-900
  headerText:          #fff
  headerSubtext:       #71717A          zinc-500
  headerButtonBg:      #ffffff18        18% white overlay
  headerBorder:        #3f3f46          zinc-700

Cards
  cardBg:              #fff
  cardBorder:          #EBEBEB
  cardShadow:          0 8px 24px rgba(0,0,0,0.08)

Text hierarchy
  textPrimary:         #1a1a1a          main text
  textSecondary:       #6B7280          gray-500, secondary labels
  textTertiary:        #52525B          zinc-600, tertiary metadata
  textDescription:     #374151          gray-700, long-form text
  textMuted:           #767676          disabled/hint text
  textDivider:         #D1D5DB          gray-300, separators

Inputs
  inputBg:             #fff
  inputBorder:         #E5E7EB          gray-200

Backgrounds
  subtleBg:            #F3F4F6          gray-100, secondary surface
  warmSubtleBg:        #FAFAF8          warm tint, metadata panels

Toggle (active state)
  activeToggleBg:      #1a1a1a          inverts in dark mode
  activeToggleText:    #fff             inverts in dark mode

Accent colors
  accentGold:          #F59E0B          amber-500, primary accent
  accentGoldSubtle:    #F59E0B18        18% gold overlay
  errorRed:            #EF4444          red-500
  errorRedBg:          #FEF2F2          red-50
  errorRedBorder:      #FECACA          red-200
  errorRedText:        #991B1B          red-800
  successGreen:        #059669          emerald-600
  teacherGreen:        #34D399          emerald-400
  teacherGreenSubtle:  #34D39918        18% emerald overlay

Feedback
  feedbackAmber:       #D97706          amber-600, border
  feedbackAmberText:   #92400E          amber-800, label text
  feedbackAmberBg:     #FEF3C7          amber-100, background

Modal
  modalOverlay:        rgba(0,0,0,0.4)
  modalShadow:         0 24px 48px rgba(0,0,0,0.15)

Focus
  focusRing:           #2563EB          blue-600
```

#### Dark Theme

Same token names. Key differences:

```
Page
  pageBg:              #0F0F11
  pageText:            #E4E4E7

Cards
  cardBg:              #1C1C20
  cardBorder:          #2E2E33
  cardShadow:          0 8px 24px rgba(0,0,0,0.3)

Text
  textPrimary:         #E4E4E7
  textSecondary:       #71717A
  textTertiary:        #8B8B96
  textDescription:     #A1A1AA
  textMuted:           #52525B
  textDivider:         #3F3F46

Inputs
  inputBg:             #27272A
  inputBorder:         #3F3F46

Backgrounds
  subtleBg:            #27272A
  warmSubtleBg:        #1E1E22

Toggle (inverted)
  activeToggleBg:      #E4E4E7
  activeToggleText:    #18181B

Error (adapted)
  errorRedBg:          #3B1111
  errorRedBorder:      #7F1D1D
  errorRedText:        #FCA5A5

Feedback (adapted)
  feedbackAmberText:   #FDE68A
  feedbackAmberBg:     #422006

Modal
  modalOverlay:        rgba(0,0,0,0.6)
  modalShadow:         0 24px 48px rgba(0,0,0,0.4)

Focus
  focusRing:           #60A5FA          blue-400
```

#### Accent Color Usage

The gold accent (`#F59E0B`) is the single primary action color used across both themes. It appears on:
- Primary action buttons (Add Event, review alerts)
- Active tab indicators
- Branding badges
- Admin sidebar active states

Red (`#EF4444`) is reserved for destructive actions and urgency (pending count badges, delete buttons). Green (`#059669` / `#34D399`) indicates teacher/admin status.

#### Period Color Palettes

Content items are color-coded by time period. Four named palettes are available, each with 8 color triplets (`{ color, bg, accent }`). All combinations meet WCAG AA 4.5:1 contrast.

| Palette | Character |
|---|---|
| `classic` | Bold primaries — red, amber, blue, purple, green, pink, amber, sky |
| `earth` | Warm naturals — sienna, ochre, olive, slate, terracotta, moss, gray, gold |
| `jewel` | Rich saturated — ruby, sapphire, amethyst, emerald, garnet, topaz, onyx, jade |
| `ocean` | Cool blues/greens — navy, teal, cerulean, seafoam, coral, marine, arctic, lagoon |

Each color triplet:
- `color` — text color (high contrast on `bg`)
- `bg` — light background fill (light mode) — in dark mode, use `color + "20"` instead
- `accent` — medium-contrast accent for borders, icons, indicators

### 1.3 Spacing

Rem-based scale. Use token keys, not raw values.

| Token | Value | px | Common Use |
|---|---|---|---|
| `0.5` | `0.125rem` | 2px | Tight inner gaps (badge padding, icon offset) |
| `1` | `0.25rem` | 4px | Minimal gaps, icon button padding |
| `1.5` | `0.375rem` | 6px | Badge padding, small gaps between items |
| `2` | `0.5rem` | 8px | Standard small gap, input padding vertical |
| `2.5` | `0.625rem` | 10px | Compact card padding, between form rows |
| `3` | `0.75rem` | 12px | Standard gap, input padding horizontal |
| `4` | `1rem` | 16px | Card internal padding, section spacing |
| `5` | `1.25rem` | 20px | Modal padding, content block spacing |
| `6` | `1.5rem` | 24px | Large vertical spacing (header top) |
| `8` | `2rem` | 32px | Major section padding, horizontal page margin |
| `10` | `2.5rem` | 40px | Login card vertical padding |

### 1.4 Border Radii

| Token | Value | Usage |
|---|---|---|
| `sm` | `4px` | Badges, tags, small icon buttons |
| `md` | `6px` | Form inputs, filter buttons, inline controls |
| `lg` | `8px` | Primary buttons, card sub-sections, error alerts |
| `xl` | `10px` | Event cards, sidebar panels |
| `2xl` | `14px` | Modals, login card, large panels |
| `pill` | `9999px` | Period filter pills, fully-rounded toggles |

### 1.5 Shadows

| Context | Value |
|---|---|
| Card (default) | `0 8px 24px rgba(0,0,0,0.08)` (light) / `rgba(0,0,0,0.3)` (dark) |
| Card (expanded, period-colored) | `0 8px 24px ${periodColor}12` |
| Modal | `0 24px 48px rgba(0,0,0,0.15)` (light) / `rgba(0,0,0,0.4)` (dark) |

No other shadows are used. Most UI elements (buttons, inputs, badges) have no shadow — they rely on borders and background changes for depth.

### 1.6 Z-Index

| Token | Value | Layer |
|---|---|---|
| `base` | 0 | Default content |
| `timeline` | 2 | Timeline elements |
| `timelineActive` | 4 | Active/hovered timeline elements |
| `dropdown` | 10 | Dropdowns, popovers |
| `overlay` | 100 | Non-modal overlays |
| `modal` | 1000 | Modal dialogs |
| `lightbox` | 9999 | Fullscreen image viewer |
| `toast` | 10000 | Toast notifications |

### 1.7 Transitions

| Context | Value |
|---|---|
| Default (most interactive elements) | `all 0.15s` |
| Theme changes (global) | `background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease` |
| Card expand/collapse | `all 0.2s ease` |
| Focus border on inputs | `border-color 0.2s` |
| Chart bar widths | `width 0.3s ease` |

The global `*` transition on `background-color`, `color`, and `border-color` ensures smooth theme switching and is applied via a `<style>` tag in the root component.

---

## 2. Global Setup

### 2.1 Font Loading

Add this `<link>` tag in your root component (or `public/index.html`):

```html
<link
  href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600;6..72,700&family=Overpass+Mono:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

### 2.2 Global Styles

Inject this via a `<style>` tag in your root component:

```css
* {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
:root {
  --focus-ring: #2563EB;
}
[data-theme="dark"] {
  --focus-ring: #60A5FA;
}
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
:focus:not(:focus-visible) {
  outline: none;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 2.3 Provider Wrapping

The app root wraps with `AuthProvider` (outer) and `ThemeProvider` (inner):

```jsx
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

root.render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);
```

### 2.4 Root Container

The outermost `<div>` in your App component should set:

```jsx
<div
  style={{
    fontFamily: FONT_SERIF,
    background: theme.pageBg,
    minHeight: "100vh",
    color: theme.pageText,
    colorScheme: mode, // tells browser to match scrollbars, form controls
  }}
  data-theme={mode}
>
```

### 2.5 Skip Link

For accessibility, include a skip-navigation link as the first child:

```jsx
<a
  href="#main-content"
  style={{
    position: "absolute",
    left: "-9999px",
    top: 0,
    zIndex: 10001,
    padding: SPACING[3],
    background: theme.activeToggleBg,
    color: theme.activeToggleText,
    fontFamily: FONT_MONO,
    fontSize: FONT_SIZES.base,
    fontWeight: 700,
    textDecoration: "none",
    borderRadius: 4,
  }}
  onFocus={(e) => { e.currentTarget.style.left = "8px"; e.currentTarget.style.top = "8px"; }}
  onBlur={(e) => { e.currentTarget.style.left = "-9999px"; e.currentTarget.style.top = "0"; }}
>
  Skip to main content
</a>
```

---

## 3. Theme Integration

### 3.1 Accessing Theme Tokens

```jsx
import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING, RADII, Z_INDEX, LINE_HEIGHTS } from "./contexts/ThemeContext";

function MyComponent() {
  const { theme, mode, toggleTheme } = useTheme();

  return (
    <div style={{
      background: theme.cardBg,
      border: `1.5px solid ${theme.cardBorder}`,
      borderRadius: RADII.xl,
      padding: SPACING[4],
      fontFamily: FONT_MONO,
      fontSize: FONT_SIZES.sm,
      color: theme.textPrimary,
    }}>
      ...
    </div>
  );
}
```

- **`theme`** — the full color palette object (changes with light/dark mode)
- **`mode`** — `"light"` or `"dark"` string
- **`toggleTheme()`** — switches and persists to localStorage
- **`getThemedPeriodBg(period)`** — returns `period.bg` in light mode, `period.color + "20"` in dark mode
- **`getThemedSourceTypeBg(id)`** — returns the themed source type background

### 3.2 Dark Mode Behavior

- Stored in `localStorage` under key `timeline-explorer-theme`
- Falls back to `prefers-color-scheme` media query if no stored preference
- `data-theme` attribute on root `<div>` enables CSS variable switching for focus ring color
- The `colorScheme` CSS property on the root element tells the browser to match native controls (scrollbars, form elements) to the active theme

---

## 4. Component Patterns

Each pattern below shows the key style values. All styles are inline objects — no CSS classes.

### 4.1 Page Layout

```
Max width:    960px
Centering:    margin: "0 auto"
Page padding: SPACING[5] (20px) vertical, SPACING[8] (32px) horizontal
```

```jsx
<div style={{ maxWidth: 960, margin: "0 auto", padding: `${SPACING[5]} ${SPACING[8]}` }}>
  {/* page content */}
</div>
```

### 4.2 Header Bar

The header always uses the dark `headerBg` regardless of theme mode, creating a consistent top bar.

```jsx
// Container
{
  background: theme.headerBg,  // always #18181B
  color: theme.headerText,     // always #fff
  padding: `${SPACING[6]} ${SPACING[8]} ${SPACING[4]}`,
}

// Content wrapper (centered)
{
  maxWidth: 960,
  margin: "0 auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: SPACING[4],
}

// Title
{
  fontSize: FONT_SIZES.xxl,        // 28px
  fontWeight: 700,
  fontFamily: FONT_SERIF,
  letterSpacing: "-0.01em",
  lineHeight: 1.2,
  display: "flex",
  alignItems: "center",
  gap: SPACING[2],
}

// Subtitle (stats line)
{
  fontSize: FONT_SIZES.sm,         // 13px
  color: theme.headerSubtext,      // #71717A
  fontFamily: FONT_MONO,
  margin: `${SPACING["1.5"]} 0 0 0`,
}

// Section tabs in header
{
  padding: `${SPACING["1.5"]} ${SPACING[3]}`,  // 6px 12px
  borderRadius: RADII.md,                       // 6px
  border: "none",
  background: isActive ? theme.accentGold : theme.headerButtonBg,
  color: isActive ? theme.headerBg : theme.headerSubtext,
  fontSize: FONT_SIZES.sm,
  fontFamily: FONT_MONO,
  fontWeight: isActive ? 700 : 500,
  cursor: "pointer",
  transition: "all 0.15s",
}
```

### 4.3 Cards

Cards are the primary content container. They have collapsed and expanded states.

```jsx
// Collapsed card
{
  background: theme.cardBg,
  border: `1.5px solid ${theme.cardBorder}`,
  borderRadius: RADII.xl,                         // 10px
  padding: `${SPACING[3]} ${SPACING[5]}`,          // 12px 20px
  cursor: "pointer",
  transition: "all 0.2s ease",
}

// Expanded card — border changes to period color
{
  border: `1.5px solid ${periodColor}60`,          // 60% opacity period color
  boxShadow: `0 8px 24px ${periodColor}12`,        // 12% opacity glow
  padding: `${SPACING[4]} ${SPACING[5]}`,          // 16px 20px
}

// Left border accent (unread indicator)
{
  borderLeft: `4px solid ${periodColor}`,          // unread
  // vs
  borderLeft: `1.5px solid ${theme.cardBorder}`,   // read
}

// Card title
{
  fontSize: FONT_SIZES.md,     // 16px
  fontWeight: 700,
  fontFamily: FONT_SERIF,
  color: theme.textPrimary,
  lineHeight: 1.35,
  margin: 0,
}

// Year/date badge
{
  background: periodColor,
  color: "#fff",
  fontSize: FONT_SIZES.tiny,   // 12px
  fontWeight: 700,
  fontFamily: FONT_MONO,
  padding: `${SPACING[1]} ${SPACING[2]}`,  // 4px 8px
  borderRadius: RADII.sm,      // 4px
  letterSpacing: "0.02em",
  minWidth: 42,
  textAlign: "center",
}

// Metadata grid (inside expanded card)
{
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: `${SPACING[2]} ${SPACING[4]}`,     // 8px 16px
  padding: SPACING[3],                     // 12px
  background: theme.warmSubtleBg,
  borderRadius: RADII.lg,                 // 8px
  fontSize: FONT_SIZES.sm,               // 13px
  fontFamily: FONT_MONO,
}

// Chevron expand icon
{
  color: theme.textDivider,
  transition: "transform 0.2s",
  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
}
```

### 4.4 Modals

Use the `ModalShell` component. It provides the overlay, focus trap, backdrop blur, and close-on-click.

```jsx
// Overlay
{
  position: "fixed",
  inset: 0,
  background: theme.modalOverlay,   // rgba(0,0,0,0.4) light / 0.6 dark
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: Z_INDEX.modal,            // 1000
  padding: SPACING[5],              // 20px
}

// Dialog content
{
  background: theme.cardBg,
  borderRadius: RADII["2xl"],       // 14px
  width: "100%",
  maxWidth: 640,                    // configurable prop
  maxHeight: "90vh",
  overflow: "auto",
  boxShadow: theme.modalShadow,
  position: "relative",
}

// Modal inner padding (applied by content, not ModalShell)
{
  padding: `${SPACING[6]} ${SPACING[8]}`,  // 24px 32px
}

// Close button (absolute positioned)
{
  position: "absolute",
  top: SPACING[4],        // 16px
  right: SPACING[4],      // 16px
  background: "none",
  border: "none",
  color: theme.textSecondary,
  cursor: "pointer",
  padding: SPACING[1],    // 4px
  borderRadius: RADII.md, // 6px
  zIndex: 1,
  transition: "all 0.15s",
  // hover: background → theme.subtleBg, color → theme.textPrimary
}
```

### 4.5 Forms

```jsx
// Form label (uppercase mono)
{
  fontSize: FONT_SIZES.micro,    // 11px
  fontWeight: 700,
  color: theme.textTertiary,
  fontFamily: FONT_MONO,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: SPACING[1],     // 4px
  display: "block",
}

// Text input / textarea
{
  width: "100%",
  padding: `9px ${SPACING[3]}`,          // 9px 12px
  border: `1.5px solid ${theme.inputBorder}`,
  borderRadius: RADII.md,                // 6px
  fontSize: FONT_SIZES.base,             // 14px
  fontFamily: FONT_MONO,
  background: theme.inputBg,
  color: theme.textPrimary,
  boxSizing: "border-box",
  transition: "border-color 0.2s",
}

// Input in error state
{
  border: `1.5px solid ${theme.errorRed}`,
}

// Form field vertical gap
{
  display: "flex",
  flexDirection: "column",
  gap: SPACING["2.5"],       // 10px between fields
}

// Compact input (moderation cards)
{
  padding: `${SPACING["1.5"]} ${SPACING["2.5"]}`,  // 6px 10px
  fontSize: FONT_SIZES.tiny,                         // 12px
}
```

### 4.6 Buttons

#### Primary Button (filled)

```jsx
{
  padding: `${SPACING[3]} ${SPACING[6]}`,    // 12px 24px
  background: theme.activeToggleBg,           // dark in light mode, light in dark mode
  color: theme.activeToggleText,
  border: "none",
  borderRadius: RADII.lg,                    // 8px
  fontSize: FONT_SIZES.sm,                   // 13px
  fontFamily: FONT_MONO,
  fontWeight: 700,
  cursor: "pointer",
  letterSpacing: "0.02em",
  width: "100%",                             // full-width when solo, remove for inline
  transition: "all 0.15s",
}
```

#### Accent Button (gold)

```jsx
{
  padding: `${SPACING["2.5"]} ${SPACING[4]}`,  // 10px 16px
  background: theme.accentGold,
  color: theme.headerBg,                        // dark text on gold
  border: "none",
  borderRadius: RADII.lg,
  fontSize: FONT_SIZES.tiny,                   // 12px
  fontFamily: FONT_MONO,
  fontWeight: 700,
  cursor: "pointer",
  letterSpacing: "0.02em",
  transition: "filter 0.15s",
  // hover: filter: brightness(1.1)
}
```

#### Ghost Button (outlined, header style)

```jsx
{
  padding: `${SPACING["2.5"]} ${SPACING[4]}`,
  background: "transparent",
  color: theme.accentGold,
  border: `1.5px solid ${theme.accentGold}`,
  borderRadius: RADII.lg,
  fontSize: FONT_SIZES.tiny,
  fontFamily: FONT_MONO,
  fontWeight: 700,
  letterSpacing: "0.02em",
  cursor: "pointer",
  transition: "all 0.15s",
}
```

#### Danger Button

```jsx
{
  padding: `${SPACING["2.5"]} ${SPACING[4]}`,
  background: theme.errorRed,
  color: "#fff",
  border: "none",
  borderRadius: RADII.lg,
  fontSize: FONT_SIZES.tiny,
  fontFamily: FONT_MONO,
  fontWeight: 700,
  cursor: "pointer",
  transition: "filter 0.15s",
  // hover: filter: brightness(1.15)
}
```

#### Icon Button (reusable component)

The `IconButton` component wraps an icon with optional text in a borderless button with hover state management:

```jsx
<IconButton
  icon={someIcon}
  title="Action label"
  size={14}                          // icon width/height in px
  color={theme.textSecondary}
  hoverColor={theme.textPrimary}
  hoverBg={theme.subtleBg}
  padding={4}
  borderRadius={4}
/>

// Renders as:
{
  border: "none",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: children ? 3 : 0,            // gap only when text is present
  padding: 4,
  borderRadius: 4,
  transition: "all 0.15s",
  background: isHovered ? hoverBg : "none",
  color: isHovered ? hoverColor : color,
}
```

#### Disabled State

```jsx
{
  opacity: 0.5,
  cursor: "not-allowed",
}
```

### 4.7 Filter Bar / Toolbars

#### Pill Toggles (period/tag filters)

```jsx
// Inactive pill
{
  padding: `${SPACING[1]} ${SPACING["2.5"]}`,  // 4px 10px
  borderRadius: RADII.pill,                      // 9999px
  fontSize: FONT_SIZES.tiny,                    // 12px
  fontFamily: FONT_MONO,
  cursor: "pointer",
  transition: "all 0.15s",
  border: `1.5px solid ${theme.inputBorder}`,
  background: "transparent",
  color: theme.textSecondary,
}

// Active pill (period-colored)
{
  background: periodColor,
  color: "#fff",
  border: `1.5px solid ${periodColor}`,
  fontWeight: 600,
}
```

#### Search Input with Icon

```jsx
// Container (relative positioning for icon)
{
  position: "relative",
  flex: 1,
}

// Search icon (absolute positioned)
{
  position: "absolute",
  left: SPACING["2.5"],           // 10px
  top: "50%",
  transform: "translateY(-50%)",
  color: theme.textSecondary,
  pointerEvents: "none",
}

// Search input
{
  width: "100%",
  padding: `${SPACING[2]} ${SPACING[3]} ${SPACING[2]} 30px`,  // left padding for icon
  border: `1.5px solid ${theme.inputBorder}`,
  borderRadius: RADII.lg,        // 8px
  fontSize: FONT_SIZES.base,     // 14px
  fontFamily: FONT_MONO,
  background: theme.inputBg,
  color: theme.textPrimary,
  transition: "border-color 0.2s",
}
```

#### Toggle Buttons (sort/view mode)

```jsx
// Inactive toggle
{
  border: `1.5px solid ${theme.inputBorder}`,
  background: "transparent",
  color: theme.textSecondary,
  borderRadius: RADII.md,
  cursor: "pointer",
  transition: "all 0.15s",
  // hover: borderColor → theme.textTertiary, color → theme.textPrimary
}

// Active toggle
{
  background: theme.activeToggleBg,
  color: theme.activeToggleText,
  border: `1.5px solid ${theme.activeToggleBg}`,
}
```

### 4.8 Sidebars

#### Content Sidebar (e.g. contributor leaderboard)

```jsx
// Container
{
  background: theme.cardBg,
  borderRadius: RADII.xl,          // 10px
  border: `1.5px solid ${theme.cardBorder}`,
  padding: SPACING[4],             // 16px
}

// Section heading
{
  fontSize: FONT_SIZES.sm,         // 13px
  fontWeight: 700,
  color: theme.textSecondary,
  fontFamily: FONT_MONO,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  margin: `0 0 ${SPACING[3]} 0`,  // 12px bottom
}

// List items
{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: `${SPACING["1.5"]} 0`,  // 6px vertical
}

// Item name
{
  fontSize: FONT_SIZES.base,       // 14px
  fontFamily: FONT_MONO,
  color: theme.textPrimary,
  fontWeight: 600,
}

// Metric bar (progress indicator)
{
  width: Math.min(count * 16, 80),  // proportional, capped
  height: 6,
  borderRadius: 3,
  background: theme.textPrimary,
  transition: "width 0.3s ease",
}
```

#### Navigation Sidebar (admin)

```jsx
// Container
{
  width: 240,
  minWidth: 240,
  borderRight: `1px solid ${theme.cardBorder}`,
  background: theme.cardBg,
  fontFamily: FONT_MONO,
}

// Nav button (active)
{
  width: "100%",
  padding: `${SPACING["2.5"]} ${SPACING[3]}`,   // 10px 12px
  borderRadius: RADII.md,                         // 6px
  border: `1.5px solid ${theme.accentGold}`,
  background: theme.accentGold + "15",
  color: theme.accentGold,
  fontSize: FONT_SIZES.micro,                    // 11px
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.15s",
}

// Nav button (inactive)
{
  border: "1.5px solid transparent",
  background: "transparent",
  color: theme.textPrimary,
  // hover: background → theme.subtleBg
}

// Section heading
{
  fontSize: 9,                 // extra-small, px not rem
  fontWeight: 700,
  color: theme.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  padding: `${SPACING[3]} ${SPACING[4]} ${SPACING["1.5"]}`,
}

// "Add new" dashed button
{
  border: `1.5px dashed ${theme.inputBorder}`,
  background: "transparent",
  color: theme.textSecondary,
  borderRadius: RADII.md,
  fontSize: FONT_SIZES.tiny,
  fontFamily: FONT_MONO,
  fontWeight: 600,
  // hover: borderColor → theme.textSecondary, color → theme.textPrimary
}
```

### 4.9 Banners & Alerts

#### Feedback Banner (amber)

```jsx
// Container
{
  background: theme.feedbackAmberBg,
  border: `1.5px solid ${theme.feedbackAmber}`,
  borderLeft: `4px solid ${theme.feedbackAmber}`,   // thick left accent
  borderRadius: RADII.lg,                           // 8px
  padding: `${SPACING[3]} ${SPACING[4]}`,           // 12px 16px
}

// Title (uppercase label)
{
  fontSize: FONT_SIZES.tiny,        // 12px
  fontWeight: 700,
  fontFamily: FONT_MONO,
  color: theme.feedbackAmberText,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: SPACING["1.5"],
}

// Body text
{
  fontSize: FONT_SIZES.sm,          // 13px
  fontFamily: FONT_SERIF,
  color: theme.textDescription,
  lineHeight: 1.6,
  margin: 0,
}

// Meta line
{
  fontSize: FONT_SIZES.tiny,
  fontFamily: FONT_MONO,
  color: theme.textTertiary,
  marginTop: SPACING["1.5"],
}
```

#### Error Alert

```jsx
{
  background: theme.errorRedBg,
  border: `1px solid ${theme.errorRedBorder}`,
  borderRadius: RADII.lg,
  padding: `${SPACING["2.5"]} ${SPACING[3]}`,    // 10px 12px
  fontSize: FONT_SIZES.base,
  color: theme.errorRedText,
  fontFamily: FONT_MONO,
  display: "flex",
  alignItems: "center",
  gap: SPACING["1.5"],
}
```

### 4.10 Badges

#### Count Badge (e.g. pending items)

```jsx
{
  background: theme.errorRed,
  color: "#fff",
  fontSize: FONT_SIZES.micro,     // 11px
  fontWeight: 700,
  padding: `${SPACING["0.5"]} ${SPACING[1]}`,  // 2px 4px
  borderRadius: RADII.lg,         // 8px
  minWidth: 18,
  textAlign: "center",
}
```

#### Role Badge (e.g. "Teacher", "Admin")

```jsx
{
  fontSize: FONT_SIZES.tiny,       // 12px
  fontWeight: 700,
  color: theme.teacherGreen,
  fontFamily: FONT_MONO,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  background: theme.teacherGreenSubtle,
  padding: `${SPACING[1]} ${SPACING[2]}`,  // 4px 8px
  borderRadius: RADII.sm,          // 4px
  display: "inline-flex",
  alignItems: "center",
  gap: SPACING[1],
}
```

#### Branding Badge (e.g. app subtitle)

```jsx
{
  fontSize: FONT_SIZES.tiny,
  fontWeight: 700,
  color: theme.accentGold,
  fontFamily: FONT_MONO,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  background: theme.accentGoldSubtle,
  padding: `${SPACING[1]} ${SPACING[2]}`,
  borderRadius: RADII.sm,
  display: "inline-block",
}
```

#### Tag Pills (content metadata)

```jsx
{
  fontSize: FONT_SIZES.tiny,
  fontFamily: FONT_MONO,
  fontWeight: 500,
  color: theme.textTertiary,
  background: theme.subtleBg,
  padding: `${SPACING[1]} ${SPACING[2]}`,
  borderRadius: RADII.sm,
}
```

### 4.11 Hero Section

Full-width banner with centered text, used for featured content or questions.

```jsx
// Outer container
{
  background: theme.cardBg,
  borderBottom: `1px solid ${theme.cardBorder}`,
}

// Inner (centered)
{
  maxWidth: 960,
  margin: "0 auto",
  padding: `${SPACING[6]} ${SPACING[8]} ${SPACING[5]}`,   // 24px 32px 20px
  textAlign: "center",
}

// Overline label
{
  fontSize: FONT_SIZES.micro,
  fontWeight: 700,
  color: theme.textMuted,
  fontFamily: FONT_MONO,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: SPACING[2],
}

// Hero text
{
  fontSize: FONT_SIZES.lg,         // 20px
  fontWeight: 600,
  fontFamily: FONT_SERIF,
  color: theme.textPrimary,
  lineHeight: 1.4,
  fontStyle: "italic",
  maxWidth: 680,
  margin: "0 auto",
}
```

### 4.12 Empty States

```jsx
{
  textAlign: "center",
  padding: `${SPACING[8]} ${SPACING[5]}`,   // 32px 20px
  color: theme.textSecondary,
  fontFamily: FONT_MONO,
  fontSize: FONT_SIZES.tiny,               // 12px
}
```

### 4.13 Login / Splash Screen

Full-viewport centered card pattern:

```jsx
// Page container
{
  fontFamily: FONT_SERIF,
  background: theme.pageBg,
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: theme.textPrimary,
}

// Centered card
{
  background: theme.cardBg,
  borderRadius: RADII["2xl"],               // 14px
  padding: `${SPACING[10]} ${SPACING[8]}`,  // 40px 32px
  maxWidth: 400,
  width: "100%",
  textAlign: "center",
  boxShadow: theme.cardShadow,
  border: `1.5px solid ${theme.cardBorder}`,
}

// Footer text (disclaimer)
{
  fontSize: FONT_SIZES.micro,
  color: theme.textMuted,
  fontFamily: FONT_MONO,
  margin: `${SPACING[4]} 0 0 0`,
}
```

### 4.14 Tab Navigation (inline)

```jsx
// Tab container
{
  display: "flex",
  gap: 0,
  borderBottom: `1.5px solid ${theme.inputBorder}`,
  marginBottom: SPACING[4],
}

// Individual tab
{
  padding: `${SPACING[2]} ${SPACING[4]}`,      // 8px 16px
  background: "none",
  border: "none",
  borderBottom: `2px solid ${isActive ? theme.textPrimary : "transparent"}`,
  color: isActive ? theme.textPrimary : theme.textSecondary,
  fontSize: FONT_SIZES.tiny,                   // 12px
  fontFamily: FONT_MONO,
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.15s",
}
```

### 4.15 Toggle Switch

```jsx
// Track
{
  width: 32,
  height: 18,
  borderRadius: 9,
  background: isOn ? theme.accentGold : theme.inputBorder,
  position: "relative",
  display: "inline-block",
  transition: "background 0.15s",
  flexShrink: 0,
}

// Thumb
{
  position: "absolute",
  top: 2,
  left: isOn ? 16 : 2,
  width: 14,
  height: 14,
  borderRadius: "50%",
  background: "#fff",
  transition: "left 0.15s",
}
```

### 4.16 Lightbox (fullscreen image)

```jsx
// Overlay
{
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: Z_INDEX.lightbox,    // 9999
  cursor: "zoom-out",
}

// Image
{
  maxWidth: "90vw",
  maxHeight: "90vh",
  objectFit: "contain",
  borderRadius: RADII.lg,
}
```

---

## 5. Iconography

### Library

```
@iconify/react         — React component
@iconify-icons/mdi     — Material Design Icons pack
```

Usage:
```jsx
import { Icon } from "@iconify/react";
import someIcon from "@iconify-icons/mdi/some-icon-name";

<Icon icon={someIcon} width={14} aria-hidden="true" />
```

### Sizing Conventions

| Context | Size (px) |
|---|---|
| Inline with micro/tiny text | 10–12 |
| Standard buttons, metadata | 13–14 |
| Icon-only buttons | 14–16 |
| Close button in modals | 20 |
| Logo / prominent header icons | 26–28 |

### Color Conventions

- **Inherit parent text color** — default for most icons
- **`theme.accentGold`** (`#F59E0B`) — primary action icons, logo icon
- **`theme.textSecondary`** — secondary/muted icons
- **`theme.errorRed`** — delete, alert icons
- **`theme.successGreen`** — approve, success icons

Always set `aria-hidden="true"` on decorative icons (when adjacent text conveys meaning). Use `aria-label` on icon-only buttons.

---

## 6. Accessibility

### Focus Management

- **Focus ring:** 2px solid `var(--focus-ring)` with 2px offset (applied globally via `:focus-visible`)
- **No outline on mouse click:** `:focus:not(:focus-visible) { outline: none; }`
- **Focus trap in modals:** `useFocusTrap` hook manages Tab cycling and Escape-to-close
- **Focus restoration:** When a modal closes, focus returns to the element that opened it

### ARIA Patterns

| Pattern | Attributes |
|---|---|
| Modal dialog | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Navigation | `<nav>` with `aria-label` |
| Tab list | `role="tab"`, `aria-selected`, `aria-current` |
| Alert | `role="alert"` |
| List | `role="list"` / `role="listitem"` |
| Icon buttons | `aria-label` or `title` on every icon-only button |
| Decorative icons | `aria-hidden="true"` |
| Skip link | Visually hidden, revealed on focus |

### Color Contrast

- All text/background combinations in both themes meet WCAG AA 4.5:1 minimum
- All period color palettes are pre-verified for AA compliance
- Focus ring colors are chosen for visibility against both light and dark backgrounds

### Keyboard Navigation

- All interactive elements are reachable via Tab
- Escape closes modals and dropdowns
- Enter/Space activates buttons
- Modal focus traps prevent tabbing to background content

---

## 7. Reusable Files

To bootstrap a companion app with the same design language, copy these files:

| File | What It Provides |
|---|---|
| `src/contexts/ThemeContext.js` | All design tokens + light/dark theme + `useTheme()` hook |
| `src/components/ModalShell.js` | Modal overlay with focus trap, backdrop blur, close handling |
| `src/components/IconButton.js` | Reusable icon button with hover state management |
| `src/hooks/useFocusTrap.js` | Focus trap logic for modals (Tab cycling, Escape, focus restoration) |
| `src/data/constants.js` | `COLOR_PALETTES` with 4 palette definitions (only needed if you have color-coded content) |

### Dependencies

```json
{
  "@iconify/react": "^6.0.2",
  "@iconify-icons/mdi": "^1.2.48",
  "react": "^19.x"
}
```

### Fonts (Google Fonts)

```
Newsreader — optical size 6–72, weights 400, 600, 700
Overpass Mono — weights 400, 500, 600, 700
```

---

## Quick Reference Card

```
Fonts:         Newsreader (content) / Overpass Mono (UI)
Primary accent: #F59E0B (gold)
Page bg:       #F7F7F5 light / #0F0F11 dark
Card bg:       #fff light / #1C1C20 dark
Header bg:     #18181B (always dark)
Border:        1.5px solid
Card radius:   10px
Modal radius:  14px
Button radius: 8px
Input radius:  6px
Max width:     960px
Transition:    all 0.15s (elements) / 0.2s ease (theme)
```
