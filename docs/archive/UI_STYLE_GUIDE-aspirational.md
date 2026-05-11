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
8. [Command Palette (Cmd+K)](#8-command-palette-cmdk)
9. [Keyboard Shortcuts System](#9-keyboard-shortcuts-system)
10. [Dark Mode Best Practices](#10-dark-mode-best-practices)
11. [Micro-Interactions & Animation System](#11-micro-interactions--animation-system)
12. [Empty States](#12-empty-states)
13. [Canvas-Specific UX Patterns](#13-canvas-specific-ux-patterns)

---

## 1. Mobile-First Design Strategy

### Breakpoint Strategy (Tailwind CSS)

Design from the smallest viewport up. Never write desktop-first styles and override them for mobile.

| Breakpoint | Width    | Layout                                              |
| ---------- | -------- | --------------------------------------------------- |
| Default    | < 640px  | Single column, bottom nav, stacked cards            |
| `sm`       | ≥ 640px  | Slightly wider cards, increased padding             |
| `md`       | ≥ 768px  | 2-column grid, side navigation appears              |
| `lg`       | ≥ 1024px | 3-column grid, full sidebar + canvas                |
| `xl`       | ≥ 1280px | Canvas reaches maximum width, detail panels visible |

**Rule:** Always write base styles for mobile, then add `md:`, `lg:`, `xl:` overrides.

```tsx
// ✅ Correct — mobile-first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ❌ Wrong — desktop-first
<div className="grid grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1 gap-4">
```

### Bottom Navigation (Mobile)

On mobile (< `md` breakpoint), the sidebar is replaced entirely by a **bottom tab bar** with 5 primary tabs:

| Tab      | Icon       | Route       |
| -------- | ---------- | ----------- |
| Home     | `Home`     | `/`         |
| Daily    | `Calendar` | `/daily`    |
| Games    | `Gamepad2` | `/games`    |
| Progress | `Trophy`   | `/progress` |
| Palaces  | `Map`      | `/palace`   |

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
</Sheet>;
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
  <button className="absolute top-4 right-4 min-w-[48px] min-h-[48px]" onClick={exitImmersiveMode}>
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

| Interaction          | Gesture                     | Implementation                                |
| -------------------- | --------------------------- | --------------------------------------------- |
| Flashcard navigation | Swipe left / right          | `onTouchStart` + `onTouchEnd` delta detection |
| Delete palace/room   | Swipe left to reveal action | CSS `translateX` + threshold                  |
| Dismiss notification | Swipe up                    | Touch event or `useSwipeable`                 |

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
<div className="min-w-[60px] min-h-[60px] rounded-lg border p-3">{/* Node content */}</div>
```

### Mini-Map

The mini-map is a desktop-only feature. Hide it on mobile to save space:

```tsx
<MiniMap className="hidden md:block" />
```

### Zoom Controls

Show zoom controls on mobile as a replacement for the hidden mini-map:

```tsx
<Controls className="md:hidden" showInteractive={false} />
```

### Mobile Toolbar (FAB + Radial Menu)

On mobile, the canvas toolbar collapses to a Floating Action Button (FAB). Tapping the FAB expands a radial menu with primary actions (Add Node, Add Edge, Fit View, etc.).

```tsx
// FAB positioned above the bottom navigation
<button
  className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] right-4
                   min-w-[56px] min-h-[56px] rounded-full bg-primary text-primary-foreground
                   shadow-lg flex items-center justify-center z-40 md:hidden"
>
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

| Token   | Light Mode           | Dark Mode            | Tailwind Class                | Usage                   |
| ------- | -------------------- | -------------------- | ----------------------------- | ----------------------- |
| Primary | `hsl(220, 90%, 56%)` | `hsl(220, 90%, 65%)` | `bg-primary` / `text-primary` | CTAs, active nav states |
| Success | `hsl(142, 76%, 36%)` | `hsl(142, 76%, 50%)` | `bg-success` / `text-success` | Streaks, completions    |
| Warning | `hsl(38, 92%, 50%)`  | `hsl(38, 92%, 60%)`  | `bg-warning` / `text-warning` | Alerts, badges          |
| Surface | `hsl(0, 0%, 98%)`    | `hsl(240, 10%, 10%)` | `bg-surface`                  | Card backgrounds        |
| Accent  | `hsl(262, 83%, 58%)` | `hsl(262, 83%, 70%)` | `bg-accent` / `text-accent`   | Gamification elements   |

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
        'bottom-nav': '4rem', // 64px bottom navigation bar
        'top-bar': '3.5rem', // 56px mobile top bar
        'screen-dynamic': '100dvh', // Dynamic viewport height
      },
      // Minimum touch target sizes
      minWidth: {
        touch: '48px',
      },
      minHeight: {
        touch: '48px',
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

| Level              | Mobile           | `md` (768px+)    | `lg` (1024px+)   | Tailwind                                               |
| ------------------ | ---------------- | ---------------- | ---------------- | ------------------------------------------------------ |
| H1 — Page title    | `1.75rem / 700`  | `2.25rem / 700`  | `3rem / 800`     | `text-mobile-h1 md:text-4xl lg:text-5xl font-bold`     |
| H2 — Section title | `1.25rem / 600`  | `1.5rem / 600`   | `1.875rem / 700` | `text-mobile-h2 md:text-2xl lg:text-3xl font-semibold` |
| H3 — Card title    | `1rem / 600`     | `1.125rem / 600` | `1.25rem / 600`  | `text-base md:text-lg font-semibold`                   |
| H4 — Sub-section   | `0.875rem / 600` | `1rem / 600`     | —                | `text-sm md:text-base font-semibold`                   |

### Body & UI Text

| Use               | Size               | Tailwind              |
| ----------------- | ------------------ | --------------------- |
| Body text         | `0.9375rem` (15px) | `text-mobile-body`    |
| UI labels         | `0.875rem` (14px)  | `text-sm`             |
| Caption / meta    | `0.75rem` (12px)   | `text-mobile-caption` |
| Bottom nav labels | `0.625rem` (10px)  | `text-[0.625rem]`     |

### Font Family

Use the system font stack (already configured by shadcn/ui via `font-sans`) for optimal performance. No custom web fonts are required unless explicitly specified.

---

## 6. Component Patterns

### Card-Based Layouts

Palace cards, room cards, and node cards all follow the same base pattern with contextual data.

```tsx
// Palace card — responsive grid item
<div
  className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow
                p-4 flex flex-col gap-3 cursor-pointer"
>
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
  {palaces.map((palace) => (
    <PalaceCard key={palace.id} palace={palace} />
  ))}
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
{
  isLoading
    ? Array.from({ length: 6 }).map((_, i) => <PalaceCardSkeleton key={i} />)
    : palaces.map((p) => <PalaceCard key={p.id} palace={p} />);
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/packages/ui/components/accordion';

<Accordion type="single" collapsible>
  <AccordionItem value="rooms">
    <AccordionTrigger className="text-base font-semibold">
      Rooms ({palace.rooms.length})
    </AccordionTrigger>
    <AccordionContent>
      {palace.rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </AccordionContent>
  </AccordionItem>
</Accordion>;
```

### Stacked Layout (Responsive Grid)

```tsx
// Standard responsive grid used everywhere
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Full-Width CTAs

All primary action buttons must be full-width on mobile, auto-width on larger screens:

```tsx
<Button className="w-full md:w-auto">Start Today's Review</Button>
```

---

## 7. Responsive Navigation Architecture

### Overview

| Screen           | Navigation Type                    | Component                    |
| ---------------- | ---------------------------------- | ---------------------------- |
| Mobile (< `md`)  | Bottom tab bar + hamburger top bar | `BottomNav` + `MobileDrawer` |
| Desktop (≥ `md`) | Fixed left sidebar                 | `Sidebar`                    |

### Sidebar Items (Desktop)

| Icon | Label            | Route       | Notes                             |
| ---- | ---------------- | ----------- | --------------------------------- |
| 🏠   | Home             | `/`         | Dashboard overview                |
| 🗓️   | Daily Review     | `/daily`    | Spaced repetition daily challenge |
| 🗺️   | Palaces          | `/palace`   | Palace list and management        |
| 🎮   | Games            | `/games`    | Memory games                      |
| 🏆   | Progress         | `/progress` | Stats, streaks, achievements      |
| 📚   | Study            | `/study`    | Browse content                    |
| 📝   | Review Generator | `/review`   | Custom review and export          |
| 🔍   | Search           | `/search`   | Full-text search                  |
| ⚙️   | Settings         | `/settings` | App preferences                   |
| 👤   | Profile          | `/profile`  | User profile                      |

### DashboardShell

Wraps all dashboard pages. Composes sidebar (desktop), top bar (mobile), main content, and bottom nav (mobile). See [ARCHITECTURE.md §8](./ARCHITECTURE.md#8-responsive-layout-architecture) for the full implementation.

### Design Decisions

- **Sidebar width:** 240–256px (`w-60` or `w-64` in Tailwind)
- **Bottom nav height:** `4rem` (64px) + `env(safe-area-inset-bottom)`
- **Top bar height:** `3.5rem` (56px) + `env(safe-area-inset-top)`
- **Drawer width:** `18rem` (`w-72`) — wide enough for labels, narrow enough to feel like a panel not a full screen
- The main content area subtracts bottom nav height as bottom padding on mobile: `pb-[calc(4rem+env(safe-area-inset-bottom))]`

---

## 8. Command Palette (Cmd+K)

**Inspired by: Linear, Notion, Superhuman** — ⭐⭐⭐ HIGH PRIORITY

### Overview

A universal command palette accessible from anywhere in the app. Power users can navigate, create, and trigger actions without ever touching the mouse.

- Universal access via `Cmd/Ctrl + K` keyboard shortcut
- Context-aware suggestions based on current page/view
- Fuzzy search matching (typo-tolerant)
- Keyboard navigation: Arrow keys to navigate, `Enter` to select, `Esc` to close
- Rich previews: show icon, type badge, and breadcrumb beside results
- Recent actions/history surfaced at the top
- Implementation: use `kbar` (React) library — lightweight, composable, accessible
- Actions should include: navigate to any palace/room, create new palace/node, start daily review, toggle dark mode, open settings, search all nodes

### Implementation

```tsx
// apps/web/src/shared/components/CommandPalette.tsx
'use client';
import {
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarAnimator,
  KBarSearch,
  KBarResults,
  useMatches,
} from 'kbar';

const actions = [
  { id: 'home', name: 'Go Home', shortcut: ['g', 'h'], perform: () => router.push('/') },
  {
    id: 'new-palace',
    name: 'Create New Palace',
    shortcut: ['c', 'p'],
    perform: () => openCreatePalace(),
  },
  {
    id: 'new-node',
    name: 'Create New Node',
    shortcut: ['c', 'n'],
    perform: () => openCreateNode(),
  },
  { id: 'search', name: 'Search All Nodes…', shortcut: ['/', '/'], perform: () => focusSearch() },
  {
    id: 'daily',
    name: 'Start Daily Review',
    shortcut: ['g', 'd'],
    perform: () => router.push('/daily'),
  },
  { id: 'dark-mode', name: 'Toggle Dark Mode', shortcut: ['t', 'd'], perform: () => toggleTheme() },
  {
    id: 'settings',
    name: 'Open Settings',
    shortcut: ['g', 's'],
    perform: () => router.push('/settings'),
  },
];
// openCreatePalace, openCreateNode, focusSearch: implement via Zustand store actions or dialog state
// toggleTheme: implement via next-themes useTheme() hook — see §10 Dark Mode Best Practices
// router: useRouter() from 'next/navigation'
```

### Styling

- Minimal overlay with `backdrop-blur-sm`
- Centered modal with rounded corners
- Elevated surface background (`--popover`) for the palette container
- Search input: `text-base` height, prominent border
- Result rows: icon + name + shortcut badge + breadcrumb

### Mobile Behaviour

On mobile, `Cmd+K` is not available. Trigger the command palette via a **search icon in the top bar** (`MagnifyingGlass` icon). The palette opens as a full-screen bottom sheet (`Sheet` with `side="bottom"`) instead of a floating modal. This is consistent with mobile OS search patterns (e.g. Spotlight on iOS).

```tsx
// Mobile trigger — search icon in top bar
<button className="md:hidden min-w-[48px] min-h-[48px] flex items-center justify-center"
        onClick={openCommandPalette}>
  <Search className="h-5 w-5" />
</button>

// Desktop trigger hint shown in top bar
<button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border
                   text-sm text-muted-foreground hover:bg-muted transition-colors"
        onClick={openCommandPalette}>
  <Search className="h-4 w-4" />
  <span>Search…</span>
  <kbd className="ml-4 text-xs border rounded px-1">⌘K</kbd>
</button>
```

---

## 9. Keyboard Shortcuts System

**Inspired by: Linear, Superhuman, Notion** — ⭐⭐⭐ HIGH PRIORITY

### Full Shortcut Reference

| Category       | Shortcut               | Action                           |
| -------------- | ---------------------- | -------------------------------- |
| **Navigation** | `g` then `h`           | Go Home                          |
|                | `g` then `d`           | Go to Daily Review               |
|                | `g` then `p`           | Go to Palaces                    |
|                | `g` then `s`           | Go to Settings                   |
| **Creation**   | `c` then `p`           | Create new palace                |
|                | `c` then `n`           | Create new node (in canvas)      |
| **Canvas**     | `Space` (hold)         | Pan tool (hand mode)             |
|                | `Delete` / `Backspace` | Delete selected node(s)          |
|                | `Cmd/Ctrl + Z`         | Undo last action                 |
|                | `Cmd/Ctrl + Shift + Z` | Redo                             |
|                | `Cmd/Ctrl + A`         | Select all nodes                 |
|                | `Cmd/Ctrl + D`         | Duplicate selected node(s)       |
|                | `F`                    | Fit all nodes in view            |
| **Global**     | `Cmd/Ctrl + K`         | Open command palette             |
|                | `?`                    | Show keyboard shortcuts overlay  |
|                | `t` then `d`           | Toggle dark/light mode           |
|                | `Esc`                  | Close any open panel/modal/sheet |

### Implementation

Register shortcuts via `kbar` actions or a custom `useHotkeys` hook:

```tsx
// apps/web/src/shared/hooks/useGlobalShortcuts.ts
import { useHotkeys } from 'react-hotkeys-hook';
import { useRouter } from 'next/navigation';

export function useGlobalShortcuts() {
  const router = useRouter();

  // Sequential shortcuts — "g then h"
  useHotkeys('g+h', () => router.push('/'), { scopes: 'global' });
  useHotkeys('g+d', () => router.push('/daily'), { scopes: 'global' });
  useHotkeys('g+p', () => router.push('/palace'), { scopes: 'global' });
  useHotkeys('g+s', () => router.push('/settings'), { scopes: 'global' });
  useHotkeys('?', () => openShortcutsOverlay(), { scopes: 'global' });
  useHotkeys('Escape', () => closeActivePanel(), { scopes: 'global' });
}
```

### Discoverability

- Tooltips on hover show shortcut hints, e.g. "New Palace `C` `P`"
- Shortcuts overlay modal: press `?` from any page to see a categorized grid of all shortcuts
- Never conflict with browser/system shortcuts (`Cmd+W`, `Cmd+T`, `Cmd+N`, etc.)

```tsx
// Keyboard shortcut badge component
<kbd
  className="inline-flex items-center gap-0.5 text-xs font-mono
                border rounded px-1 py-0.5 bg-muted text-muted-foreground"
>
  ⌘K
</kbd>
```

### Mobile Behaviour

Keyboard shortcuts are desktop-only. On mobile, all actions must be accessible via touch UI (bottom nav, FAB, command palette search icon, context menus). The shortcuts overlay modal is hidden on mobile.

---

## 10. Dark Mode Best Practices

**Inspired by: Linear, Notion, Superhuman** — ⭐⭐⭐ HIGH PRIORITY

Extends the §3 Color & Theme System with comprehensive dark mode specifics.

### Color Token Reference

| Element          | Light Mode           | Dark Mode            | Rule                                      |
| ---------------- | -------------------- | -------------------- | ----------------------------------------- |
| Background       | `hsl(0, 0%, 100%)`   | `hsl(222, 20%, 7%)`  | Never pure black — use dark navy/charcoal |
| Surface (Cards)  | `hsl(0, 0%, 98%)`    | `hsl(222, 15%, 12%)` | Cards slightly lighter than background    |
| Border           | `hsl(220, 13%, 91%)` | `hsl(222, 15%, 18%)` | Subtle, never harsh white lines           |
| Text Primary     | `hsl(222, 47%, 11%)` | `hsl(210, 40%, 96%)` | Never pure white — use off-white          |
| Text Secondary   | `hsl(215, 16%, 47%)` | `hsl(215, 20%, 65%)` | Same muted tone in both modes             |
| Elevated Surface | `white`              | `hsl(222, 15%, 15%)` | Tooltips, dropdowns, command palette      |

### CSS Custom Properties (`globals.css`)

```css
.dark {
  --background: 222 20% 7%;
  --foreground: 210 40% 96%;
  --card: 222 15% 12%;
  --card-foreground: 210 40% 96%;
  --popover: 222 15% 15%;
  --popover-foreground: 210 40% 96%;
  --border: 222 15% 18%;
  --muted: 222 15% 15%;
  --muted-foreground: 215 20% 65%;
}
```

### Dark Mode Rules

- **OS preference detection**: auto-detect via `prefers-color-scheme` media query using `next-themes`
- **Persistence**: persist user choice in `localStorage` via `next-themes`
- **Toggle locations**: command palette (`t d`), settings page, and a sun/moon icon in the header
- **Accent saturation**: reduce saturation of accent colors by ~10% in dark mode to avoid eye strain
- **Shadows**: shadows become near-invisible in dark mode — use subtle border instead (`border border-border`)
- **Canvas background**: use a subtle dot grid pattern (`radial-gradient`) visible in both modes

```tsx
// Root layout — next-themes provider
import { ThemeProvider } from 'next-themes';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

```tsx
// Dark mode toggle component
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full hover:bg-muted"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
```

### Mobile Behaviour

Dark mode toggle is available in the mobile top bar (icon button) and in the hamburger drawer's settings section. The `min-w-[48px] min-h-[48px]` touch target rule applies.

---

## 11. Micro-Interactions & Animation System

**Inspired by: Duolingo, Spotify, Todoist** — ⭐⭐ MEDIUM PRIORITY

Define the animation language for the entire app. Use `framer-motion` for complex animations and Tailwind `transition-*` for simple ones.

### Animation Reference

| Trigger                  | Animation                            | Duration | Implementation                                          |
| ------------------------ | ------------------------------------ | -------- | ------------------------------------------------------- |
| Page transition          | Fade + slide up                      | 200ms    | `framer-motion` `AnimatePresence`                       |
| Card hover               | Lift + shadow increase               | 150ms    | `hover:shadow-lg hover:-translate-y-0.5 transition-all` |
| Node creation on canvas  | Scale in from center                 | 300ms    | `framer-motion` `initial={{ scale: 0, opacity: 0 }}`    |
| Node deletion            | Fade + shrink out                    | 200ms    | `framer-motion` `exit={{ scale: 0.8, opacity: 0 }}`     |
| Badge/achievement unlock | Confetti burst                       | 1500ms   | `canvas-confetti` library                               |
| Streak milestone         | Pulsing glow + counter increment     | 2s loop  | Custom keyframes in Tailwind                            |
| Toast notification       | Slide up from bottom                 | 300ms    | shadcn `Sonner` (built-in)                              |
| Button press             | Scale down briefly                   | 100ms    | `active:scale-95 transition-transform`                  |
| Tab switch               | Underline slide                      | 200ms    | `framer-motion` `layoutId`                              |
| Loading spinner          | Continuous rotate                    | Infinite | `animate-spin` (Tailwind built-in)                      |
| Flashcard flip           | 3D Y-axis rotation                   | 400ms    | `framer-motion` `rotateY` with `perspective`            |
| Pull-to-refresh          | Spinner appears, content shifts down | 300ms    | Custom touch event handler                              |

### Animation Rules

- **Respect `prefers-reduced-motion`**: wrap in `motion.div` with `reducedMotion="user"` or use Tailwind `motion-reduce:transition-none`
- **Never block interaction**: animations are non-blocking (user can click through)
- **Consistent easing**: `ease-out` for enter animations, `ease-in` for exits, `spring` for bouncy elements
- **Performance budget**: no animation should exceed 16ms paint time (60fps target)

```tsx
// Page transition wrapper
import { motion, AnimatePresence } from 'framer-motion';

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
```

```tsx
// Node enter/exit animation
<motion.div
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  exit={{ scale: 0.8, opacity: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
  className="motion-reduce:transition-none"
>
  <NodeCard node={node} />
</motion.div>
```

### Mobile Behaviour

On mobile, keep animations short (≤ 200ms) to avoid perceived lag on lower-powered devices. Pull-to-refresh uses a custom touch event handler rather than CSS animations to ensure native-feeling responsiveness.

---

## 12. Empty States

**Inspired by: Todoist, Spotify, Notion** — ⭐⭐ MEDIUM PRIORITY

Every list, grid, and data view must have a thoughtful empty state when there's no content. Empty states are the user's first impression of a feature.

### Empty State Reference

| View                          | Illustration               | Headline                                          | CTA                                  |
| ----------------------------- | -------------------------- | ------------------------------------------------- | ------------------------------------ |
| Palace list (no palaces)      | 🏛️ Building illustration   | "Build your first Memory Palace"                  | "Create Palace" button               |
| Room list (empty palace)      | 🚪 Door illustration       | "Add rooms to organize your memories"             | "Add Room" button                    |
| Node list (empty room)        | 💭 Thought bubble          | "Place your first memory node"                    | "Add Node" button (or "Open Canvas") |
| Daily Review (no nodes yet)   | 📝 Clipboard illustration  | "Create some nodes first, then review them daily" | "Go to Palaces" link                 |
| Search (no results)           | 🔍 Magnifying glass        | "No memories match '{query}'"                     | "Try a different search" suggestion  |
| Games (no nodes to play with) | 🎮 Controller illustration | "You need at least 10 nodes to play games"        | "Create Nodes" link                  |
| Activity history (new user)   | 📊 Chart placeholder       | "Your activity will appear here as you learn"     | "Start Daily Review"                 |

### Implementation Pattern

```tsx
// apps/web/src/shared/components/EmptyState.tsx
interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>
      {action && (
        <Button className="w-full md:w-auto" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

### Mobile Behaviour

On mobile, empty states are full-width and vertically centred within the visible viewport. The CTA button is `w-full` to match the mobile full-width CTA pattern from §6.

---

## 13. Canvas-Specific UX Patterns

**Inspired by: Figma, Miro, Excalidraw** — ⭐⭐⭐ HIGH PRIORITY (canvas is the core feature)

Extends §2 with advanced canvas interaction patterns.

### Floating Contextual Toolbar

When one or more nodes are selected, a floating toolbar appears **above** the selection:

- Actions: Edit, Change Color, Duplicate, Connect, Delete
- Position: centered above the topmost selected node; shifts automatically if near the viewport edge
- Implementation: React Flow's `NodeToolbar` component or a custom React portal

```tsx
import { NodeToolbar, Position } from 'reactflow';

function MemoryNode({ data, selected }: NodeProps) {
  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="flex gap-1 bg-popover border rounded-lg shadow-lg p-1">
          <ToolbarButton icon={<Pencil />} label="Edit" onClick={data.onEdit} />
          <ToolbarButton icon={<Copy />} label="Duplicate" onClick={data.onDuplicate} />
          <ToolbarButton icon={<Trash2 />} label="Delete" onClick={data.onDelete} />
        </div>
      </NodeToolbar>
      {/* Node content */}
    </>
  );
}
```

### Multi-Select with Lasso

- Click and drag on an **empty canvas area** to draw a selection rectangle
- All nodes within the rectangle become selected
- `Shift+click` to add/remove individual nodes from the selection
- Batch operations on the selection: move group, delete group, change color, add tag
- Implementation: React Flow's built-in `selectionOnDrag` prop

```tsx
<ReactFlow
  selectionOnDrag={true}
  selectionMode={SelectionMode.Partial}
  multiSelectionKeyCode="Shift"
>
```

### Snap-to-Grid & Alignment Guides

- Optional snap-to-grid mode (toggle via toolbar or `G` key)
- Default grid: 20px spacing
- Dynamic alignment guides: green lines appear when a node edge or center aligns with another node
- Grid visual: subtle dot pattern on canvas background

```tsx
<ReactFlow
  snapToGrid={snapEnabled}
  snapGrid={[20, 20]}
>
```

### Right-Click Context Menu

- **Right-click on node**: Edit, Duplicate, Connect to…, Change Color, Add Tag, Delete
- **Right-click on edge**: Edit Label, Delete
- **Right-click on empty canvas**: Add Node Here, Paste, Fit View, Toggle Grid
- Implementation: shadcn `ContextMenu` component (Radix UI)

```tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/packages/ui/components/context-menu';

<ContextMenu>
  <ContextMenuTrigger asChild>
    <div className="react-flow__node-content">{/* node */}</div>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onClick={onEdit}>Edit</ContextMenuItem>
    <ContextMenuItem onClick={onDuplicate}>Duplicate</ContextMenuItem>
    <ContextMenuItem onClick={onDelete} className="text-destructive">
      Delete
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>;
```

### Undo/Redo System

- `Cmd+Z` undo, `Cmd+Shift+Z` redo
- Stack-based history: every node move, create, delete, and edit is recorded
- Yjs CRDT provides a built-in undo manager (`Y.UndoManager`)
- Visual feedback: toast notification "Undone: Deleted node 'X'" with a Redo action button

```tsx
import * as Y from 'yjs';
const undoManager = new Y.UndoManager(yNodesMap, { trackedOrigins: new Set(['local']) });

// Undo
undoManager.undo();
toast('Undone: Deleted node', {
  action: { label: 'Redo', onClick: () => undoManager.redo() },
});
```

### Fit-to-Content & Navigation

| Shortcut              | Action                    |
| --------------------- | ------------------------- |
| `F`                   | Fit all nodes in viewport |
| `Cmd + 0`             | Reset zoom to 100%        |
| `Cmd + +`             | Zoom in by 10%            |
| `Cmd + -`             | Zoom out by 10%           |
| Double-click mini-map | Zoom to that area         |

```tsx
import { useReactFlow } from 'reactflow';

function CanvasControls() {
  const { fitView, zoomTo, zoomIn, zoomOut } = useReactFlow();
  useHotkeys('f', () => fitView({ padding: 0.2 }), { scopes: 'canvas' });
  useHotkeys('meta+0', () => zoomTo(1), { scopes: 'canvas' });
  useHotkeys('meta+=', () => zoomIn(), { scopes: 'canvas' });
  useHotkeys('meta+-', () => zoomOut(), { scopes: 'canvas' });
}
```

### Mobile Behaviour

Context menus are replaced by **long-press** interactions on mobile (500ms hold triggers the action sheet). The floating contextual toolbar is shown as a bottom sheet with action buttons (`Sheet` with `side="bottom"`). Undo/redo is accessible via dedicated buttons in the mobile canvas toolbar (FAB radial menu). Snap-to-grid and alignment guides are desktop-only features.

---

## Design Inspiration

The UI patterns in this guide are inspired by [TalantulApp.com](https://talantulapp.com), a mobile-first interactive Bible study platform, adapted for the Memory Palace use case. Key patterns adopted: card-based dashboards, gamification UI, bottom navigation, and full-screen immersive game modes.

---

## Figma 2026 patterns we are adopting

Source: 15 Figma reference folders rasterized to `/tmp/figma-png/`; full analysis in [`docs/plans/IMPLEMENTATION_APP_PLAN_FIGMA.md`](../plans/IMPLEMENTATION_APP_PLAN_FIGMA.md).

- **Workspace switcher in sidebar header** (Design_2026, Sidebar_Tutorial): avatar/logo + name + email + chevron. Sets up future multi-workspace.
- **`Quick actions ⌘K` pinned row** (Design_2026, Sidebar_Tutorial): make the palette discoverable, not just shortcut-only.
- **Pill-selected nav + badges** (Design_2026, VibeCodedSaas): soft surface pill with `aria-current="page"`; `New` / count badges via `@memory-palace/ui` `Badge`.
- **KPI tile = number + caption + sparkline + delta chip** (DashboardUI, VibeCodedSaas, Micro_Dashboad): canonical bento tile shape.
- **Area chart with hover tooltip pill** (VibeCodedSaas "Chart Hover"): pure SVG, `currentColor`, no Recharts.
- **Concentric profit rings** (FintechDesign / Kole's Redesign): map to "Mastery by node level" — `Mastered / Familiar / Learning / New`.
- **Partial-arc donut** (Kole's "Line of Credit"): "due today / total" companion in practice stats.
- **Horizontal stepper across the top of journey** (VibeCoding_Results): desktop alternative to the vertical card stack; mobile stays vertical.
- **Search + quick-add grid + Create-X footer popover** (Design_2026 "Modal 1"): visual target for `CommandPalette`.
- **Mobile bottom-tab active circular indicator** (MobileUI, Tasty!): filled circle behind the active icon, not an underline.
- **Slide-to-confirm primitive** (SwipeAnimation_Mobile "Slide To Buy"): destructive confirms + Anki-style Easy answer on flashcards. framer-motion `drag="x"` only (consistent with `useSwipeNavigation`).
- **Soft warm hero card over tinted gradient** (Software_Sections, Flourish): marketing rhythm between cinematic plate sections.
- **`explore the interface »` overlap affordance** (Software_Sections Frame 1411067454): screenshot of the next section peeks above the fold with a small link cue.
- **Dashed-border empty states** (Design_2026 "Home — Empty", MobileUI "Home — Empty State"): dashed container + centered icon + single CTA.

## Anti-patterns observed

- **`Beginner/ColorsThatRuin`** — the cream + multi-color treatment demonstrates how a noisy accent palette destroys hierarchy. Validates our current OLED + restrained-accent direction. Product surfaces must continue to use `primary`/`accent`/`success`/`warning`; marketing-only accents stay ESLint-gated.
