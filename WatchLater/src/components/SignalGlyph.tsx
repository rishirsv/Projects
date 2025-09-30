import type { FC } from 'react';

export const SignalGlyph: FC<{ animated: boolean }> = ({ animated }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="signalGradient" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7f5bff" />
        <stop offset="1" stopColor="#46e0b1" />
      </linearGradient>
    </defs>
    <rect x="6" y="10" width="5" height="12" rx="2" fill="url(#signalGradient)" opacity="0.45" />
    <rect x="13.5" y="7" width="5" height="18" rx="2" fill="url(#signalGradient)" opacity="0.7" />
    <rect x="21" y="4" width="5" height="24" rx="2" fill="url(#signalGradient)" opacity="0.95" />
    <circle
      cx="16"
      cy="27"
      r="3"
      fill="#46e0b1"
      style={animated ? { filter: 'drop-shadow(0 0 8px rgba(70, 224, 177, 0.8))' } : undefined}
    />
  </svg>
);
