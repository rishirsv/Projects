import type { FC } from 'react';

type ErrorBannerProps = {
  message: string;
  onDismiss: () => void;
};

export const ErrorBanner: FC<ErrorBannerProps> = ({ message, onDismiss }) => (
  <div className="error-banner">
    <div>
      <strong>Something went wrong.</strong> {message}
    </div>
    <button onClick={onDismiss} style={{ marginTop: '12px', color: 'inherit', opacity: 0.8 }}>
      Dismiss
    </button>
  </div>
);
