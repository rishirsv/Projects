import { memo } from 'react';
import type { ToastState } from '../hooks/useToast';

type ToastProps = {
  toast: ToastState | null;
};

const ToastComponent = ({ toast }: ToastProps) => {
  if (!toast) {
    return null;
  }

  return <div className={`toast ${toast.tone}`}>{toast.message}</div>;
};

export const Toast = memo(ToastComponent);
