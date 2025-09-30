import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastTone = 'success' | 'error';

export type ToastState = {
  message: string;
  tone: ToastTone;
};

export const useToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const dismissToast = useCallback(() => {
    setToast(null);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const showToast = useCallback((message: string, tone: ToastTone = 'success') => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setToast({ message, tone });

    timeoutRef.current = window.setTimeout(() => {
      dismissToast();
    }, 4000);
  }, [dismissToast]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { toast, showToast, dismissToast };
};
