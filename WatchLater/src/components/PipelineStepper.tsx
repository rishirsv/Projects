import type { ReactNode } from 'react';
import { Icon } from './Icon';

type Step = {
  id: string;
  label: string;
  description: ReactNode;
};

type PipelineStepperProps = {
  steps: Step[];
  currentStage: number;
  status: 'idle' | 'processing' | 'complete' | 'error';
  errorStage?: number | null;
  busy?: boolean;
};

type StepStatus = 'complete' | 'active' | 'upcoming' | 'error';

export function PipelineStepper({ steps, currentStage, status, errorStage = null, busy = false }: PipelineStepperProps) {
  const getStepStatus = (index: number): StepStatus => {
    const stepPosition = index + 1;

    if (status === 'error' && errorStage === stepPosition) {
      return 'error';
    }

    if (status === 'complete' || currentStage > stepPosition) {
      return 'complete';
    }

    if (currentStage === stepPosition) {
      return status === 'processing' ? 'active' : 'complete';
    }

    return 'upcoming';
  };

  return (
    <div role="list" aria-busy={busy} className="pipeline-steps">
      {steps.map((step, index) => {
        const stepStatus = getStepStatus(index);
        const ariaCurrent = stepStatus === 'active' ? 'step' : undefined;
        return (
          <div
            key={step.id}
            role="listitem"
            className="pipeline-step"
            data-status={stepStatus}
            aria-current={ariaCurrent}
          >
            <div className="pipeline-step__status" aria-hidden>
              {stepStatus === 'complete' ? (
                <Icon name="checkmark.circle" size={18} />
              ) : stepStatus === 'error' ? (
                <Icon name="exclamationmark.triangle" size={18} />
              ) : (
                index + 1
              )}
            </div>
            <div>
              <div className="pipeline-step__label">{step.label}</div>
              <p className="pipeline-step__description">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
