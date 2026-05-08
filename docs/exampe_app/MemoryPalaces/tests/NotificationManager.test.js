import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationManager } from '../src/js/modules/NotificationManager.js';

describe('NotificationManager', () => {
  let nm;

  beforeEach(() => {
    // Clean up any notification containers from previous tests
    document.body.innerHTML = '';
    nm = new NotificationManager();
  });

  describe('constructor / createContainer', () => {
    it('creates a notification container in the body', () => {
      const container = document.getElementById('notification-container');
      expect(container).toBeTruthy();
      expect(container.className).toBe('notification-container');
      expect(container.getAttribute('role')).toBe('status');
      expect(container.getAttribute('aria-live')).toBe('polite');
    });

    it('reuses existing container if present', () => {
      const nm2 = new NotificationManager();
      const containers = document.querySelectorAll('#notification-container');
      expect(containers).toHaveLength(1);
      expect(nm2.container).toBe(nm.container);
    });
  });

  describe('getIcon', () => {
    it('returns ✅ for success', () => {
      expect(nm.getIcon('success')).toBe('✅');
    });

    it('returns ❌ for error', () => {
      expect(nm.getIcon('error')).toBe('❌');
    });

    it('returns ⚠️ for warning', () => {
      expect(nm.getIcon('warning')).toBe('⚠️');
    });

    it('returns ℹ️ for info (default)', () => {
      expect(nm.getIcon('info')).toBe('ℹ️');
      expect(nm.getIcon('unknown')).toBe('ℹ️');
    });
  });

  describe('escapeHtml', () => {
    it('delegates to the shared utility', () => {
      expect(nm.escapeHtml('<b>test</b>')).not.toContain('<b>');
      expect(nm.escapeHtml('<b>test</b>')).toContain('test');
    });
  });

  describe('show', () => {
    it('creates a toast element with correct class and content', () => {
      nm.show('Hello world', 'success');
      const toast = nm.container.querySelector('.notification-toast');
      expect(toast).toBeTruthy();
      expect(toast.classList.contains('notification-success')).toBe(true);
      expect(toast.querySelector('.notification-message').textContent).toContain('Hello world');
      expect(toast.querySelector('.notification-icon').textContent).toBe('✅');
    });

    it('creates a close button that removes the toast', () => {
      nm.show('Closeable', 'info', 0);
      const toast = nm.container.querySelector('.notification-toast');
      const closeBtn = toast.querySelector('.notification-close');
      expect(closeBtn).toBeTruthy();

      closeBtn.click();
      // Should have removed the 'show' class
      expect(toast.classList.contains('show')).toBe(false);
    });

    it('calls onDismiss with reason when closed', () => {
      const onDismiss = vi.fn();
      nm.show('Dismiss test', 'info', 0, { onDismiss });

      const closeBtn = nm.container.querySelector('.notification-close');
      closeBtn.click();
      expect(onDismiss).toHaveBeenCalledWith('close');
    });

    it('auto-removes after duration', () => {
      vi.useFakeTimers();
      const onDismiss = vi.fn();
      nm.show('Auto remove', 'info', 1000, { onDismiss });

      vi.advanceTimersByTime(1000);
      expect(onDismiss).toHaveBeenCalledWith('timeout');
      vi.useRealTimers();
    });

    it('does not auto-remove when duration is 0', () => {
      vi.useFakeTimers();
      const onDismiss = vi.fn();
      nm.show('Persistent', 'info', 0, { onDismiss });

      vi.advanceTimersByTime(10000);
      expect(onDismiss).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('renders an action button when actionLabel is provided', () => {
      const onAction = vi.fn();
      nm.show('Action test', 'info', 0, { actionLabel: 'Undo', onAction });

      const actionBtn = nm.container.querySelector('.notification-action');
      expect(actionBtn).toBeTruthy();
      expect(actionBtn.textContent).toBe('Undo');

      actionBtn.click();
      expect(onAction).toHaveBeenCalled();
    });

    it('calls onDismiss with "action" when action button is clicked', () => {
      const onDismiss = vi.fn();
      nm.show('Action dismiss', 'info', 0, { actionLabel: 'Do it', onAction: vi.fn(), onDismiss });

      nm.container.querySelector('.notification-action').click();
      expect(onDismiss).toHaveBeenCalledWith('action');
    });

    it('does not render action button when actionLabel is empty', () => {
      nm.show('No action', 'info', 0);
      expect(nm.container.querySelector('.notification-action')).toBeNull();
    });

    it('prevents double removal', () => {
      const onDismiss = vi.fn();
      nm.show('Double remove', 'info', 0, { onDismiss });

      const closeBtn = nm.container.querySelector('.notification-close');
      closeBtn.click();
      closeBtn.click();
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('removes toast from DOM on transitionend', () => {
      nm.show('Transition test', 'info', 0);
      const toast = nm.container.querySelector('.notification-toast');

      // Trigger close
      toast.querySelector('.notification-close').click();

      // Fire transitionend
      toast.dispatchEvent(new Event('transitionend'));
      expect(nm.container.contains(toast)).toBe(false);
    });
  });

  describe('convenience methods', () => {
    it('success calls show with correct type', () => {
      const spy = vi.spyOn(nm, 'show');
      nm.success('Yay');
      expect(spy).toHaveBeenCalledWith('Yay', 'success', 3000);
    });

    it('error calls show with correct type', () => {
      const spy = vi.spyOn(nm, 'show');
      nm.error('Oops');
      expect(spy).toHaveBeenCalledWith('Oops', 'error', 4000);
    });

    it('info calls show with correct type', () => {
      const spy = vi.spyOn(nm, 'show');
      nm.info('FYI');
      expect(spy).toHaveBeenCalledWith('FYI', 'info', 3000);
    });

    it('warning calls show with correct type', () => {
      const spy = vi.spyOn(nm, 'show');
      nm.warning('Careful');
      expect(spy).toHaveBeenCalledWith('Careful', 'warning', 3000);
    });
  });

  describe('confirm', () => {
    it('creates a confirmation modal dialog', () => {
      nm.confirm('Are you sure?', vi.fn());
      const modal = document.querySelector('.modal.active');
      expect(modal).toBeTruthy();
      expect(modal.getAttribute('role')).toBe('dialog');
      expect(modal.getAttribute('aria-modal')).toBe('true');
      expect(modal.textContent).toContain('Are you sure?');
    });

    it('calls onConfirm when confirm button is clicked', () => {
      const onConfirm = vi.fn();
      nm.confirm('Confirm?', onConfirm);

      const confirmBtn = document.querySelector('.confirm-btn');
      confirmBtn.click();
      expect(onConfirm).toHaveBeenCalledOnce();
    });

    it('removes modal when cancel is clicked', () => {
      nm.confirm('Cancel test', vi.fn());
      const cancelBtn = document.querySelector('.cancel-confirm');
      cancelBtn.click();
      expect(document.querySelector('.modal.active')).toBeNull();
    });

    it('removes modal when close button is clicked', () => {
      nm.confirm('Close test', vi.fn());
      const closeBtn = document.querySelector('.close-btn');
      closeBtn.click();
      expect(document.querySelector('.modal.active')).toBeNull();
    });

    it('removes modal on outside click', () => {
      nm.confirm('Outside click', vi.fn());
      const modal = document.querySelector('.modal.active');
      modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      // Need target === modal
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: modal });
      modal.dispatchEvent(event);
      expect(document.querySelector('.modal.active')).toBeNull();
    });

    it('closes on Escape key', () => {
      nm.confirm('Escape test', vi.fn());
      const modal = document.querySelector('.modal.active');
      modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(document.querySelector('.modal.active')).toBeNull();
    });

    it('traps focus with Tab key', () => {
      nm.confirm('Focus trap', vi.fn());
      const modal = document.querySelector('.modal.active');
      const buttons = modal.querySelectorAll('button');
      const first = buttons[0];
      const last = buttons[buttons.length - 1];

      // Focus last, press Tab -> should wrap to first
      last.focus();
      modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

      // Focus first, press Shift+Tab -> should wrap to last
      first.focus();
      modal.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
      );
    });

    it('does not trap on non-Tab/Escape keys', () => {
      nm.confirm('Other key', vi.fn());
      const modal = document.querySelector('.modal.active');
      // Should not throw or do anything
      modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
      expect(document.querySelector('.modal.active')).toBeTruthy();
    });
  });
});
