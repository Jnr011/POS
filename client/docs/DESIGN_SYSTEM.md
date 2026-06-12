# Pharmacy POS — Design System

> **Tagline:** Precision Care — Clinically precise yet warm, like a thoughtfully designed pharmacy counter.

---

## 1. Design Philosophy

| Pillar | Principle |
|--------|-----------|
| **Trust** | Pharmaceutical context demands clarity and reliability. Every visual decision reinforces confidence. |
| **Speed** | Cashiers and pharmacists need zero-friction workflows. The interface gets out of the way. |
| **Clarity** | High legibility, obvious hierarchies, unmistakable states. No ambiguity. |
| **Warmth** | Not cold or sterile. Soft neutrals, gentle color, approachable typography. |

**One-sentence summary:** *Apple Store meets modern healthcare* — clean, trustworthy, fast, and approachable.

---

## 2. Color System

### 2.1 Tokens (OKLCH)

Light theme:

```css
:root {
  --background: oklch(0.985 0.01 240);
  --foreground: oklch(0.15 0.01 240);
  --primary: oklch(0.55 0.16 220);
  --primary-foreground: oklch(0.98 0 0);
  --accent: oklch(0.72 0.18 160);
  --accent-foreground: oklch(0.15 0 0);
  --muted: oklch(0.96 0.01 240);
  --muted-foreground: oklch(0.55 0.01 240);
  --card: oklch(0.99 0 0);
  --card-foreground: oklch(0.15 0.01 240);
  --popover: oklch(0.99 0 0);
  --popover-foreground: oklch(0.15 0.01 240);
  --secondary: oklch(0.94 0.01 240);
  --secondary-foreground: oklch(0.25 0.01 240);
  --destructive: oklch(0.58 0.22 25);
  --destructive-foreground: oklch(0.98 0 0);
  --border: oklch(0.91 0.01 240);
  --input: oklch(0.91 0.01 240);
  --ring: oklch(0.55 0.16 220);
  --radius: 0.625rem;
  --sidebar: oklch(0.97 0.005 240);
  --sidebar-foreground: oklch(0.15 0.01 240);
  --sidebar-accent: oklch(0.55 0.16 220 / 0.08);
}
```

Dark theme:

```css
.dark {
  --background: oklch(0.18 0.01 240);
  --foreground: oklch(0.95 0.01 240);
  --primary: oklch(0.65 0.16 220);
  --primary-foreground: oklch(0.15 0 0);
  --accent: oklch(0.62 0.18 160);
  --accent-foreground: oklch(0.98 0 0);
  --muted: oklch(0.25 0.01 240);
  --muted-foreground: oklch(0.65 0.01 240);
  --card: oklch(0.22 0.01 240);
  --card-foreground: oklch(0.95 0.01 240);
  --destructive: oklch(0.62 0.22 25);
  --border: oklch(0.3 0.01 240);
  --input: oklch(0.3 0.01 240);
  --ring: oklch(0.65 0.16 220);
  --sidebar: oklch(0.15 0.01 240);
  --sidebar-foreground: oklch(0.95 0.01 240);
  --sidebar-accent: oklch(0.65 0.16 220 / 0.12);
}
```

### 2.2 Semantic Color Map

| Tailwind Utility | CSS Variable | Usage |
|-----------------|--------------|-------|
| `bg-background` | `--background` | Page backgrounds |
| `text-foreground` | `--foreground` | Body text |
| `bg-primary` | `--primary` | Buttons, active states, links |
| `text-primary` | `--primary` | Links, highlights |
| `bg-accent` | `--accent` | Success states, positive indicators |
| `text-accent` | `--accent` | Revenue, profit, checkmarks |
| `bg-muted` | `--muted` | Subtle backgrounds, skeleton loaders |
| `text-muted-foreground` | `--muted-foreground` | Secondary text, placeholders |
| `bg-card` | `--card` | Card surfaces |
| `bg-destructive` | `--destructive` | Delete buttons, errors |
| `border-border` | `--border` | Borders, dividers |
| `ring-ring` | `--ring` | Focus rings |

### 2.3 Extended Semantic Tokens (for future use)

```
--success  ->  oklch(0.62 0.18 145)   —  Sale completed, sync OK
--warning  ->  oklch(0.75 0.18 85)    —  Low stock, offline mode
--info     ->  oklch(0.55 0.16 220)   —  Notifications, tips
```

