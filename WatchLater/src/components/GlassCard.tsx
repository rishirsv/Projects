import type { PropsWithChildren, ReactNode } from 'react';

type GlassCardProps = PropsWithChildren<{
  title?: string;
  description?: string;
  headingLevel?: 2 | 3 | 4;
  actions?: ReactNode;
  className?: string;
  as?: 'section' | 'article' | 'aside' | 'div';
  id?: string;
}>;

export function GlassCard({
  title,
  description,
  headingLevel = 3,
  actions,
  className = '',
  as: Component = 'section',
  children,
  id,
}: GlassCardProps) {
  const Heading = `h${headingLevel}` as keyof JSX.IntrinsicElements;
  const cardClass = ['glass', 'card', className].filter(Boolean).join(' ');

  return (
    <Component className={cardClass} id={id}>
      {title ? (
        <div className="card__header">
          <Heading className="h-title-3">{title}</Heading>
          {actions}
        </div>
      ) : null}
      {description ? <p className="small">{description}</p> : null}
      {children}
    </Component>
  );
}
