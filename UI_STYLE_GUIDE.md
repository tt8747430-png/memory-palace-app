# UI Style Guide — Memory Palace App

This document is the **single source of truth** for all UI/UX decisions in the Memory Palace App. Every design choice, component pattern, and responsive behaviour must follow these guidelines.

> **#1 Priority: Mobile-First Design.** All components are designed for the smallest screen first and enhanced progressively for larger screens.

---

## Table of Contents

1. [Mobile-First Design Strategy](#1-mobile-first-design-strategy)
2. [Canvas on Mobile (React Flow)](#2-canvas-on-mobile-react-flow)
3. [Color & Theme System](#3-color--theme-system)
4. [Tailwind Config Additions](#4-tailwind-config-additions)
5. [Typography Scale](#5-typography-scale)
6. [Component Patterns](#6-component-patterns)
7. [Responsive Navigation Architecture](#7-responsive-navigation-architecture)

---

## 1. Mobile-First Design Strategy

### Breakpoint Strategy (Tailwind CSS)

Design from the smallest viewport up. Never write desktop-first styles and override them for mobile.

| Breakpoint | Width | Layout |
|---|---|---|
| Default | < 640px | Single column, bottom nav, stacked cards |
| `sm` | ≥ 640px | Slightly wider cards, increased padding |
| `md` | ≥ 768px | 2-column grid, side navigation appears |
| `lg` | ≥ 1024px | 3-column grid, full sidebar + canvas |
| `xl` | ≥ 1280px | Canvas reaches maximum width, detail panels visible |

**Rule:** Always write base styles for mobile, then add `md:`, `lg:`, `xl:` overrides.

```tsx
// ✅ Correct — mobile-first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ❌ Wrong — desktop-first
<div className="grid grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1 gap-4">
```

### Bottom Navigation (Mobile)

On mobile (< `md` breakpoint), the sidebar is replaced entirely by a **bottom tab bar** with 5 primary tabs:

| Tab | Icon | Route |
|---|---|---|
| Home | `Home` | `/` |
| Daily | `Calendar` | `/daily` |
| Games | `Gamepad2` | `/games` |
| Progress | `Trophy` | `/progress` |
| Palaces | `Map` | `/palace` |

- Each tab item: minimum `48px × 48px` touch target
- Active tab: `text-primary` with stroke-width `2.5`
- Inactive tab: `text-muted-foreground` with stroke-width `2`
- Label font size: `0.625rem` (10px) — kept small to leave room for icons

See [§7 Responsive Navigation Architecture](#7-responsive-navigation-architecture) for the full implementation.

### Hamburger Drawer

Secondary navigation items (Settings, Profile, Search, etc.) are accessible via a hamburger icon in the top bar on mobile. This opens a shadcn `Sheet` component sliding in from the left.

```tsx
import { Sheet, SheetContent, SheetTrigger } from '@/packages/ui/components/sheet';
import { Menu } from 'lucide-react';

<Sheet>
  <SheetTrigger asChild>
    <button className="rounded-full p-2 min-w-[48px] min-h-[48px]">
      <Menu className="h-5 w-5" />
    </button>
  </SheetTrigger>
  <SheetContent side="left" className="w-72">
    {/* Secondary navigation items */}
  </SheetContent>
</Sheet>
```

### Safe Area Insets (iOS)

All layouts must account for the iOS notch and home indicator using CSS environment variables:

```css
/* Bottom navigation padding */
padding-bottom: env(safe-area-inset-bottom);

/* Top bar / status bar area */
padding-top: env(safe-area-inset-top);
```

In Tailwind, use the custom spacing utilities defined in [§4](#4-tailwind-config-additions):

```tsx
<nav className="pb-[env(safe-area-inset-bottom)]">
<main className="pb-[calc(4rem+env(safe-area-inset-bottom))]">
```

### Dynamic Viewport Height (`100dvh`)

Use `100dvh` instead of `100vh` to correctly account for the browser's dynamic chrome (address bar, tab bar) on mobile browsers.

```tsx
// ✅ Correct — handles mobile browser chrome
<div className="h-[100dvh]">

// ❌ Incorrect — 100vh is taller than the visible area on mobile Safari
<div className="h-screen">
```

### Touch Targets

**All interactive elements must have a minimum tap/click target of 48 × 48 px** per Apple Human Interface Guidelines and Material Design standards.

```tsx
// ✅ Correct — explicit minimum sizes
<button className="min-w-[48px] min-h-[48px] flex items-center justify-center">

// ❌ Incorrect — small icon-only button without padding
<button><Icon className="h-4 w-4" /></button>
```

### Viewport Meta Tag

Add `viewport-fit=cover` to the root `<head>` in the root layout file `apps/web/src/app/layout.tsx` for edge-to-edge display on devices with notches:

```tsx
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};
```

Or as a raw meta tag:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

### Full-Screen Takeover (Immersive Modes)

During immersive sessions (canvas editing, flashcards, quizzes, memory games) **all navigation must be hidden**:

```tsx
// Hide bottom nav and top bar during immersive mode
<div className="fixed inset-0 z-[100] bg-background">
  {/* Immersive content — canvas, flashcards, quiz */}
  <button
    className="absolute top-4 right-4 min-w-[48px] min-h-[48px]"
    onClick={exitImmersiveMode}
  >
    <X className="h-5 w-5" />
  </button>
</div>
```

### Bottom Sheets (Mobile Pickers)

All pickers, selectors, and form panels on mobile must use a bottom sheet (shadcn `Sheet` with `side="bottom"`) instead of a modal or side panel.

```tsx
<Sheet>
  <SheetTrigger asChild>
    <button>Edit Node</button>
  </SheetTrigger>
  <SheetContent side="bottom" className="rounded-t-2xl">
    {/* Node editing form */}
  </SheetContent>
</Sheet>
```

### Pull-to-Refresh

Implement pull-to-refresh on all list and data views using a touch event listener or a library compatible with the project stack. The refresh action should call the relevant TanStack Query `refetch()`.

### Swipe Gestures

| Interaction | Gesture | Implementation |
|---|---|---|
| Flashcard navigation | Swipe left / right | `onTouchStart` + `onTouchEnd` delta detection |
| Delete palace/room | Swipe left to reveal action | CSS `translateX` + threshold |
| Dismiss notification | Swipe up | Touch event or `useSwipeable` |

---

## 2. Canvas on Mobile (React Flow)

The React Flow canvas requires specific configuration for a good mobile experience.

### Required React Flow Props

```tsx
<ReactFlow
  // Touch pan support — allows dragging the canvas with one finger
  panOnDrag={[1, 2]}           // 1 = left mouse, 2 = touch
  // Pinch to zoom
  zoomOnPinch={true}
  // Disable scroll-to-zoom on mobile (conflicts with page scroll)
  zoomOnScroll={false}
  // Prevent default touch behaviour to avoid browser scroll conflicts
  preventScrolling={true}
>
```

### Node Touch Targets on Mobile

Canvas nodes must be large enough to tap accurately on a touchscreen:

```tsx
// Node component styles
<div className="min-w-[60px] min-h-[60px] rounded-lg border p-3">
  {/* Node content */}
</div>
```

### Mini-Map

The mini-map is a desktop-only feature. Hide it on mobile to save space:

```tsx
<MiniMap className="hidden md:block" />
```

### Zoom Controls

Show zoom controls on mobile as a replacement for the hidden mini-map:

```tsx
<Controls
  className="md:hidden"
  showInteractive={false}
/>
```

### Mobile Toolbar (FAB + Radial Menu)

On mobile, the canvas toolbar collapses to a Floating Action Button (FAB). Tapping the FAB expands a radial menu with primary actions (Add Node, Add Edge, Fit View, etc.).

```tsx
// FAB positioned above the bottom navigation
<button className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] right-4
                   min-w-[56px] min-h-[56px] rounded-full bg-primary text-primary-foreground
                   shadow-lg flex items-center justify-center z-40 md:hidden">
  <Plus className="h-6 w-6" />
</button>
```

### Node Editing on Mobile

On mobile, node editing opens in a **bottom sheet** instead of a side panel:

```tsx
// Mobile: bottom sheet
<Sheet open={isEditing} onOpenChange={setIsEditing}>
  <SheetContent side="bottom" className="rounded-t-2xl h-[80dvh] overflow-y-auto">
    <NodeEditForm node={selectedNode} />
  </SheetContent>
</Sheet>

// Desktop: side panel
<aside className="hidden md:flex w-80 border-l flex-col overflow-y-auto">
  <NodeEditForm node={selectedNode} />
</aside>
```

### Reduced Motion Support

All canvas animations must respect `prefers-reduced-motion`:

```tsx
// In your Tailwind config or CSS
@media (prefers-reduced-motion: reduce) {
  .react-flow__edge-path {
    animation: none;
  }
  .react-flow__node {
    transition: none;
  }
}
```

---

## 3. Color & Theme System

Based on shadcn/ui theming with CSS custom properties. All colors are defined as HSL values in `globals.css` and referenced via Tailwind.

### Palette

| Token | Light Mode | Dark Mode | Tailwind Class | Usage |
|---|---|---|---|---|
| Primary | `hsl(220, 90%, 56%)` | `hsl(220, 90%, 65%)` | `bg-primary` / `text-primary` | CTAs, active nav states |
| Success | `hsl(142, 76%, 36%)` | `hsl(142, 76%, 50%)` | `bg-success` / `text-success` | Streaks, completions |
| Warning | `hsl(38, 92%, 50%)` | `hsl(38, 92%, 60%)` | `bg-warning` / `text-warning` | Alerts, badges |
| Surface | `hsl(0, 0%, 98%)` | `hsl(240, 10%, 10%)` | `bg-surface` | Card backgrounds |
| Accent | `hsl(262, 83%, 58%)` | `hsl(262, 83%, 70%)` | `bg-accent` / `text-accent` | Gamification elements |

### CSS Custom Properties (globals.css)

```css
:root {
  --primary: 220 90% 56%;
  --primary-foreground: 0 0% 100%;

  --success: 142 76% 36%;
  --success-foreground: 0 0% 100%;

  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 10%;

  --surface: 0 0% 98%;
  --surface-foreground: 240 10% 10%;

  --accent: 262 83% 58%;
  --accent-foreground: 0 0% 100%;
}

.dark {
  --primary: 220 90% 65%;
  --success: 142 76% 50%;
  --warning: 38 92% 60%;
  --surface: 240 10% 10%;
  --accent: 262 83% 70%;
}
```

### Usage Rules

- Use semantic tokens (`text-primary`, `bg-card`) not raw color classes (`text-blue-600`)
- Success green (`hsl(142 76% 36%)`) for streaks, completion animations, and positive feedback
- Warning amber (`hsl(38 92% 50%)`) for time limits, expiring streaks, and caution states
- Accent purple (`hsl(262 83% 58%)`) for points, badges, and gamification UI elements

---

## 4. Tailwind Config Additions

Add the following to `apps/web/tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  // ... existing config
  theme: {
    extend: {
      // Safe area inset spacing for iOS notch/home indicator
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      // Mobile-first font sizes with explicit line heights
      fontSize: {
        'mobile-h1': ['1.75rem', { lineHeight: '2.25rem', fontWeight: 700 }],
        'mobile-h2': ['1.25rem', { lineHeight: '1.75rem', fontWeight: 600 }],
        'mobile-body': ['0.9375rem', { lineHeight: '1.5rem', fontWeight: 400 }],
        'mobile-caption': ['0.75rem', { lineHeight: '1.25rem', fontWeight: 400 }],
      },
      // Component-specific heights
      height: {
        'bottom-nav': '4rem',       // 64px bottom navigation bar
        'top-bar': '3.5rem',        // 56px mobile top bar
        'screen-dynamic': '100dvh', // Dynamic viewport height
      },
      // Minimum touch target sizes
      minWidth: {
        'touch': '48px',
      },
      minHeight: {
        'touch': '48px',
      },
    },
  },
};

export default config;
```

---

## 5. Typography Scale

All font sizes are defined mobile-first and scale up at wider breakpoints.

### Heading Scale

| Level | Mobile | `md` (768px+) | `lg` (1024px+) | Tailwind |
|---|---|---|---|---|
| H1 — Page title | `1.75rem / 700` | `2.25rem / 700` | `3rem / 800` | `text-mobile-h1 md:text-4xl lg:text-5xl font-bold` |
| H2 — Section title | `1.25rem / 600` | `1.5rem / 600` | `1.875rem / 700` | `text-mobile-h2 md:text-2xl lg:text-3xl font-semibold` |
| H3 — Card title | `1rem / 600` | `1.125rem / 600` | `1.25rem / 600` | `text-base md:text-lg font-semibold` |
| H4 — Sub-section | `0.875rem / 600` | `1rem / 600` | — | `text-sm md:text-base font-semibold` |

### Body & UI Text

| Use | Size | Tailwind |
|---|---|---|
| Body text | `0.9375rem` (15px) | `text-mobile-body` |
| UI labels | `0.875rem` (14px) | `text-sm` |
| Caption / meta | `0.75rem` (12px) | `text-mobile-caption` |
| Bottom nav labels | `0.625rem` (10px) | `text-[0.625rem]` |

### Font Family

Use the system font stack (already configured by shadcn/ui via `font-sans`) for optimal performance. No custom web fonts are required unless explicitly specified.

---

## 6. Component Patterns

### Card-Based Layouts

Palace cards, room cards, and node cards all follow the same base pattern with contextual data.

```tsx
// Palace card — responsive grid item
<div className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow
                p-4 flex flex-col gap-3 cursor-pointer">
  {/* Thumbnail */}
  <div className="aspect-video w-full rounded-lg bg-muted overflow-hidden">
    <img src={palace.thumbnailUrl} alt={palace.name} className="object-cover w-full h-full" />
  </div>
  {/* Content */}
  <div className="flex flex-col gap-1">
    <h3 className="text-base font-semibold line-clamp-1">{palace.name}</h3>
    <p className="text-sm text-muted-foreground line-clamp-2">{palace.description}</p>
  </div>
  {/* Footer */}
  <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
    <span>{palace.nodeCount} nodes</span>
    <span>{palace.roomCount} rooms</span>
  </div>
</div>
```

**Grid wrapper:**

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {palaces.map(palace => <PalaceCard key={palace.id} palace={palace} />)}
</div>
```

### Skeleton Loading States

Every data-fetching view must render skeleton placeholders while loading. This is especially important on mobile where network latency is higher.

```tsx
import { Skeleton } from '@/packages/ui/components/skeleton';

// Palace card skeleton
function PalaceCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
      <Skeleton className="aspect-video w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

// Usage
{isLoading
  ? Array.from({ length: 6 }).map((_, i) => <PalaceCardSkeleton key={i} />)
  : palaces.map(p => <PalaceCard key={p.id} palace={p} />)
}
```

### Toast Notifications

Use shadcn `Sonner` (or `useToast`) for all success/error feedback. Toasts appear at the bottom of the screen on mobile.

```tsx
import { toast } from 'sonner';

// Success
toast.success('Palace created!');

// Error
toast.error('Failed to save. Please try again.');

// With action
toast('Node deleted', {
  action: {
    label: 'Undo',
    onClick: () => restoreNode(nodeId),
  },
});
```

### Floating Action Button (FAB)

The primary "New Palace" action is a fixed FAB positioned above the bottom navigation on mobile. On desktop, it becomes a regular button in the sidebar or top of the list view.

```tsx
// Mobile FAB — fixed above bottom nav
<button
  className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] right-4
             min-w-[56px] min-h-[56px] rounded-full
             bg-primary text-primary-foreground shadow-lg
             flex items-center justify-center z-40
             transition-transform active:scale-95
             md:hidden"
  aria-label="Create new palace"
>
  <Plus className="h-6 w-6" />
</button>

// Desktop — standard button
<Button className="hidden md:flex gap-2">
  <Plus className="h-4 w-4" /> New Palace
</Button>
```

### Collapsible Sections

Long content areas use shadcn `Accordion` to keep the mobile view compact.

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
  from '@/packages/ui/components/accordion';

<Accordion type="single" collapsible>
  <AccordionItem value="rooms">
    <AccordionTrigger className="text-base font-semibold">
      Rooms ({palace.rooms.length})
    </AccordionTrigger>
    <AccordionContent>
      {palace.rooms.map(room => <RoomCard key={room.id} room={room} />)}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

### Stacked Layout (Responsive Grid)

```tsx
// Standard responsive grid used everywhere
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Full-Width CTAs

All primary action buttons must be full-width on mobile, auto-width on larger screens:

```tsx
<Button className="w-full md:w-auto">
  Start Today's Review
</Button>
```

---

## 7. Responsive Navigation Architecture

### Overview

| Screen | Navigation Type | Component |
|---|---|---|
| Mobile (< `md`) | Bottom tab bar + hamburger top bar | `BottomNav` + `MobileDrawer` |
| Desktop (≥ `md`) | Fixed left sidebar | `Sidebar` |

### Sidebar Items (Desktop)

| Icon | Label | Route | Notes |
|---|---|---|---|
| 🏠 | Home | `/` | Dashboard overview |
| 🗓️ | Daily Review | `/daily` | Spaced repetition daily challenge |
| 🗺️ | Palaces | `/palace` | Palace list and management |
| 🎮 | Games | `/games` | Memory games |
| 🏆 | Progress | `/progress` | Stats, streaks, achievements |
| 📚 | Study | `/study` | Browse content |
| 📝 | Review Generator | `/review` | Custom review and export |
| 🔍 | Search | `/search` | Full-text search |
| ⚙️ | Settings | `/settings` | App preferences |
| 👤 | Profile | `/profile` | User profile |

### DashboardShell

Wraps all dashboard pages. Composes sidebar (desktop), top bar (mobile), main content, and bottom nav (mobile). See [ARCHITECTURE.md §8](./ARCHITECTURE.md#8-responsive-layout-architecture) for the full implementation.

### Design Decisions

- **Sidebar width:** 240–256px (`w-60` or `w-64` in Tailwind)
- **Bottom nav height:** `4rem` (64px) + `env(safe-area-inset-bottom)`
- **Top bar height:** `3.5rem` (56px) + `env(safe-area-inset-top)`
- **Drawer width:** `18rem` (`w-72`) — wide enough for labels, narrow enough to feel like a panel not a full screen
- The main content area subtracts bottom nav height as bottom padding on mobile: `pb-[calc(4rem+env(safe-area-inset-bottom))]`

---

## Design Inspiration

The UI patterns in this guide are inspired by [TalantulApp.com](https://talantulapp.com), a mobile-first interactive Bible study platform, adapted for the Memory Palace use case. Key patterns adopted: card-based dashboards, gamification UI, bottom navigation, and full-screen immersive game modes.
