import type { CSSProperties } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  History,
  MonitorSmartphone,
  MoonStar,
  RefreshCw,
  Settings,
  Sparkles,
  SunMedium,
  Trash2
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type IconName =
  | 'sparkles'
  | 'gear'
  | 'arrow.clockwise'
  | 'checkmark.circle'
  | 'exclamationmark.triangle'
  | 'download'
  | 'copy'
  | 'open'
  | 'trash'
  | 'history'
  | 'chevron.right'
  | 'chevron.down'
  | 'refresh'
  | 'sun'
  | 'moon'
  | 'monitor';

type IconProps = {
  name: IconName;
  label?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
};

const iconMap: Record<IconName, LucideIcon> = {
  sparkles: Sparkles,
  gear: Settings,
  'arrow.clockwise': RefreshCw,
  refresh: RefreshCw,
  'checkmark.circle': CheckCircle2,
  'exclamationmark.triangle': AlertTriangle,
  download: Download,
  copy: Copy,
  open: ChevronRight,
  trash: Trash2,
  history: History,
  'chevron.right': ChevronRight,
  'chevron.down': ChevronDown,
  sun: SunMedium,
  moon: MoonStar,
  monitor: MonitorSmartphone,
};

export function Icon({ name, label, size = 20, strokeWidth = 1.75, className = '', style }: IconProps) {
  const IconComponent = iconMap[name] ?? Sparkles;
  const iconClassName = ['icon', className].filter(Boolean).join(' ');
  const spanStyle: CSSProperties = {
    width: size,
    height: size,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  };
  const accessibilityProps = label
    ? { role: 'img' as const, 'aria-label': label }
    : { 'aria-hidden': true as const };

  return (
    <span className={iconClassName} style={spanStyle} {...accessibilityProps}>
      <IconComponent width={size} height={size} strokeWidth={strokeWidth} aria-hidden focusable="false" />
    </span>
  );
}
