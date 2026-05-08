/**
 * NotificationManager - Handles toast notifications and custom alerts
 */

import { escapeHtml } from './utils.js';

export class NotificationManager {
  constructor() {
    this.container = this.createContainer();
  }

  /**
   * Create notification container if not exists
   */
  createContainer() {
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'notification-container';
      container.setAttribute('role', 'status');
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'false');
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Show a notification
   * @param message - The message to display
   * @param type - 'info', 'success', 'warning', 'error'
   * @param duration - Duration in ms
   * @param options - Optional callbacks: actionLabel, onAction, onDismiss
   */
  show(message, type = 'info', duration = 3000, options = {}) {
    const { actionLabel = '', onAction = null, onDismiss = null } = options;
    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;

    const icon = this.getIcon(type);

    notification.innerHTML = `
      <span class="notification-icon">${icon}</span>
      <span class="notification-message">${this.escapeHtml(message)}</span>
      ${actionLabel ? `<button class="notification-action">${this.escapeHtml(actionLabel)}</button>` : ''}
      <button class="notification-close" aria-label="Close">×</button>
    `;

    // Add to container
    this.container.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });

    // Setup removal
    let removed = false;
    const remove = (reason) => {
      if (removed) return;
      removed = true;
      notification.classList.remove('show');
      notification.addEventListener('transitionend', () => {
        if (notification.parentElement) {
          notification.remove();
        }
      });
      onDismiss?.(reason);
    };

    // Auto remove
    if (duration > 0) {
      setTimeout(() => remove('timeout'), duration);
    }

    // Click to close
    notification
      .querySelector('.notification-close')
      .addEventListener('click', () => remove('close'));

    const actionBtn = notification.querySelector('.notification-action');
    if (actionBtn) {
      actionBtn.addEventListener('click', () => {
        onAction?.();
        remove('action');
      });
    }
  }

  success(message, duration = 3000) {
    this.show(message, 'success', duration);
  }

  error(message, duration = 4000) {
    this.show(message, 'error', duration);
  }

  info(message, duration = 3000) {
    this.show(message, 'info', duration);
  }

  warning(message, duration = 3000) {
    this.show(message, 'warning', duration);
  }

  /**
   * Show a confirmation modal
   * @param message - Confirmation message
   * @param onConfirm - Callback when confirmed
   */
  confirm(message, onConfirm) {
    // Create modal elements dynamically or reuse existing one
    // For simplicity, we'll assume a generic confirmation modal exists in DOM
    // or we create a simple overlay here.
    // Let's create a dynamic one to be self-contained.

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.zIndex = '2000'; // Higher than other modals
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Confirmation');

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h2>Confirmation</h2>
          <button class="close-btn" aria-label="Close confirmation">×</button>
        </div>
        <div class="modal-body">
          <p>${this.escapeHtml(message)}</p>
          <div class="form-actions" style="margin-top: 1.5rem;">
            <button class="btn btn-secondary cancel-confirm">Cancel</button>
            <button class="btn btn-primary confirm-btn">Confirm</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Focus management — trap focus inside confirmation dialog
    const previousFocus = document.activeElement;
    const confirmBtn = modal.querySelector('.confirm-btn');
    const cancelBtn = modal.querySelector('.cancel-confirm');
    const closeBtn = modal.querySelector('.close-btn');

    const close = () => {
      modal.remove();
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
    };

    closeBtn.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);

    modal.querySelector('.confirm-btn').addEventListener('click', () => {
      onConfirm();
      close();
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    // Trap focus within the dialog
    const focusableEls = modal.querySelectorAll('button');
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Auto-focus the confirm button for keyboard users
    requestAnimationFrame(() => confirmBtn.focus());
  }

  getIcon(type) {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  }

  escapeHtml(text) {
    return escapeHtml(text);
  }
}
