import type { FC } from 'react';
import { CheckCircle, Circle, Loader2, Sparkles } from 'lucide-react';
import type { Stage } from '../types/summary';

type ProgressPipelineProps = {
  stages: Stage[];
  currentStage: number;
  status: 'idle' | 'processing' | 'complete' | 'error';
};

export const ProgressPipeline: FC<ProgressPipelineProps> = ({ stages, currentStage, status }) => {
  const isProcessing = status === 'processing';

  return (
    <section className="progress-card">
      <div className="progress-header">
        <div className="progress-title">
          {isProcessing ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} color="#46e0b1" />}
          <span>Processing pipeline</span>
        </div>
        {status === 'complete' && <span className="status-pill">✓ Summary saved</span>}
      </div>
      <div className="progress-grid">
        {stages.map((stage) => {
          const stepClass =
            currentStage === stage.id
              ? 'progress-step active'
              : currentStage > stage.id
                ? 'progress-step complete'
                : 'progress-step';

          return (
            <div key={stage.id} className={stepClass}>
              <div>
                {currentStage > stage.id ? (
                  <CheckCircle size={18} color="#46e0b1" />
                ) : currentStage === stage.id ? (
                  <Loader2 className="spin" size={18} color="#46e0b1" />
                ) : (
                  <Circle size={18} color="#524a6f" />
                )}
              </div>
              <h4>{stage.title}</h4>
              <p>{stage.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
