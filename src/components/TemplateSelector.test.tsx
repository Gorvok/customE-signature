// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import TemplateSelector from './TemplateSelector';
import { templates } from '../templates';
import { defaultData } from '../data/defaults';
import { sampleData } from '../data/sampleData';

afterEach(cleanup);

describe('TemplateSelector', () => {
  it('offers every template, named and described', () => {
    render(<TemplateSelector selected="classic-dark" onSelect={vi.fn()} previewData={sampleData} />);
    for (const template of templates) {
      expect(screen.getByRole('button', { name: template.name }), template.id).toBeTruthy();
    }
  });

  it('marks the chosen one as pressed, and only that one', () => {
    render(<TemplateSelector selected="minimal" onSelect={vi.fn()} previewData={sampleData} />);
    const pressed = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressed).toHaveLength(1);
    expect(pressed[0]!.getAttribute('aria-label')).toBe('Minimal');
  });

  it('reports the template that was picked', () => {
    const onSelect = vi.fn();
    render(<TemplateSelector selected="classic-dark" onSelect={onSelect} previewData={sampleData} />);
    fireEvent.click(screen.getByRole('button', { name: 'Elegant' }));
    expect(onSelect).toHaveBeenCalledWith('elegant');
  });

  it('says when the thumbnails are showing sample details rather than the person’s own', () => {
    // Otherwise seven filled previews of a signature they never typed look
    // like the app has invented content.
    const { rerender } = render(
      <TemplateSelector selected="classic-dark" onSelect={vi.fn()} previewData={sampleData} showingSample />,
    );
    expect(screen.getByText(/sample details/)).toBeTruthy();

    rerender(<TemplateSelector selected="classic-dark" onSelect={vi.fn()} previewData={defaultData} />);
    expect(screen.queryByText(/sample details/)).toBeNull();
  });

  it('keeps the thumbnails out of the tab order, so they are not seven extra stops', () => {
    render(<TemplateSelector selected="classic-dark" onSelect={vi.fn()} previewData={sampleData} />);
    const frames = document.querySelectorAll('iframe');
    expect(frames.length).toBe(templates.length);
    for (const frame of frames) {
      expect(frame.getAttribute('tabindex')).toBe('-1');
      expect(frame.getAttribute('aria-hidden')).toBe('true');
    }
  });
});
