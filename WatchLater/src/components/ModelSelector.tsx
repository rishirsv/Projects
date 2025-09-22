import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useActiveModel } from '../hooks/use-active-model';

const ModelSelector: React.FC = () => {
  const { activeModelId, setActiveModelId, registry } = useActiveModel();
  const { options } = registry;

  if (options.length === 0) {
    return null;
  }

  return (
    <label className="model-selector" title="Choose summarization model">
      <span className="model-selector__caption">Model</span>
      <select
        className="model-selector__select"
        value={activeModelId}
        onChange={(event) => setActiveModelId(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="model-selector__chevron" aria-hidden="true" />
    </label>
  );
};

export default ModelSelector;
