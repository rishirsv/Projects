import { forwardRef, type PropsWithChildren } from 'react';
import { Icon } from './Icon';

type AppHeaderProps = PropsWithChildren<{
  summaryCount: number;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onToggleTheme: () => void;
  theme: 'light' | 'dark';
  hasProcessing: boolean;
  className?: string;
}>;

export const AppHeader = forwardRef<HTMLElement, AppHeaderProps>(
  (
    {
      summaryCount,
      onRefresh,
      onOpenSettings,
      onToggleTheme,
      theme,
      hasProcessing,
      className = '',
      children,
    },
    ref,
  ) => {
    const themeLabel = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
    const summaryLabel = `${summaryCount} saved ${summaryCount === 1 ? 'summary' : 'summaries'}`;

    return (
      <header ref={ref} className={`app-header glass header--at-top ${className}`.trim()}>
        <div className="app-header__inner">
          <div className="app-header__brand" aria-label="WatchLater application header">
            <Icon name="sparkles" size={24} className="brand-mark" />
            <div>
              <span className="app-header__title">WatchLater</span>
              <div className="app-header__meta" aria-live="polite">
                <span>{summaryLabel}</span>
                {hasProcessing && <span className="badge">Processing</span>}
              </div>
            </div>
            <span className="app-header__title-large h-title-3" aria-hidden>
              WatchLater
            </span>
          </div>
          <div className="app-header__actions" aria-label="Header controls">
            <button
              type="button"
              className="icon-button"
              onClick={onToggleTheme}
              aria-label={themeLabel}
            >
              <Icon name={theme === 'light' ? 'moon' : 'sun'} size={20} />
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={onRefresh}
              aria-label="Refresh saved summaries"
            >
              <Icon name="refresh" size={20} />
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={onOpenSettings}
              aria-label="Open settings"
            >
              <Icon name="gear" size={20} />
            </button>
          </div>
        </div>
        {children ? <div className="app-header__children">{children}</div> : null}
      </header>
    );
  },
);

AppHeader.displayName = 'AppHeader';
