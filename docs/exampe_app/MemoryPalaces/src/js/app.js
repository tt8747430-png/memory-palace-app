import { PalaceManager } from './modules/PalaceManager.js';
import { UIController } from './modules/UIController.js';
import { EventHandlers } from './modules/EventHandlers.js';
import { PracticeManager } from './modules/PracticeManager.js';
import { ThemeManager } from './modules/ThemeManager.js';
import { NotificationManager } from './modules/NotificationManager.js';
import { SyncManager } from './modules/SyncManager.js';
import { Logger } from './modules/Logger.js';
import { initWebVitals } from './modules/WebVitals.js';
import { eventBus } from './modules/EventBus.js';
import { APP_VERSION } from './modules/version.js';
import './types.js'; // JSDoc @typedef definitions for IDE autocompletion

// Re-export for consumers that import from app.js
export { APP_VERSION };

// Initialize application
class App {
  constructor() {
    this.hasPendingRefresh = false;
    this._authChangeSeq = 0;
    this.syncManager = new SyncManager();
    this.themeManager = new ThemeManager();
    this.notificationManager = new NotificationManager();
    this.palaceManager = new PalaceManager(this.syncManager, this.notificationManager);
    this.practiceManager = new PracticeManager(this.syncManager, this.notificationManager);

    this.uiController = new UIController(
      this.palaceManager,
      this.practiceManager,
      this.notificationManager,
    );

    this.eventHandlers = new EventHandlers(
      this.palaceManager,
      this.uiController,
      this.themeManager,
      this.notificationManager,
      this.syncManager,
    );
  }

  init() {
    // Global error handlers — catch unhandled errors and promise rejections
    window.addEventListener('error', (event) => {
      Logger.error('Unhandled error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
      });
    });
    window.addEventListener('unhandledrejection', (event) => {
      Logger.error('Unhandled promise rejection', { reason: String(event.reason) });
    });

    // Online / offline indicators
    const announceStatus = () => {
      const live = document.getElementById('liveStatus');
      if (navigator.onLine) {
        live && (live.textContent = 'You are back online.');
        this.notificationManager.success('Back online ✓');
      } else {
        live && (live.textContent = 'You are offline. Changes are saved locally.');
        this.notificationManager.warning('You are offline — changes saved locally.');
      }
    };
    window.addEventListener('online', announceStatus);
    window.addEventListener('offline', announceStatus);

    // Render initial state
    this.uiController.renderPalaces();
    this._initScrollReveal();

    // Set up event listeners
    this.eventHandlers.init();

    // Observer pattern (Guide §2.3): UI auto-reacts to data changes via EventBus.
    // PalaceManager emits 'palaces:changed' on every mutation; this decouples
    // the data layer from the view layer.
    eventBus.on('palaces:changed', () => {
      this.uiController.renderPalaces();
      this._initScrollReveal();
    });

    // Hook into auth state changes to update UI and trigger sync
    this.syncManager.onAuthStateChange((user) => {
      void this._onAuthChange(user);
    });

    Logger.info('Memory Palace Manager initialized');

