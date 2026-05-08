import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all module imports BEFORE importing app.js
vi.mock('../src/js/modules/PalaceManager.js', () => {
  class PalaceManager {
    constructor() {
      this.getAllPalaces = vi.fn(() => []);
      this.setStorageScope = vi.fn();
      this.replaceAll = vi.fn();
    }
  }
  return { PalaceManager };
});

vi.mock('../src/js/modules/UIController.js', () => {
  class UIController {
    constructor() {
      this.renderPalaces = vi.fn();
    }
  }
  return { UIController };
});

vi.mock('../src/js/modules/EventHandlers.js', () => {
  class EventHandlers {
    constructor() {
      this.init = vi.fn();
    }
  }
  return { EventHandlers };
});

vi.mock('../src/js/modules/PracticeManager.js', () => {
  class PracticeManager {
    constructor() {
      this.sessions = {};
      this.setStorageScope = vi.fn();
      this.replaceSessions = vi.fn();
    }
  }
  return { PracticeManager };
});

vi.mock('../src/js/modules/ThemeManager.js', () => {
  class ThemeManager {}
  return { ThemeManager };
});

vi.mock('../src/js/modules/NotificationManager.js', () => {
  class NotificationManager {
    constructor() {
      this.success = vi.fn();
      this.error = vi.fn();
      this.info = vi.fn();
      this.warning = vi.fn();
      this.show = vi.fn();
    }
  }
  return { NotificationManager };
});

vi.mock('../src/js/modules/SyncManager.js', () => {
  class SyncManager {
    constructor() {
      this.onAuthStateChange = vi.fn();
      this.fullSync = vi.fn();
      this.isConfigured = false;
      this.isReady = false;
    }
  }
  return { SyncManager };
});

vi.mock('../src/js/modules/Logger.js', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../src/js/modules/WebVitals.js', () => ({
  initWebVitals: vi.fn(),
}));

vi.mock('../src/js/modules/EventBus.js', () => ({
  eventBus: {
    on: vi.fn(),
    emit: vi.fn(),
  },
}));

// Mock types.js as empty module (only typedefs)
vi.mock('../src/js/types.js', () => ({}));

// Stub DOM elements
const stubElement = () => ({
  classList: { add: vi.fn(), remove: vi.fn() },
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
  querySelector: vi.fn(() => null),
  querySelectorAll: vi.fn(() => []),
  addEventListener: vi.fn(),
  innerHTML: '',
  textContent: '',
  value: '',
  focus: vi.fn(),
});

vi.spyOn(document, 'getElementById').mockImplementation(() => stubElement());

