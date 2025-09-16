import type { ReactNode } from 'react';
import { Icon } from './Icon';

type ToastType = 'success' | 'error' | 'info';

type ToastProps = {
  type: ToastType;
  title: string;
  message?: ReactNode;
  onDismiss?: () => void;
};

export function Toast({ type, title, message, onDismiss }: ToastProps) {
  const role = type === 'error' ? 'alert' : 'status';

  return (
    <div className={`toast toast--${type}`} role={role} aria-live="polite">
      <div className="toast__title">{title}</div>
      {message ? <p className="toast__message">{message}</p> : null}
      {onDismiss ? (
        <div className="toast__actions">
          <button type="button" className="icon-button" onClick={onDismiss} aria-label="Dismiss notification">
            <Icon name="chevron.down" size={18} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