    // Collect Core Web Vitals (LCP, INP, CLS) for diagnostics
    initWebVitals();

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(
          (registration) => {
            Logger.info('ServiceWorker registered', { scope: registration.scope });
            this._watchForServiceWorkerUpdates(registration);
            registration.update().catch(() => null);
          },
          (err) => {
            Logger.error('ServiceWorker registration failed', { error: String(err) });
          },
        );
      });
    }
  }

  /**
   * Observe .reveal-up / .reveal-scale elements and add .revealed when visible.
   * Respects prefers-reduced-motion: skip entirely if user prefers reduced motion.
   */
  _initScrollReveal() {
    const forceRevealPending = () => {
      document
        .querySelectorAll('.reveal-up:not(.revealed), .reveal-scale:not(.revealed)')
        .forEach((el) => el.classList.add('revealed'));
    };

    // Skip if user prefers reduced motion (CSS already shows content instantly)
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      forceRevealPending();
      return;
    }
    // Skip if IntersectionObserver is not supported
    if (typeof IntersectionObserver === 'undefined') {
      forceRevealPending();
      return;
    }

    const targets = document.querySelectorAll(
      '.reveal-up:not(.revealed), .reveal-scale:not(.revealed)',
    );
    if (targets.length === 0) return;

    // Disconnect previous observer if any (re-render creates new elements)
    this._scrollObserver?.disconnect();

    this._scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            this._scrollObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    );

    targets.forEach((el) => this._scrollObserver.observe(el));

    // Immediately reveal elements already in viewport (above the fold).
    // Batch reads then writes to avoid layout thrashing (forced reflow per iteration).
    requestAnimationFrame(() => {
      const els = [...targets];
      // Phase 1 — read all rects in a single pass (one reflow)
      const rects = els.map((el) => el.getBoundingClientRect());
      // Phase 2 — write: add .revealed to visible elements
      els.forEach((el, i) => {
        const rect = rects[i];
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('revealed');
          this._scrollObserver?.unobserve(el);
        }
      });
    });
  }

  _watchForServiceWorkerUpdates(registration) {
    let refreshing = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    const promptForRefresh = (worker) => {
      if (!worker) return;

      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          if (this.hasPendingRefresh) return;
          this.hasPendingRefresh = true;

          this.notificationManager.show('A new version is ready.', 'info', 0, {
            actionLabel: 'Refresh',
            /* c8 ignore next 2 -- only reachable via live service worker interaction */
            onAction: () => {
              worker.postMessage({ type: 'SKIP_WAITING' });
            },
            /* c8 ignore next 4 */
            onDismiss: (reason) => {
              if (reason !== 'action') {
                this.hasPendingRefresh = false;
              }
            },
          });
        }
      });
    };

    if (registration.waiting) {
      promptForRefresh(registration.waiting);
    }

    registration.addEventListener('updatefound', () => {
      promptForRefresh(registration.installing);
    });
  }

  /** Called whenever Firebase auth state changes */
  async _onAuthChange(user) {
    const authChangeSeq = ++this._authChangeSeq;
    this._updateSyncUI(user);

    if (user) {
      const previousPalaces = this.palaceManager.getAllPalaces();
      const previousSessions = this.practiceManager.sessions;

      // Keep each account in its own localStorage namespace.
      this.palaceManager.setStorageScope(user.uid);
      this.practiceManager.setStorageScope(user.uid);
      this.uiController.setViewScope?.(user.uid);

      // First login on this device: seed scoped storage from current guest data.
      /* c8 ignore next 3 -- first-login migration: requires real localStorage scope switch */
      if (this.palaceManager.getAllPalaces().length === 0 && previousPalaces.length > 0) {
        this.palaceManager.replaceAll(previousPalaces);
      }

      /* c8 ignore next 5 */
      if (
        Object.keys(this.practiceManager.sessions).length === 0 &&
        Object.keys(previousSessions).length > 0
      ) {
        this.practiceManager.replaceSessions(previousSessions);
      }

      // User just signed in — run a full merge sync
      this.notificationManager.info('Syncing with cloud…');
      const result = await this.syncManager.fullSync(
        this.palaceManager.getAllPalaces(),
        this.practiceManager.sessions,
      );

      // Ignore stale async completion when auth changed again mid-sync.
      if (authChangeSeq !== this._authChangeSeq) return;

      if (result) {
        this.palaceManager.replaceAll(result.palaces);
        this.practiceManager.replaceSessions(result.sessions);
        this.uiController.renderPalaces();
        this._initScrollReveal();
        this.notificationManager.success('Cloud sync complete ✓');
      } else {
        /* c8 ignore next */
        this.notificationManager.error('Sync failed — check your connection.');
      }
      return;
    }

    // Signed out: return to guest-local data scope.
    this.palaceManager.setStorageScope('guest');
    this.practiceManager.setStorageScope('guest');
    this.uiController.setViewScope?.('guest');
    this.uiController.renderPalaces();
  }

  /** Update the sync button appearance based on auth state */
  _updateSyncUI(user) {
    const btn = document.getElementById('syncBtn');
    const label = document.getElementById('syncUserLabel');
    if (!btn) return;

    if (user) {
      btn.title = `Signed in as ${user.displayName || user.email} — click to sign out`;
      btn.setAttribute('aria-label', 'Sign out of cloud sync');
      btn.classList.add('sync-active');
      if (label) {
        label.textContent = user.displayName || user.email;
        label.classList.remove('hidden');
      }
    } else {
      btn.title = 'Sign in to sync across devices';
      btn.setAttribute('aria-label', 'Sign in to sync across devices');
      btn.classList.remove('sync-active');
      if (label) {
        label.textContent = '';
        label.classList.add('hidden');
      }
    }
  }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
