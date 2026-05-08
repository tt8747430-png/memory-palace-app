import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger } from '../src/js/modules/Logger.js';

describe('Logger', () => {
  beforeEach(() => {
    Logger.clearRing();
    Logger.setLevel('info'); // Reset to default
    vi.restoreAllMocks();
  });

  describe('level filtering', () => {
    it('logs messages at or above the minimum level', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      Logger.setLevel('info');
      Logger.info('visible');

      expect(spy).toHaveBeenCalledOnce();
    });

    it('drops messages below the minimum level', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      Logger.setLevel('info');
      Logger.debug('hidden');

      expect(spy).not.toHaveBeenCalled();
    });

    it('respects warn level filtering', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      Logger.setLevel('warn');
      Logger.info('hidden');
      Logger.warn('visible');

      expect(logSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledOnce();
    });
  });

  describe('console delegation', () => {
    it('delegates error level to console.error', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      Logger.error('test error');

      expect(spy).toHaveBeenCalledOnce();
      expect(spy.mock.calls[0][0]).toContain('[ERROR]');
    });

    it('delegates warn level to console.warn', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      Logger.warn('test warning');

      expect(spy).toHaveBeenCalledOnce();
      expect(spy.mock.calls[0][0]).toContain('[WARN]');
    });

    it('delegates info level to console.log', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      Logger.info('test info');

      expect(spy).toHaveBeenCalledOnce();
      expect(spy.mock.calls[0][0]).toContain('[INFO]');
    });

    it('includes context object when provided', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      Logger.error('fail', { code: 42 });

      expect(spy).toHaveBeenCalledWith(expect.any(String), { code: 42 });
    });

    it('does not include context when not provided', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      Logger.info('no context');

      // Should be called with just the message string, no second arg
      expect(spy.mock.calls[0]).toHaveLength(1);
    });
  });

  describe('ring buffer', () => {
    it('stores warn and error entries in the ring buffer', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});

      Logger.warn('warning 1');
      Logger.error('error 1');

      const entries = Logger.getRecentErrors();
      expect(entries).toHaveLength(2);
      expect(entries[0].level).toBe('warn');
      expect(entries[1].level).toBe('error');
    });

    it('does not store info or debug in the ring buffer', () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      Logger.setLevel('debug');
      vi.spyOn(console, 'debug').mockImplementation(() => {});

      Logger.debug('debug msg');
      Logger.info('info msg');

      expect(Logger.getRecentErrors()).toHaveLength(0);
    });

    it('getRecentErrors(count) returns the last N entries', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      for (let i = 0; i < 10; i++) {
        Logger.warn(`warning ${i}`);
      }

      const last3 = Logger.getRecentErrors(3);
      expect(last3).toHaveLength(3);
      expect(last3[0].message).toBe('warning 7');
      expect(last3[2].message).toBe('warning 9');
    });

    it('caps at 50 entries', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      for (let i = 0; i < 60; i++) {
        Logger.warn(`msg ${i}`);
      }

      expect(Logger.getRecentErrors()).toHaveLength(50);
      // First entry should be msg 10 (oldest 10 were shifted out)
      expect(Logger.getRecentErrors()[0].message).toBe('msg 10');
    });

    it('clearRing empties the buffer', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      Logger.error('err');
      expect(Logger.getRecentErrors()).toHaveLength(1);

      Logger.clearRing();
      expect(Logger.getRecentErrors()).toHaveLength(0);
    });
  });

  describe('exportAsNDJSON', () => {
    it('returns empty string when ring is empty', () => {
      expect(Logger.exportAsNDJSON()).toBe('');
    });

    it('returns valid newline-delimited JSON', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});

      Logger.warn('w1');
      Logger.error('e1', { detail: 'x' });

      const ndjson = Logger.exportAsNDJSON();
      const lines = ndjson.split('\n');
      expect(lines).toHaveLength(2);

      const parsed0 = JSON.parse(lines[0]);
      expect(parsed0.level).toBe('warn');
      expect(parsed0.message).toBe('w1');
      expect(parsed0.ts).toBeTruthy();

      const parsed1 = JSON.parse(lines[1]);
      expect(parsed1.level).toBe('error');
      expect(parsed1.context).toEqual({ detail: 'x' });
    });
  });

  describe('downloadLogs', () => {
    it('creates a downloadable NDJSON file', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      Logger.warn('download test');

      const mockUrl = 'blob:mock-url';
      const revokeUrl = vi.fn();
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => mockUrl),
        revokeObjectURL: revokeUrl,
      });

      const mockClick = vi.fn();
      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: mockClick,
      });

      Logger.downloadLogs();

      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(revokeUrl).toHaveBeenCalledWith(mockUrl);

      vi.unstubAllGlobals();
    });

    it('does nothing when ring is empty', () => {
      const spy = vi.spyOn(document, 'createElement');
      Logger.downloadLogs();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('debug level console delegation', () => {
    it('delegates debug level to console.debug', () => {
      Logger.setLevel('debug');
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      Logger.debug('debug msg');
      expect(spy).toHaveBeenCalledOnce();
      expect(spy.mock.calls[0][0]).toContain('[DEBUG]');
    });
  });

  describe('entry structure', () => {
    it('includes ISO timestamp in each entry', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      Logger.error('ts test');

      const entry = Logger.getRecentErrors()[0];
      expect(entry.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});
