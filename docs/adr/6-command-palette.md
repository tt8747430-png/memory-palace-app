# ADR 6 — Command Palette & Global Keyboard Shortcuts

**Status:** Accepted  
**Phase:** 6  
**Date:** 2026-05-06

---

## Context

Phase 6 adds a universal command palette (`Cmd/Ctrl+K`) and a set of application-wide keyboard shortcuts. The aspirational roadmap specified `kbar` as the palette library and `react-hotkeys-hook` for shortcut registration.

Before choosing libraries, the criteria were:

| Criterion                                            | Weight |
| ---------------------------------------------------- | ------ |
| Active maintenance & community                       | High   |
| Bundle size                                          | High   |
| Integration with existing shadcn/Radix design system | High   |
| Sequential ("chord") shortcut support                | Medium |
| SSR / Next.js App Router compatibility               | High   |

---

## Decisions

### 1. `cmdk` instead of `kbar`

**Chosen:** `cmdk` (Paco Coursey, MIT)  
**Rejected:** `kbar`

`kbar` has had no meaningful release activity since 2022 and carries an incompatible React peer dependency for React 19. `cmdk` is the library that drives shadcn's `Command` component, is actively maintained, and integrates natively with the existing Radix + Tailwind design system already used throughout `@memory-palace/ui`. It requires no global provider and adds ~10 KB gzipped.

The `Command` primitive is added to `packages/ui/src/components/command.tsx` following the same pattern as the existing shadcn components (`dialog.tsx`, `sheet.tsx`, etc.) so it is consumable by any future package in the monorepo.

### 2. Custom event-listener hook instead of `react-hotkeys-hook`

**Chosen:** `useGlobalShortcuts` — a custom `useEffect` + `document.addEventListener` hook  
**Partially used:** `react-hotkeys-hook` (installed, available for future canvas-specific shortcuts)

The main challenge is **sequential ("chord") shortcuts** — `g → h`, `c → p`, `t → d`. `react-hotkeys-hook` v4 does not support keystroke sequences natively; all documented approaches require either a 3rd-party plugin or manual state tracking. Since the full shortcut map requires sequences, a hand-rolled state machine is simpler, more debuggable, and has zero additional runtime overhead.

The hook uses a **prefix-key state machine**:

- On first key (`g`, `c`, `t`) → arm a 1-second window
- On the next key within the window → dispatch the mapped action
- `Cmd/Ctrl+K` bypasses the machine and fires immediately (works inside inputs)
- All sequential shortcuts skip form elements (`INPUT`, `TEXTAREA`, `contenteditable`)

`react-hotkeys-hook` remains installed and should be used for canvas-local shortcuts in Phase 5 canvas components where single-key bindings (`F`, `G`, `Delete`) benefit from the library's scoping system.

### 3. Context architecture — `AppCommandProvider`

The palette requires two state atoms: `paletteOpen` and `overlayOpen`. Rather than a single monolithic context, these are split into `CommandPaletteContext` and `ShortcutsOverlayContext` to keep concerns separate and avoid unnecessary re-renders.

A thin composition component, `AppCommandProvider`, nests both providers, mounts the global shortcut hook via a dummy `GlobalShortcutsMount` child, and renders the two dialog portals (`CommandPalette`, `ShortcutsOverlay`). Server Components can render this as a direct child because it is a Client Component that accepts `children` as serializable JSX.

### 4. Mobile trigger

On viewports `< md`, the sidebar and `Cmd+K` are unavailable. A `CommandPaletteTrigger` button (search icon, `aria-label="Open command palette"`, `48×48 px` tap target) is placed in the mobile header. On `md+`, `CommandPaletteDesktopTrigger` appears in the sidebar footer as a pill-shaped button with the `⌘K` hint.

The `ShortcutsOverlay` is `hidden md:block` — it is not reachable on mobile as keyboard shortcuts are desktop-only per the UI style guide.

### 5. Action scope — no cross-feature imports

The palette defines navigation and tooling actions only. It does not import from `features/palaces` or any other feature. The "Create New Palace" action navigates to `/palaces?action=create`; the palaces page is responsible for reading that search param and opening the dialog (to be wired in a subsequent phase).

---

## Consequences

- **Positive:** Keyboard-driven workflows are now available for all navigation and theme toggling. The palette is extensible — any component inside `AppCommandProvider` can call `useCommandPalette().openPalette()` to open it programmatically.
- **Positive:** The `Command` UI primitive in `@memory-palace/ui` is reusable for future in-page search UIs (e.g. palace search, node search).
- **Deferred:** Canvas shortcuts (`Cmd+Z`, `Cmd+A`, `Cmd+D`, `Cmd+Shift+Z`) are scoped to the canvas and will be registered via `react-hotkeys-hook` inside the canvas feature in Phase 5C/5D.
- **Deferred:** Deep-link handling for `/palaces?action=create` (palette "Create New Palace") will be wired when the palaces page is next modified.
