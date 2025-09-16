import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';

type PrimaryCTAProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  isSticky?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>;

export function PrimaryCTA({
  label,
  onPress,
  disabled = false,
  loading = false,
  icon = 'sparkles',
  isSticky = false,
  ...buttonProps
}: PrimaryCTAProps) {
  const button = (
    <button
      type="button"
      className="button button-primary primary-cta"
      onClick={onPress}
      disabled={disabled}
      data-loading={loading}
      {...buttonProps}
    >
      <Icon name={icon} size={20} />
      <span>{loading ? 'Working…' : label}</span>
    </button>
  );

  if (isSticky) {
    return <div className="cta-sticky">{button}</div>;
  }

  return button;
}