---

## 3. Typography

### 3.1 Font Stack

| Role | Font | Weight | Fallback |
|------|------|--------|----------|
| Display / Page Titles | **DM Serif Display** | 400 | Georgia, serif |
| UI / Body | **Satoshi** | 500 (Regular), 700 (Bold) | System sans-serif |
| Mono / Data | **JetBrains Mono** | 400, 500 | SF Mono, Consolas |

### 3.2 Type Scale

| Element | Class | Size | Weight | Font |
|---------|-------|------|--------|------|
| Page title (h1) | `text-2xl font-bold` | 1.5rem / 24px | 700 | Satoshi |
| Section header (h2) | `text-lg font-semibold` | 1.125rem / 18px | 600 | Satoshi |
| Card title | `text-base font-semibold` | 1rem / 16px | 600 | Satoshi |
| Body | `text-sm` | 0.875rem / 14px | 500 | Satoshi |
| Small / Meta | `text-xs` | 0.75rem / 12px | 500 | Satoshi |
| Data / Numbers | — | inherit | 500 | JetBrains Mono + `tabular-nums` |
| Display heading | `text-3xl font-serif` | 2rem / 32px | 400 | DM Serif Display |

### 3.3 Import Strategy

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

Satoshi should be self-hosted via `@font-face` pointing to `/fonts/Satoshi-Variable.woff2` with `font-display: swap`.

---

## 4. Spacing & Layout

### 4.1 Layout Structure

```
┌──────────────────────────────────────────────┐
│  Navbar (h-14) — bg-background border-b      │
├──────────┬───────────────────────────────────┤
│ Sidebar  │  Main Content                      │
│ (w-56)   │  flex-1 overflow-auto p-6 space-y-6│
│          │                                     │
│ bg-card  │  <Routes />                        │
│ border-r │                                     │
│ min-h-   │                                     │
│ [100dvh] │                                     │
├──────────┴───────────────────────────────────┤
│  ConnectivityIndicator (fixed bottom-0)       │
└──────────────────────────────────────────────┘
```

### 4.2 Spacing Scale

| Spacing | Tailwind | When |
|---------|----------|------|
| Page padding | `p-6` | All page containers |
| Section gap | `space-y-6` | Between major sections |
| Card gap (grid) | `gap-4 lg:gap-6` | Stat card grids |
| Card padding | `p-5` | CardContent |
| Card header padding | `p-5 pb-3` | CardHeader |
| Sidebar item padding | `px-3 py-1.5` | Nav links |
| Button padding | `px-4 py-2` | Default buttons |

### 4.3 Grid Patterns

| Pattern | Classes | Use |
|---------|---------|-----|
| Stat cards | `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6` | Dashboards |
| Product grid | `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4` | Sales page |
| Form fields | `grid grid-cols-1 sm:grid-cols-2 gap-4` | Forms |
| Two-panel | `flex gap-6` (70/30 split) | Sales layout |

---

## 5. Component Design Details

### 5.1 Card

```
┌──────────────────────────────────────────────┐
│  [optional 3px accent border-top]             │
│  CardHeader  (p-5 pb-3)                       │
│    CardTitle (text-base font-semibold)         │
│    CardDescription (text-sm text-muted-fore.)  │
│  CardContent (p-5 pt-0)                       │
│    Number / Content                            │
│  CardFooter (p-5 pt-0 flex items-center)       │
└──────────────────────────────────────────────┘

Classes: rounded-xl border bg-card text-card-foreground shadow-sm
```

Interactive cards (clickable) add: `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer`

### 5.2 Button

| Variant | Classes | Use |
|---------|---------|-----|
| Default | `bg-primary text-primary-foreground shadow hover:bg-primary/90 active:scale-95` | Primary actions |
| Outline | `border border-input bg-background hover:bg-accent hover:text-accent-foreground` | Secondary |
| Ghost | `hover:bg-accent hover:text-accent-foreground` | Subtle actions |
| Destructive | `bg-destructive text-destructive-foreground hover:bg-destructive/90` | Delete |

All buttons: `transition-all duration-150` + `active:scale-95` for tactile feel.

### 5.3 Sidebar

