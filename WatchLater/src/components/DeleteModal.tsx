import type { FC } from 'react';
import type { DeleteModalState } from '../types/summary';

type DeleteModalProps = {
  state: DeleteModalState;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
  onChangeInput: (value: string) => void;
  onToggleIncludeTranscripts?: (checked: boolean) => void;
  onToggleDeleteAllVersions?: (checked: boolean) => void;
};

export const DeleteModal: FC<DeleteModalProps> = ({
  state,
  error,
  onCancel,
  onConfirm,
  onChangeInput,
  onToggleIncludeTranscripts,
  onToggleDeleteAllVersions
}) => {
  if (state.mode === 'none') {
    return null;
  }

  const disabled = state.submitting;
  let heading: string;
  let description: string;

  if (state.mode === 'clearAll') {
    heading = 'Delete all summaries?';
    description = 'This removes every saved summary. Transcripts stay put unless you include them below.';
  } else if (state.mode === 'single') {
    heading = `Delete summary for "${state.title}"?`;
    description = state.deleteAllVersions
      ? 'This removes every saved summary for this video.'
      : 'This removes the most recent summary for this video.';
  } else {
    heading = 'Delete summary?';
    description = 'This removes the most recent summary for this video.';
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <h3>{heading}</h3>
        <p className="modal-description">{description}</p>

        {state.mode === 'clearAll' && (
          <label className="modal-checkbox">
            <input
              type="checkbox"
              checked={state.includeTranscripts}
              onChange={(event) => onToggleIncludeTranscripts?.(event.target.checked)}
              disabled={disabled}
            />
            Include transcripts (.txt)
          </label>
        )}

        {state.mode === 'single' && (
          <label className="modal-checkbox">
            <input
              type="checkbox"
              checked={state.deleteAllVersions}
              onChange={(event) => onToggleDeleteAllVersions?.(event.target.checked)}
              disabled={disabled}
            />
            Delete all saved versions for this video
          </label>
        )}

        <label className="modal-input-label">
          Type <span>DELETE</span> to confirm
          <input
            type="text"
            value={state.input}
            onChange={(event) => onChangeInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onConfirm();
              }
            }}
            disabled={disabled}
          />
        </label>

        {error && <div className="modal-error">{error}</div>}

        <div className="modal-actions">
          <button type="button" onClick={onCancel} disabled={disabled}>
            Cancel
          </button>
          <button
            type="button"
            className="modal-delete-button"
            onClick={onConfirm}
            disabled={disabled || state.input.trim().toUpperCase() !== 'DELETE'}
          >
            {disabled ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
