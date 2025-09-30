import { memo } from 'react';
import type { FormEvent, RefObject } from 'react';
import { ArrowRight, Clock, Loader2, Search, ShieldCheck, Sparkles } from 'lucide-react';

type HeroSectionProps = {
  isProcessing: boolean;
  isReturningUser: boolean;
  summaryCount: number;
  url: string;
  isSummarizeDisabled: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onUrlChange: (value: string) => void;
};

const HeroSectionComponent = ({
  isProcessing,
  isReturningUser,
  summaryCount,
  url,
  isSummarizeDisabled,
  inputRef,
  onSubmit,
  onCancel,
  onUrlChange
}: HeroSectionProps) => (
  <section className="hero-card">
    <div className="hero-topline">
      <Sparkles size={16} /> Instant AI summaries without uploads
    </div>
    <h1 className="hero-title">
      Learn faster with <span>Gemini-powered</span> recaps.
    </h1>
    <p className="hero-description">
      {isReturningUser
        ? `Welcome back! Your ${summaryCount} saved ${summaryCount === 1 ? 'summary is' : 'summaries are'} waiting in history.`
        : 'Paste any YouTube link and receive a richly formatted markdown summary in seconds. Your transcript stays on your machine—perfect for deep work and research workflows.'}
    </p>
    <form className="hero-form" onSubmit={onSubmit}>
      <label className="hero-input-wrapper">
        <Search size={18} className="hero-input-icon" />
        <input
          ref={inputRef}
          type="text"
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
          className="hero-input"
          disabled={isProcessing}
        />
        {isProcessing && (
          <button type="button" onClick={onCancel} className="hero-cancel">
            Cancel
          </button>
        )}
      </label>
      <button type="submit" className="hero-submit" disabled={isSummarizeDisabled}>
        {isProcessing ? <Loader2 className="spin" size={18} /> : <ArrowRight size={18} />}
        {isProcessing ? 'Working…' : 'Summarize video'}
      </button>
    </form>
    {/* Batch queue warning removed */}
    <div className="hero-proof-points">
      <span>
        <ShieldCheck size={16} color="#46e0b1" /> Private, local-first pipeline
      </span>
      <span>
        <Clock size={16} color="#7f5bff" /> Under 10 seconds per recap
      </span>
      <span>
        <Sparkles size={16} color="#46e0b1" /> {summaryCount} summaries saved
      </span>
    </div>
  </section>
);

export const HeroSection = memo(HeroSectionComponent);