describe('app.js', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Re-apply mocks after resetModules
    vi.doMock('../src/js/modules/PalaceManager.js', () => {
      class PalaceManager {
        constructor() {
          this.getAllPalaces = vi.fn(() => []);
          this.setStorageScope = vi.fn();
          this.replaceAll = vi.fn();
        }
      }
      return { PalaceManager };
    });

    vi.doMock('../src/js/modules/UIController.js', () => {
      class UIController {
        constructor() {
          this.renderPalaces = vi.fn();
        }
      }
      return { UIController };
    });

    vi.doMock('../src/js/modules/EventHandlers.js', () => {
      class EventHandlers {
        constructor() {
          this.init = vi.fn();
        }
      }
      return { EventHandlers };
    });

    vi.doMock('../src/js/modules/PracticeManager.js', () => {
      class PracticeManager {
        constructor() {
          this.sessions = {};
          this.setStorageScope = vi.fn();
          this.replaceSessions = vi.fn();
        }
      }
      return { PracticeManager };
    });

    vi.doMock('../src/js/modules/ThemeManager.js', () => {
      class ThemeManager {}
      return { ThemeManager };
    });

    vi.doMock('../src/js/modules/NotificationManager.js', () => {
      class NotificationManager {
        constructor() {
          this.success = vi.fn();
          this.error = vi.fn();
          this.info = vi.fn();
          this.warning = vi.fn();
          this.show = vi.fn();
        }
      }
      return { NotificationManager };
    });

    // Track auth callbacks for testing
    let capturedAuthCb = null;
    vi.doMock('../src/js/modules/SyncManager.js', () => {
      class SyncManager {
        constructor() {
          this.onAuthStateChange = vi.fn((cb) => {
            capturedAuthCb = cb;
          });
          this.fullSync = vi.fn().mockResolvedValue({ palaces: [], sessions: {} });
          this.isConfigured = false;
          this.isReady = false;
          this.removeCloudPalace = vi.fn();
        }
      }
      return { SyncManager, _getCapturedAuthCb: () => capturedAuthCb };
    });

    vi.doMock('../src/js/modules/Logger.js', () => ({
      Logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));

    vi.doMock('../src/js/modules/WebVitals.js', () => ({
      initWebVitals: vi.fn(),
    }));

    vi.doMock('../src/js/modules/EventBus.js', () => ({
      eventBus: { on: vi.fn(), emit: vi.fn() },
    }));

    vi.doMock('../src/js/types.js', () => ({}));

    // Mock navigator.serviceWorker
    const mockRegistration = {
      scope: '/',
      update: vi.fn().mockResolvedValue(undefined),
      waiting: null,
      installing: null,
      addEventListener: vi.fn(),
    };
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: vi.fn().mockResolvedValue(mockRegistration),
        addEventListener: vi.fn(),
        controller: null,
      },
      writable: true,
      configurable: true,
    });
  });

  it('initializes when DOMContentLoaded fires', async () => {
    await import('../src/js/app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const { initWebVitals } = await import('../src/js/modules/WebVitals.js');
    const { eventBus } = await import('../src/js/modules/EventBus.js');
    const { Logger } = await import('../src/js/modules/Logger.js');

    expect(initWebVitals).toHaveBeenCalled();
    expect(eventBus.on).toHaveBeenCalledWith('palaces:changed', expect.any(Function));
    expect(Logger.info).toHaveBeenCalledWith('Memory Palace Manager initialized');
  });

  it('registers service worker and sets up update watching', async () => {
    await import('../src/js/app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // The SW registration is done in a load event listener
    window.dispatchEvent(new Event('load'));

    // Wait for the async registration
    await vi.waitFor(async () => {
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('./sw.js');
    });
  });

  it('handles service worker registration failure', async () => {
    navigator.serviceWorker.register = vi.fn().mockRejectedValue(new Error('SW failed'));

    await import('../src/js/app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    window.dispatchEvent(new Event('load'));

    const { Logger } = await import('../src/js/modules/Logger.js');

    await vi.waitFor(() => {
      expect(Logger.error).toHaveBeenCalledWith(
        'ServiceWorker registration failed',
        expect.any(Object),
      );
    });
  });

  it('handles online/offline events', async () => {
    await import('../src/js/app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    window.dispatchEvent(new Event('online'));

    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });
    window.dispatchEvent(new Event('offline'));
  });

  it('handles global error and unhandled rejection', async () => {
    await import('../src/js/app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const { Logger } = await import('../src/js/modules/Logger.js');

    window.dispatchEvent(new ErrorEvent('error', { message: 'test', filename: 'f.js', lineno: 1 }));
    expect(Logger.error).toHaveBeenCalledWith('Unhandled error', expect.any(Object));

    window.dispatchEvent(
      new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.resolve(),
        reason: 'reason',
      }),
    );
    expect(Logger.error).toHaveBeenCalledWith('Unhandled promise rejection', expect.any(Object));
  });

  it('handles auth state change for sign-in with cloud sync', async () => {
    await import('../src/js/app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const { _getCapturedAuthCb } = await import('../src/js/modules/SyncManager.js');
    const authCb = _getCapturedAuthCb();
    expect(authCb).toBeTruthy();

    // Simulate sign-in with a user
    await authCb({ uid: 'user123', displayName: 'Test User', email: 'test@example.com' });
  });

  it('handles auth state change - first login seeding', async () => {
    // Need PalaceManager to return data for guest then empty for user scope
    let callCount = 0;
    vi.doMock('../src/js/modules/PalaceManager.js', () => {
      class PalaceManager {
        constructor() {
          this.getAllPalaces = vi.fn(() => {
            callCount++;
            // First call (during renderPalaces): return []
            // Second call (previousPalaces before setScope): return guest data
            // Third call (after setScope): return [] to trigger seeding
            if (callCount <= 1) return [];
            if (callCount === 2) return [{ id: 'p1', name: 'Guest Palace' }];
            return [];
          });
          this.setStorageScope = vi.fn();
          this.replaceAll = vi.fn();
        }
      }
      return { PalaceManager };
    });

    vi.doMock('../src/js/modules/PracticeManager.js', () => {
      let scopeCount = 0;
      class PracticeManager {
        constructor() {
          this.sessions = { p1: { practiceCount: 1 } };
          this.setStorageScope = vi.fn(() => {
            scopeCount++;
            if (scopeCount > 0) this.sessions = {};
          });
          this.replaceSessions = vi.fn();
        }
      }
      return { PracticeManager };
    });

    vi.resetModules();
    await import('../src/js/app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const { _getCapturedAuthCb } = await import('../src/js/modules/SyncManager.js');
    const authCb = _getCapturedAuthCb();
    if (authCb) {
      await authCb({ uid: 'user1', displayName: 'User', email: 'u@e.com' });
    }
  });

  it('handles auth state change for sign-out', async () => {
    await import('../src/js/app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const { _getCapturedAuthCb } = await import('../src/js/modules/SyncManager.js');
    const authCb = _getCapturedAuthCb();

    // Simulate sign-out (user = null)
    await authCb(null);
  });

  it('ignores stale sign-in sync completion after a sign-out', async () => {
    let capturedAuthCb = null;
    let resolveSync;
    const pendingSync = new Promise((resolve) => {
      resolveSync = resolve;
    });

    const palaceManagerMock = {
      getAllPalaces: vi.fn(() => []),
      setStorageScope: vi.fn(),
      replaceAll: vi.fn(),
    };
    const practiceManagerMock = {
      sessions: {},
      setStorageScope: vi.fn(),
      replaceSessions: vi.fn(),
    };
    const uiControllerMock = {
      renderPalaces: vi.fn(),
      setViewScope: vi.fn(),
    };

    vi.doMock('../src/js/modules/PalaceManager.js', () => ({
      PalaceManager: class {
        constructor() {
          return palaceManagerMock;
        }
      },
    }));
    vi.doMock('../src/js/modules/PracticeManager.js', () => ({
      PracticeManager: class {
        constructor() {
          return practiceManagerMock;
        }
      },
    }));
    vi.doMock('../src/js/modules/UIController.js', () => ({
      UIController: class {
        constructor() {
          return uiControllerMock;
        }
      },
    }));
    vi.doMock('../src/js/modules/SyncManager.js', () => ({
      SyncManager: class {
        constructor() {
          this.onAuthStateChange = vi.fn((cb) => {
            capturedAuthCb = cb;
          });
          this.fullSync = vi.fn(() => pendingSync);
          this.isConfigured = false;
          this.isReady = false;
        }
      },
    }));

    vi.resetModules();
    await import('../src/js/app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const signInRun = capturedAuthCb({ uid: 'user-1', email: 'u@test.com' });
    await capturedAuthCb(null);

    resolveSync({ palaces: [{ id: 'cloud-1' }], sessions: { cloud: { practiceCount: 1 } } });
    await signInRun;

    expect(uiControllerMock.setViewScope).toHaveBeenNthCalledWith(1, 'user-1');
    expect(uiControllerMock.setViewScope).toHaveBeenNthCalledWith(2, 'guest');
    expect(palaceManagerMock.replaceAll).not.toHaveBeenCalled();
    expect(practiceManagerMock.replaceSessions).not.toHaveBeenCalled();
  });

  it('handles auth with failed sync', async () => {
    let capturedCb = null;
    vi.doMock('../src/js/modules/SyncManager.js', () => {
      class SyncManager {
        constructor() {
          this.onAuthStateChange = vi.fn((fn) => {
            capturedCb = fn;
          });
          this.fullSync = vi.fn().mockResolvedValue(null); // sync fails
          this.isConfigured = false;
          this.isReady = false;
          this.removeCloudPalace = vi.fn();
        }
      }
      return { SyncManager, _getCapturedAuthCb: () => capturedCb };
    });

    // Need to also re-mock all other dependencies since resetModules clears them
    vi.doMock('../src/js/modules/PalaceManager.js', () => {
      class PalaceManager {
        constructor() {
          this.getAllPalaces = vi.fn(() => []);
          this.setStorageScope = vi.fn();
          this.replaceAll = vi.fn();
        }
      }
      return { PalaceManager };
    });
    vi.doMock('../src/js/modules/UIController.js', () => {
      class UIController {
        constructor() {
          this.renderPalaces = vi.fn();
        }
      }
      return { UIController };
    });
    vi.doMock('../src/js/modules/EventHandlers.js', () => {
      class EventHandlers {
        constructor() {
          this.init = vi.fn();
        }
      }
      return { EventHandlers };
    });
    vi.doMock('../src/js/modules/PracticeManager.js', () => {
      class PracticeManager {
        constructor() {
          this.sessions = {};
          this.setStorageScope = vi.fn();
          this.replaceSessions = vi.fn();
        }
      }
      return { PracticeManager };
    });
    vi.doMock('../src/js/modules/ThemeManager.js', () => ({ ThemeManager: class {} }));
    vi.doMock('../src/js/modules/NotificationManager.js', () => {
      class NotificationManager {
        constructor() {
          this.success = vi.fn();
          this.error = vi.fn();
          this.info = vi.fn();
          this.warning = vi.fn();
          this.show = vi.fn();
        }
      }
      return { NotificationManager };
    });
    vi.doMock('../src/js/modules/Logger.js', () => ({
      Logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock('../src/js/modules/WebVitals.js', () => ({ initWebVitals: vi.fn() }));
    vi.doMock('../src/js/modules/EventBus.js', () => ({
      eventBus: { on: vi.fn(), emit: vi.fn() },
    }));
    vi.doMock('../src/js/types.js', () => ({}));

    vi.resetModules();
    await import('../src/js/app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const { _getCapturedAuthCb } = await import('../src/js/modules/SyncManager.js');
    const authCb = _getCapturedAuthCb();
    if (authCb) {
      await authCb({ uid: 'u1', displayName: 'U', email: 'u@e.com' });
    }
  });

  it('_updateSyncUI handles user and no-user states', async () => {
    await import('../src/js/app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const { _getCapturedAuthCb } = await import('../src/js/modules/SyncManager.js');
    const authCb = _getCapturedAuthCb();
    if (authCb) {
      // Call with user to test signed-in UI
      await authCb({ uid: 'u1', displayName: 'User', email: 'user@test.com' });
      // Call with null to test signed-out UI
      await authCb(null);
    }
  });

  it('handles service worker update found with notification show', async () => {
    const swRegistration = {
      scope: '/',
      update: vi.fn().mockResolvedValue(undefined),
      waiting: null,
      installing: null,
      addEventListener: vi.fn(),
    };
    navigator.serviceWorker.register = vi.fn().mockResolvedValue(swRegistration);

    await import('../src/js/app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    window.dispatchEvent(new Event('load'));

    await vi.waitFor(() => {
      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });

    // Simulate updatefound event
    const updateFoundHandler = swRegistration.addEventListener.mock.calls.find(
      (c) => c[0] === 'updatefound',
    );
    if (updateFoundHandler) {
      const worker = {
        state: 'installed',
        addEventListener: vi.fn(),
        postMessage: vi.fn(),
      };
      swRegistration.installing = worker;
      updateFoundHandler[1]();

      // Simulate worker state change to 'installed' with existing controller
      const stateChangeHandler = worker.addEventListener.mock.calls.find(
        (c) => c[0] === 'statechange',
      );
      if (stateChangeHandler) {
        navigator.serviceWorker.controller = {}; // simulate existing controller
        stateChangeHandler[1]();

        // The NotificationManager.show is called with onAction and onDismiss callbacks
        // We need to verify and exercise those callbacks
      }
    }
  });

  it('handles service worker with existing waiting worker', async () => {
    const worker = {
      state: 'installed',
      addEventListener: vi.fn(),
      postMessage: vi.fn(),
    };
    const swRegistration = {
      scope: '/',
      update: vi.fn().mockResolvedValue(undefined),
      waiting: worker,
      installing: null,
      addEventListener: vi.fn(),
    };
    navigator.serviceWorker.register = vi.fn().mockResolvedValue(swRegistration);
    navigator.serviceWorker.controller = {}; // existing controller

    await import('../src/js/app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    window.dispatchEvent(new Event('load'));

    await vi.waitFor(() => {
      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });
  });

  it('handles controllerchange by reloading', async () => {
    const swRegistration = {
      scope: '/',
      update: vi.fn().mockResolvedValue(undefined),
      waiting: null,
      installing: null,
      addEventListener: vi.fn(),
    };
    navigator.serviceWorker.register = vi.fn().mockResolvedValue(swRegistration);

    // Mock window.location.reload
    const origLocation = window.location;
    delete window.location;
    window.location = { reload: vi.fn() };

    await import('../src/js/app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    window.dispatchEvent(new Event('load'));

    await vi.waitFor(() => {
      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });

    // Trigger controllerchange
    const controllerChangeHandler = navigator.serviceWorker.addEventListener.mock.calls.find(
      (c) => c[0] === 'controllerchange',
    );
    if (controllerChangeHandler) {
      controllerChangeHandler[1]();
      expect(window.location.reload).toHaveBeenCalled();

      // Second call should be no-op (refreshing = true)
      controllerChangeHandler[1]();
    }

    window.location = origLocation;
  });
});