```
┌─ Sidebar (w-56 bg-card border-r min-h-[100dvh]) ─┐
│  ┌─────────────────────────────────────────────┐   │
│  │  User info (p-4 border-b)                   │   │
│  │  ● Pharmacist Name                          │   │
│  │  └─ Admin role badge                        │   │
│  ├─────────────────────────────────────────────┤   │
│  │  Nav items (flex flex-col gap-0.5 p-2)      │   │
│  │  ┌─────────────────────────────────────────┐│   │
│  │  │ 🏠 Dashboard                            ││   │  ← active: bg-sidebar-accent text-foreground
│  │  ├─────────────────────────────────────────┤│   │     + border-l-2 border-primary pl-[10px]
│  │  │ 💳 Sales                                ││   │  ← inactive: text-muted-foreground
│  │  ├─────────────────────────────────────────┤│   │
│  │  │ 📦 Inventory                            ││   │
│  │  └─────────────────────────────────────────┘│   │
│  ├─────────────────────────────────────────────┤   │
│  │  Admin section (if admin)                   │   │
│  │  ┌─ "Admin Only" label ────────────────────┐│   │
│  │  │ 📈 Reports                              ││   │
│  │  └─────────────────────────────────────────┘│   │
│  ├─────────────────────────────────────────────┤   │
│  │  Footer (mt-auto p-4 border-t text-xs)      │   │
│  │  🔐 Admin Access Enabled                    │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘

Nav link classes:
  flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors duration-150
```

### 5.4 Table

```
┌──────────────────────────────────────────────────┐
│  TableHeader                                      │
│  ┌──────┬──────────┬───────┬──────┬─────────┐    │
│  │ Name │ Stock    │ Price │ Exp. │ Actions │    │
│  ├──────┼──────────┼───────┼──────┼─────────┤    │
│  │       TableBody (hover:bg-muted/50 rows)      │
│  │ Par. │ 45 ✓     │ ₵5.99 │ Dec  │ [Edit]  │    │
│  │ Asp. │ 3 ⚠️     │ ₵3.50 │ Nov  │ [Edit]  │    │  ← low stock row: text-destructive
│  └──────┴──────────┴───────┴──────┴─────────┘    │
└──────────────────────────────────────────────────┘

Table classes: w-full caption-bottom text-sm
Header: h-10 px-2 text-left align-middle font-medium text-muted-foreground
Row: border-b transition-colors hover:bg-muted/50
Empty state: colSpan={N} text-center text-muted-foreground py-8
```

### 5.5 Form Inputs

```
┌──────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────┐   │
│  │ Product Name                          [  ] │   │
│  └────────────────────────────────────────────┘   │
│  Input classes:                                    │
│    flex h-9 w-full rounded-md border border-input   │
│    bg-background px-3 py-1 text-sm shadow-sm        │
│    transition-colors                                │
│    focus-visible:outline-none focus-visible:ring-1  │
│    focus-visible:ring-ring                          │
│    placeholder:text-muted-foreground                 │
│    disabled:cursor-not-allowed disabled:opacity-50   │
└──────────────────────────────────────────────────┘
```

### 5.6 Toast

```
┌──────────────────────────────────────────────┐
│  Container: fixed top-4 right-4 z-[9999]      │
│  flex flex-col gap-2 pointer-events-none       │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ ✓ Sale completed successfully!   [×] │    │  ← toast-success
│  └──────────────────────────────────────┘    │
│  ┌──────────────────────────────────────┐    │
│  │ ✗ Failed to save product        [×] │    │  ← toast-error
│  └──────────────────────────────────────┘    │
│                                              │
│  Toast classes:                               │
│    pointer-events-auto rounded-lg shadow-lg    │
│    px-4 py-3 text-sm font-medium text-white     │
│    animate-slide-in                            │
│  Success: bg-accent/90                         │
│  Error:   bg-destructive/90                    │
│  Info:    bg-primary/90                        │
└──────────────────────────────────────────────┘
```

### 5.7 Skeleton Loader

```
Create a Skeleton component via:

  <div className="rounded-md bg-muted animate-pulse" />

Usage:
  <Skeleton className="h-4 w-[250px]" />    → text line
  <Skeleton className="h-9 w-full" />        → button
  <Skeleton className="h-[120px] w-full rounded-xl" />  → card
  <Skeleton className="h-8 w-full" />        → table row
```

