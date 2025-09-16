import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedControl } from '../src/components/SegmentedControl';
import { PipelineStepper } from '../src/components/PipelineStepper';

describe('Accessibility primitives', () => {
  it('allows keyboard navigation through segmented control tabs', async () => {
    const segments = [
      { id: 'summaries', label: 'Summaries' },
      { id: 'pipeline', label: 'Pipeline' },
      { id: 'settings', label: 'Settings' },
    ];
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(
      <SegmentedControl
        segments={segments}
        value="summaries"
        onChange={handleChange}
        ariaLabel="Sections"
      />,
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);

    tabs[0].focus();
    await user.keyboard('{ArrowRight}');
    expect(handleChange).toHaveBeenLastCalledWith('pipeline');

    await user.keyboard('{End}');
    expect(handleChange).toHaveBeenLastCalledWith('settings');

    await user.keyboard('{ArrowLeft}');
    expect(handleChange).toHaveBeenLastCalledWith('pipeline');
  });

  it('marks the active pipeline stage with aria-current and completion statuses', () => {
    const steps = [
      { id: 'metadata', label: 'Metadata', description: 'Validate link' },
      { id: 'transcript', label: 'Transcript', description: 'Fetch captions' },
      { id: 'processing', label: 'AI Processing', description: 'Summarise content' },
      { id: 'save', label: 'Save', description: 'Store markdown' },
    ];

    render(
      <PipelineStepper
        steps={steps}
        currentStage={2}
        status="processing"
        errorStage={null}
      />,
    );

    const metadataStep = screen.getByText('Metadata').closest('[role="listitem"]');
    const transcriptStep = screen.getByText('Transcript').closest('[role="listitem"]');

    expect(metadataStep).toHaveAttribute('data-status', 'complete');
    expect(metadataStep).not.toHaveAttribute('aria-current');

    expect(transcriptStep).toHaveAttribute('aria-current', 'step');
    expect(transcriptStep).toHaveAttribute('data-status', 'active');
  });
});
