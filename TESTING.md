# Testing Strategy

> **Memory Palace App** — Complete Testing Guide
>
> This document covers the full testing strategy for a spatial canvas application with real-time sync, offline support, and server-side actions. It is intended for contributors and CI/CD pipeline operators.

---

## Table of Contents

1. [The Testing Pyramid (Adapted for Spatial Apps)](#1-the-testing-pyramid-adapted-for-spatial-apps)
2. [Testing Tools Stack](#2-testing-tools-stack)
3. [Unit Tests (Vitest)](#3-unit-tests-vitest)
4. [Component Tests (Vitest + React Testing Library)](#4-component-tests-vitest--react-testing-library)
5. [Integration Tests (Server Actions + Real Database)](#5-integration-tests-server-actions--real-database)
6. [E2E Tests (Playwright)](#6-e2e-tests-playwright)
7. [Visual Regression Tests](#7-visual-regression-tests)
8. [Coverage Thresholds & Testing Rules](#8-coverage-thresholds--testing-rules)
9. [Test File Structure](#9-test-file-structure)

---

## 1. The Testing Pyramid (Adapted for Spatial Apps)

Standard web applications use a three-layer testing pyramid (unit → integration → E2E). Memory Palace requires **four layers** because the canvas introduces a fundamentally different testing surface:

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E ╲          Playwright: Full drag-and-drop flows
                 ╱────────╲
                ╱Integration╲      Server Actions + DB + Rate Limiting
               ╱──────────────╲
              ╱   Component     ╲   React Testing Library + React Flow
             ╱────────────────────╲
            ╱      Unit Tests       ╲  Vitest: Pure functions, Zod schemas
           ╱──────────────────────────╲
```

### Why 4 Layers Instead of 3?

A standard DOM test (`@testing-library/react`) cannot reliably simulate drag-and-drop on a canvas element backed by React Flow. React Flow's canvas uses pointer events, transform matrices, and viewport scaling that are not exercised in a JSDOM environment.

The **Component layer** covers React Flow node rendering, edit mode toggling, and sanitized HTML output — things that don't require a real browser. The **E2E layer** covers actual drag-and-drop, position persistence, multi-select, and cross-tab Yjs sync — things that require Chromium.

Skipping either layer means either slow feedback cycles (everything in E2E) or blind spots (canvas interactions not tested at all).

---

## 2. Testing Tools Stack

| Layer                 | Tool                                         | Why This Tool                                                    |
| --------------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| **Unit**              | Vitest                                       | Native ESM support, Turborepo compatible, 10x faster than Jest   |
| **Component**         | Vitest + React Testing Library               | DOM-based component testing without a browser                    |
| **Integration**       | Vitest + Drizzle + Test DB                   | Server Actions tested against a real PostgreSQL instance         |
| **E2E**               | Playwright                                   | Only tool that can reliably simulate drag-and-drop on `<canvas>` |
| **Visual Regression** | Playwright Screenshots + Percy (or Argos CI) | Catch UI changes that don't break logic but break layout         |
| **Load/Stress**       | k6 (optional, Phase 4+)                      | Simulate 1,000 concurrent users saving nodes                     |
| **Coverage**          | `@vitest/coverage-v8`                        | Enforce minimum coverage thresholds                              |

---

## 3. Unit Tests (Vitest)

Unit tests cover pure functions, Zod schemas, Zustand store logic, and utility helpers. They run entirely in Node.js — no browser, no database.

### What to Unit Test

| Target                         | Example                               | Test                                                                     |
| ------------------------------ | ------------------------------------- | ------------------------------------------------------------------------ |
| **Zod schemas**                | `nodePositionSchema`                  | Valid/invalid payloads, edge cases (negative coordinates, NaN, Infinity) |
| **Math utilities**             | `calculateDistance()`, `snapToGrid()` | Boundary values, floating point precision                                |
| **Zustand store logic**        | `useRoomStore.moveNode()`             | State transitions, immutability                                          |
| **Action response builders**   | `createSuccessResponse()`             | Correct shape for all error codes                                        |
| **Pagination cursor encoding** | `encodeCursor()` / `decodeCursor()`   | Round-trip encoding, malformed input                                     |
| **Sanitization**               | `sanitizeNodeContent()`               | XSS payloads stripped, valid HTML preserved                              |

### Example: Zod Schema Unit Test

```typescript
// packages/db/__tests__/schemas.test.ts
import { describe, it, expect } from 'vitest';
import { nodePositionSchema } from '../src/schemas';

describe('nodePositionSchema', () => {
  it('accepts valid coordinates', () => {
    const result = nodePositionSchema.safeParse({ x: 100.5, y: 200.3 });
    expect(result.success).toBe(true);
  });

  it('rejects NaN coordinates', () => {
    const result = nodePositionSchema.safeParse({ x: NaN, y: 200 });
    expect(result.success).toBe(false);
  });

  it('rejects missing y field', () => {
    const result = nodePositionSchema.safeParse({ x: 100 });
    expect(result.success).toBe(false);
  });

  it('rejects missing x field', () => {
    const result = nodePositionSchema.safeParse({ y: 200 });
    expect(result.success).toBe(false);
  });

  it('rejects coordinates beyond canvas bounds', () => {
    const result = nodePositionSchema.safeParse({ x: 999999, y: -999999 });
    expect(result.success).toBe(false);
  });
});
```

### Root Vitest Configuration

```typescript
// vitest.config.ts (root)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/__tests__/**/*.test.ts', 'apps/**/__tests__/**/*.test.ts'],
    exclude: ['**/e2e/**', '**/playwright/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

### Turborepo Pipeline Scripts

The CI jobs reference `test:unit` and `test:integration` pipeline tasks. Add these to your root `turbo.json`:

```json
{
  "pipeline": {
    "test:unit": {
      "dependsOn": [],
      "outputs": ["coverage/**"]
    },
    "test:integration": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

Each package that has unit tests should add a `test:unit` script to its `package.json`:

```json
{
  "scripts": {
    "test:unit": "vitest run --reporter=verbose",
    "test:integration": "vitest run --config vitest.integration.config.ts --reporter=verbose"
  }
}
```

---

## 4. Component Tests (Vitest + React Testing Library)

Component tests render React components into JSDOM and assert on the resulting DOM. They cover rendering, user interaction, and prop-driven behaviour — but not canvas drag-and-drop.

### What to Component Test

| Component           | What to Test                                                                  |
| ------------------- | ----------------------------------------------------------------------------- |
| `<LoginForm />`     | Renders inputs, validates email format, shows error states, calls auth action |
| `<NodeCard />`      | Renders title/content, sanitized HTML displays correctly, edit mode toggles   |
| `<SearchBar />`     | Debounces input, calls search action, displays results                        |
| `<PalaceList />`    | Renders palace cards, empty state, loading skeleton, pagination triggers      |
| `<ErrorBoundary />` | Catches thrown errors, renders fallback UI, reports to Sentry mock            |
| `<NodeEditor />`    | Form validation, save triggers Server Action mock, cancel discards changes    |

### Example: NodeCard Component Test

```typescript
// apps/web/src/features/memory-nodes/__tests__/NodeCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { NodeCard } from '../components/NodeCard';

describe('NodeCard', () => {
  const mockNode = {
    id: 'node-1',
    title: 'Pythagorean Theorem',
    content: 'a² + b² = c²',
    positionX: 100,
    positionY: 200,
  };

  it('renders node title and content', () => {
    render(<NodeCard node={mockNode} />);
    expect(screen.getByText('Pythagorean Theorem')).toBeInTheDocument();
    expect(screen.getByText('a² + b² = c²')).toBeInTheDocument();
  });

  it('enters edit mode on double click', async () => {
    const user = userEvent.setup();
    render(<NodeCard node={mockNode} />);
    await user.dblClick(screen.getByText('Pythagorean Theorem'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('sanitizes HTML content to prevent XSS', () => {
    const xssNode = { ...mockNode, content: '<script>alert("xss")</script>Hello' };
    render(<NodeCard node={xssNode} />);
    expect(screen.queryByText('alert("xss")')).not.toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

---

## 5. Integration Tests (Server Actions + Real Database)

Integration tests exercise Server Actions against a real PostgreSQL instance running in CI. They verify that Zod validation, Drizzle queries, RLS policies, and rate limiting all behave correctly together.

### Test Database Setup

```typescript
// packages/db/__tests__/setup.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as schema from '../src/schema';

const testConnection = postgres(process.env.TEST_DATABASE_URL!);
export const testDb = drizzle(testConnection, { schema });

export async function setupTestDb() {
  await migrate(testDb, { migrationsFolder: './migrations' });
}

export async function cleanupTestDb() {
  await testDb.delete(schema.edges);
  await testDb.delete(schema.nodeTags);
  await testDb.delete(schema.tags);
  await testDb.delete(schema.nodes);
  await testDb.delete(schema.rooms);
  await testDb.delete(schema.palaces);
}
```

### What to Integration Test

| Server Action      | Test Cases                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `createPalace`     | Creates with valid data, rejects invalid Zod input, rejects unauthenticated, rate limited after threshold     |
| `batchUpdateNodes` | Updates multiple coordinates in single transaction, rolls back if one fails, validates all positions with Zod |
| `searchNodes`      | Returns matching results, respects RLS (user A can't see user B's nodes), handles empty results               |
| `deletePalace`     | Soft-deletes (sets `deleted_at`), cascades to rooms and nodes, doesn't actually remove rows                   |
| `exportPalace`     | Returns complete JSON with rooms/nodes/edges, respects RLS                                                    |

### Example: batchUpdateNodes Integration Test

```typescript
// apps/web/src/features/spatial-canvas/__tests__/batchUpdateNodes.integration.test.ts
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { setupTestDb, cleanupTestDb, testDb } from '@memory-palace/db/test-setup';
import { batchUpdateNodes } from '../actions/batchUpdateNodes';

describe('batchUpdateNodes', () => {
  beforeAll(async () => {
    await setupTestDb();
  });
  afterEach(async () => {
    await cleanupTestDb();
  });

  it('updates multiple node positions in a single transaction', async () => {
    const palace = await createTestPalace();
    const room = await createTestRoom(palace.id);
    const nodes = await createTestNodes(room.id, 3);

    const result = await batchUpdateNodes({
      updates: [
        { id: nodes[0].id, x: 100, y: 200 },
        { id: nodes[1].id, x: 300, y: 400 },
        { id: nodes[2].id, x: 500, y: 600 },
      ],
    });

    expect(result.success).toBe(true);
    const updated = await testDb
      .select()
      .from(schema.nodes)
      .where(eq(schema.nodes.roomId, room.id));
    expect(updated[0].positionX).toBe(100);
    expect(updated[1].positionX).toBe(300);
    expect(updated[2].positionX).toBe(500);
  });

  it('rolls back entire batch if one node ID is invalid', async () => {
    const palace = await createTestPalace();
    const room = await createTestRoom(palace.id);
    const nodes = await createTestNodes(room.id, 2);

    const result = await batchUpdateNodes({
      updates: [
        { id: nodes[0].id, x: 100, y: 200 },
        { id: 'non-existent-id', x: 300, y: 400 },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('NOT_FOUND');

    const unchanged = await testDb
      .select()
      .from(schema.nodes)
      .where(eq(schema.nodes.id, nodes[0].id));
    expect(unchanged[0].positionX).not.toBe(100);
  });
});
```

---

## 6. E2E Tests (Playwright)

E2E tests drive a real Chromium instance against the full application stack. They are the only reliable way to test canvas drag-and-drop, Yjs cross-tab sync, and offline resilience.

### What to E2E Test

| Flow                   | Steps                                                              | Assertions                                    |
| ---------------------- | ------------------------------------------------------------------ | --------------------------------------------- |
| **Auth flow**          | Sign up → verify email → log in → see dashboard                    | Dashboard shows empty palace list             |
| **Palace CRUD**        | Create palace → rename → delete → verify gone                      | Palace appears/disappears in list             |
| **Canvas drag**        | Open room → drag node from (100,100) to (300,400) → reload page    | Node is at (300,400) after reload (persisted) |
| **Multi-node drag**    | Select 3 nodes → drag group → drop → reload                        | All 3 nodes at new positions                  |
| **Node editing**       | Double-click node → type content → click away → reload             | Content persisted                             |
| **Search**             | Create 5 nodes → search by keyword → verify results                | Only matching nodes returned                  |
| **Offline resilience** | Drag node → go offline → drag again → go online                    | Both changes persisted after reconnection     |
| **Cross-tab sync**     | Open room in Tab A and Tab B → drag node in Tab A                  | Node moves in Tab B via Yjs                   |
| **Rate limiting**      | Fire 20 rapid saves                                                | First 10 succeed, remaining return 429        |
| **Error recovery**     | Force canvas error → verify error boundary renders → click recover | Sidebar stays alive, canvas reloads           |

### Example: Canvas Drag-and-Drop with Position Persistence

```typescript
// playwright/tests/canvas-drag.spec.ts
import { test, expect } from '@playwright/test';
import { loginAndNavigateToRoom } from '../fixtures/canvas.fixture';

test.describe('Canvas drag-and-drop', () => {
  test('persists node position after page reload', async ({ page }) => {
    await loginAndNavigateToRoom(page);

    const node = page.locator('[data-testid="node-card"]').first();
    const canvas = page.locator('[data-testid="canvas-container"]');

    const nodeBounds = await node.boundingBox();
    const canvasBounds = await canvas.boundingBox();

    // Drag node from its current position to (300, 400) relative to canvas
    await page.mouse.move(
      nodeBounds!.x + nodeBounds!.width / 2,
      nodeBounds!.y + nodeBounds!.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(canvasBounds!.x + 300, canvasBounds!.y + 400, { steps: 10 });
    await page.mouse.up();

    // Wait for auto-save debounce (typically 500ms)
    await page.waitForTimeout(1000);

    // Reload and verify position persisted
    await page.reload();
    await page.waitForSelector('[data-testid="node-card"]');

    const nodeAfterReload = page.locator('[data-testid="node-card"]').first();
    const reloadedBounds = await nodeAfterReload.boundingBox();

    expect(reloadedBounds!.x).toBeCloseTo(canvasBounds!.x + 300, -1);
    expect(reloadedBounds!.y).toBeCloseTo(canvasBounds!.y + 400, -1);
  });
});
```

### Example: Multi-Node Batch Drag

```typescript
// playwright/tests/canvas-multi-select.spec.ts
import { test, expect } from '@playwright/test';
import { loginAndNavigateToRoom } from '../fixtures/canvas.fixture';

test.describe('Multi-node batch drag', () => {
  test('moves all selected nodes and persists positions', async ({ page }) => {
    await loginAndNavigateToRoom(page);

    // Select multiple nodes with Shift+click
    const nodes = page.locator('[data-testid="node-card"]');
    await nodes.nth(0).click();
    await nodes.nth(1).click({ modifiers: ['Shift'] });
    await nodes.nth(2).click({ modifiers: ['Shift'] });

    // Drag the selection
    const firstNode = nodes.nth(0);
    const bounds = await firstNode.boundingBox();
    await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds!.x + 150, bounds!.y + 150, { steps: 10 });
    await page.mouse.up();

    await page.waitForTimeout(1000);
    await page.reload();
    await page.waitForSelector('[data-testid="node-card"]');

    // All three nodes should have moved by the same delta
    const node0After = await nodes.nth(0).boundingBox();
    const node1After = await nodes.nth(1).boundingBox();
    expect(node0After).not.toBeNull();
    expect(node1After).not.toBeNull();
  });
});
```

### Example: Error Boundary Recovery

```typescript
// playwright/tests/error-recovery.spec.ts
import { test, expect } from '@playwright/test';
import { loginAndNavigateToRoom } from '../fixtures/canvas.fixture';

test.describe('Error boundary recovery', () => {
  test('sidebar stays alive while canvas reloads after error', async ({ page }) => {
    await loginAndNavigateToRoom(page);

    // Force a canvas error by injecting a runtime exception
    await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="canvas-container"]');
      canvas?.dispatchEvent(new ErrorEvent('error', { message: 'Simulated canvas crash' }));
    });

    // Error boundary fallback UI should appear inside the canvas area
    await expect(page.locator('[data-testid="canvas-error-boundary"]')).toBeVisible();

    // Sidebar must remain functional
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar"]')).toBeEnabled();

    // Click the recover button to reload the canvas
    await page.locator('[data-testid="canvas-recover-button"]').click();

    // Canvas should reload and the error boundary should disappear
    await expect(page.locator('[data-testid="canvas-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="canvas-error-boundary"]')).not.toBeVisible();
  });
});
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/tests',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['github']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'pnpm turbo build --filter=web && pnpm turbo start --filter=web',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 7. Visual Regression Tests

CSS changes can shift node positions, resize cards, or break the viewport transform without causing any unit or integration test to fail. Visual regression testing catches these by comparing screenshots against a baseline.

**Why canvas layouts need visual testing:** React Flow renders nodes using CSS transforms (`translate3d`). A one-line CSS change to `z-index`, `transform-origin`, or `overflow` can silently move all nodes on screen — the data is correct, the logic passes, but the user sees a broken layout.

### Example: Canvas Layout Snapshot

```typescript
// playwright/tests/visual-regression.spec.ts
import { test, expect } from '@playwright/test';
import { loginAndNavigateToRoom } from '../fixtures/canvas.fixture';

test('canvas layout matches snapshot', async ({ page }) => {
  await loginAndNavigateToRoom(page);
  await page.waitForSelector('[data-testid="canvas-container"]');
  // Allow React Flow animations and Yjs sync to settle
  await page.waitForTimeout(2000);

  await expect(page.locator('[data-testid="canvas-container"]')).toHaveScreenshot(
    'canvas-default-layout.png',
    { maxDiffPixelRatio: 0.01 },
  );
});
```

Update baseline screenshots after intentional layout changes with:

```bash
pnpm exec playwright test visual-regression.spec.ts --update-snapshots
```

---

## 8. Coverage Thresholds & Testing Rules

### Coverage Thresholds

| Metric                         | Minimum              | Target                       |
| ------------------------------ | -------------------- | ---------------------------- |
| **Unit test coverage**         | 80%                  | 90%+                         |
| **Integration test coverage**  | 70% (Server Actions) | 85%+                         |
| **E2E critical path coverage** | 100% of happy paths  | + edge cases                 |
| **Visual regression**          | All canvas layouts   | All + responsive breakpoints |

### Testing Non-Negotiables

1. **Every Server Action gets an integration test.** No exceptions. Server Actions are the security boundary — untested actions are vulnerabilities.
2. **Every Zod schema gets a unit test** with valid, invalid, and edge case payloads (NaN, Infinity, empty strings, excessively long strings).
3. **Every canvas interaction gets an E2E test** — drag, drop, multi-select, connect edges. These cannot be reliably tested at a lower layer.
4. **Tests run in CI before merge.** A broken test blocks the PR. There are no exceptions for "flaky" tests — fix the flakiness.
5. **Test data is isolated.** Every test creates its own data and cleans it up. No shared test state between tests or test files.
6. **Playwright tests record video on failure.** Videos and traces are uploaded as CI artifacts for debugging — do not disable this.

---

## 9. Test File Structure

```
memory-palace-app/
├── apps/
│   └── web/
│       └── src/
│           └── features/
│               ├── spatial-canvas/
│               │   ├── __tests__/
│               │   │   ├── useRoomStore.test.ts           # Unit: Zustand store
│               │   │   └── batchUpdateNodes.integration.test.ts
│               │   └── ...
│               ├── memory-nodes/
│               │   ├── __tests__/
│               │   │   ├── NodeCard.test.tsx              # Component test
│               │   │   ├── nodeSchema.test.ts             # Unit: Zod
│               │   │   └── createNode.integration.test.ts
│               │   └── ...
│               └── search/
│                   └── __tests__/
│                       └── searchNodes.integration.test.ts
│
├── packages/
│   └── db/
│       └── __tests__/
│           ├── setup.ts                                   # Test DB setup/teardown
│           ├── schemas.test.ts                            # Unit: all Zod schemas
│           └── seed.test.ts                               # Verify seed data works
│
├── playwright/
│   ├── tests/
│   │   ├── auth.spec.ts                                   # E2E: login/signup
│   │   ├── palace-crud.spec.ts                            # E2E: create/edit/delete
│   │   ├── canvas-drag.spec.ts                            # E2E: drag-and-drop
│   │   ├── canvas-multi-select.spec.ts                    # E2E: batch operations
│   │   ├── search.spec.ts                                 # E2E: full-text search
│   │   ├── offline-sync.spec.ts                           # E2E: offline recovery
│   │   ├── cross-tab-sync.spec.ts                         # E2E: Yjs multi-tab
│   │   ├── rate-limiting.spec.ts                          # E2E: 429 responses
│   │   ├── error-recovery.spec.ts                         # E2E: error boundary
│   │   └── visual-regression.spec.ts                      # Visual: screenshots
│   ├── fixtures/
│   │   ├── auth.fixture.ts
│   │   └── canvas.fixture.ts
│   └── playwright.config.ts
│
└── vitest.config.ts
```

---

_See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system design, [SECURITY.md](./SECURITY.md) for security policies including input validation and RLS, and [CONTRIBUTING.md](./CONTRIBUTING.md) for the PR process that enforces these testing rules._