### 5.8 Badge

```
Create a Badge component via:

  variants: default | success | warning | destructive | outline

  default:     bg-primary/10 text-primary border-transparent
  success:     bg-accent/10 text-accent border-transparent
  warning:     bg-amber/10 text-amber-600 border-transparent
  destructive: bg-destructive/10 text-destructive border-transparent
  outline:     text-foreground border-border

Usage:
  <Badge variant="success">Synced</Badge>     → green
  <Badge variant="warning">Low Stock</Badge>  → amber
  <Badge variant="destructive">Error</Badge>  → red
  <Badge>Default</Badge>                       → primary
```

---

## 6. Motion & Animation

### 6.1 Principles

- **Performance-first:** CSS-only transitions. No JS animation libraries.
- **Minimal:** Every animation must serve a purpose (feedback, hierarchy, state change).
- **Fast:** All durations ≤ 200ms for UI transitions, 1.5s for pulse/shimmer.

### 6.2 Transition Map

| Interaction | Property | Duration | Easing | Tailwind |
|------------|----------|----------|--------|----------|
| Button hover | `colors` | 150ms | ease | `transition-colors duration-150` |
| Button active | `transform` | 100ms | ease | `active:scale-95` |
| Card hover | `shadow, transform` | 200ms | ease-out | `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200` |
| Sidebar link | `colors` | 150ms | ease | `transition-colors duration-150` |
| Modal overlay | `opacity` | 150ms | ease | shadcn Dialog default |
| Modal content | `opacity, transform` | 200ms | ease-out | shadcn Dialog default |
| Toast enter | `transform, opacity` | 300ms | ease-out | `animate-slide-in` (custom) |
| Skeleton | `opacity` | 1.5s | ease-in-out | `animate-pulse` |
| Page content | `opacity` | 200ms | ease | `animate-in fade-in` (optional) |

### 6.3 Custom Keyframes (add to index.css)

```css
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
```

---

## 7. Dark Mode

- Toggled via `.dark` class on `<html>` element
- Persist preference in localStorage
- Default: follow `prefers-color-scheme`
- All CSS variables defined for both themes
- Components use semantic tokens (`bg-background`, `text-foreground`) — no hardcoded colors

---

## 8. Accessibility

| Requirement | Implementation |
|------------|----------------|
| Color contrast | All foreground/background pairs exceed WCAG AA (4.5:1) |
| Focus indicators | `focus-visible:ring-1 focus-visible:ring-ring` on all interactive elements |
| Keyboard navigation | Radix primitives handle all keyboard interactions (Dialog, Select) |
| Screen reader labels | `sr-only` for icon-only buttons; `aria-label` on all interactive controls |
| Motion reduction | `prefers-reduced-motion: no-animation` for vestibular disorders |
| Touch targets | All interactive elements ≥ 44×44px |

---

## 9. Performance Guidelines

| Concern | Approach |
|---------|----------|
| CSS bundle | Tailwind JIT — only generated classes in production ✓ |
| JS bundle | Dynamically import heavy pages; tree-shake unused imports |
| Font loading | `font-display: swap` + preconnect to font CDN |
| Animations | Only `transform` and `opacity` — triggers compositor only, no layout |
| Offline-first | Dexie IndexedDB cache + sync queue (already implemented) |
| Rendering | Zustand for minimal re-renders; avoid inline functions in render where possible |

---

## 10. File Organization

```
src/
├── components/
│   ├── ui/                    # shadcn-style primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── skeleton.tsx       # ← NEW
│   │   └── badge.tsx          # ← NEW
│   ├── Navbar.tsx             # Refactor
│   ├── Sidebar.tsx            # Refactor
│   ├── Toast.tsx              # Rewrite to Tailwind
│   └── ConnectivityIndicator.tsx  # Rewrite to Tailwind
├── pages/                     # Refactor with new tokens
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── AdminDashboard.tsx
│   ├── SalesRepDashboard.tsx
│   ├── Sales.tsx
│   ├── Inventory.tsx
│   └── Reports.tsx
├── styles/
│   └── animations.css         # ← NEW (optional, for custom keyframes)
├── index.css                  # Update tokens + @font-face
├── App.css                    # — DELETE (migrate to Tailwind)
└── App.tsx                    # Remove App.css import, use Tailwind layout
```
