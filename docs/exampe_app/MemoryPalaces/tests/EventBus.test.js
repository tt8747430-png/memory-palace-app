import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eventBus } from '../src/js/modules/EventBus.js';

describe('EventBus', () => {
  beforeEach(() => {
    eventBus.off(); // Clear all listeners between tests
  });

  describe('on / emit', () => {
    it('calls subscriber when event is emitted', () => {
      const spy = vi.fn();
      eventBus.on('test', spy);
      eventBus.emit('test');

      expect(spy).toHaveBeenCalledOnce();
    });

    it('passes data payload to subscriber', () => {
      const spy = vi.fn();
      eventBus.on('test', spy);
      eventBus.emit('test', { reason: 'create', id: '123' });

      expect(spy).toHaveBeenCalledWith({ reason: 'create', id: '123' });
    });

    it('supports multiple subscribers for the same event', () => {
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      eventBus.on('test', spy1);
      eventBus.on('test', spy2);
      eventBus.emit('test', 'data');

      expect(spy1).toHaveBeenCalledWith('data');
      expect(spy2).toHaveBeenCalledWith('data');
    });

    it('does not fire subscribers of different events', () => {
      const spy = vi.fn();
      eventBus.on('other', spy);
      eventBus.emit('test');

      expect(spy).not.toHaveBeenCalled();
    });

    it('does nothing when emitting event with no subscribers', () => {
      // Should not throw
      expect(() => eventBus.emit('nonexistent', { data: 1 })).not.toThrow();
    });
  });

  describe('unsubscribe', () => {
    it('returns an unsubscribe function', () => {
      const spy = vi.fn();
      const unsub = eventBus.on('test', spy);

      unsub();
      eventBus.emit('test');

      expect(spy).not.toHaveBeenCalled();
    });

    it('only unsubscribes the specific callback', () => {
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      const unsub1 = eventBus.on('test', spy1);
      eventBus.on('test', spy2);

      unsub1();
      eventBus.emit('test');

      expect(spy1).not.toHaveBeenCalled();
      expect(spy2).toHaveBeenCalledOnce();
    });
  });

  describe('once', () => {
    it('fires callback only once', () => {
      const spy = vi.fn();
      eventBus.once('test', spy);

      eventBus.emit('test', 'first');
      eventBus.emit('test', 'second');

      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith('first');
    });

    it('returns an unsubscribe function', () => {
      const spy = vi.fn();
      const unsub = eventBus.once('test', spy);

      unsub();
      eventBus.emit('test');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('removes all listeners for a specific event', () => {
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      eventBus.on('test', spy1);
      eventBus.on('test', spy2);

      eventBus.off('test');
      eventBus.emit('test');

      expect(spy1).not.toHaveBeenCalled();
      expect(spy2).not.toHaveBeenCalled();
    });

    it('removes all listeners when called with no arguments', () => {
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      eventBus.on('event-a', spy1);
      eventBus.on('event-b', spy2);

      eventBus.off();
      eventBus.emit('event-a');
      eventBus.emit('event-b');

      expect(spy1).not.toHaveBeenCalled();
      expect(spy2).not.toHaveBeenCalled();
    });

    it('does not affect other events when clearing a specific one', () => {
      const spyA = vi.fn();
      const spyB = vi.fn();
      eventBus.on('event-a', spyA);
      eventBus.on('event-b', spyB);

      eventBus.off('event-a');
      eventBus.emit('event-a');
      eventBus.emit('event-b');

      expect(spyA).not.toHaveBeenCalled();
      expect(spyB).toHaveBeenCalledOnce();
    });
  });

  describe('error handling', () => {
    it('catches errors in listeners without breaking other listeners', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const badListener = () => {
        throw new Error('listener crash');
      };
      const goodListener = vi.fn();

      eventBus.on('test', badListener);
      eventBus.on('test', goodListener);
      eventBus.emit('test');

      expect(goodListener).toHaveBeenCalledOnce();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
