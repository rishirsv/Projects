import { useRef } from 'react';

type Segment = {
  id: string;
  label: string;
  badge?: string;
};

type SegmentedControlProps = {
  segments: Segment[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
};

export function SegmentedControl({ segments, value, onChange, ariaLabel }: SegmentedControlProps) {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const focusSegment = (index: number) => {
    const button = buttonsRef.current[index];
    button?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = (index + 1) % segments.length;
      onChange(segments[nextIndex].id);
      focusSegment(nextIndex);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex = (index - 1 + segments.length) % segments.length;
      onChange(segments[prevIndex].id);
      focusSegment(prevIndex);
    } else if (event.key === 'Home') {
      event.preventDefault();
      onChange(segments[0].id);
      focusSegment(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      const last = segments.length - 1;
      onChange(segments[last].id);
      focusSegment(last);
    }
  };

  return (
    <div role="tablist" aria-label={ariaLabel} className="segmented">
      {segments.map((segment, index) => {
        const isSelected = segment.id === value;
        return (
          <button
            key={segment.id}
            ref={(element) => {
              buttonsRef.current[index] = element;
            }}
            role="tab"
            type="button"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            className="segment"
            onClick={() => onChange(segment.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <span>{segment.label}</span>
            {segment.badge ? <span className="badge" aria-hidden>{segment.badge}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
