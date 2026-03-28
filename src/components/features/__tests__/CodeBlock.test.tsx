import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeBlock } from '../CodeBlock';

describe('CodeBlock', () => {
  const mockWriteText = vi.fn();

  beforeEach(() => {
    mockWriteText.mockReset();
    mockWriteText.mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: mockWriteText },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the command text', () => {
    render(<CodeBlock command="npx create-ai-template" />);
    expect(screen.getByText('npx create-ai-template')).toBeInTheDocument();
  });

  it('renders the default $ prefix', () => {
    render(<CodeBlock command="npx create-ai-template" />);
    expect(screen.getByText('$')).toBeInTheDocument();
  });

  it('renders without prefix when prefix is empty string', () => {
    render(<CodeBlock command="npm install" prefix="" />);
    expect(screen.queryByText('$')).not.toBeInTheDocument();
  });

  it('has copy button with correct aria-label', () => {
    render(<CodeBlock command="npx create-ai-template" />);
    const button = screen.getByRole('button', { name: 'Copy command' });
    expect(button).toBeInTheDocument();
  });

  it('copies command to clipboard when button is clicked', async () => {
    render(<CodeBlock command="npx create-ai-template" />);
    const button = screen.getByRole('button', { name: 'Copy command' });

    await act(async () => {
      button.click();
      await Promise.resolve();
    });

    expect(mockWriteText).toHaveBeenCalledWith('npx create-ai-template');
  });

  it("shows '✓ Copied' feedback after clicking copy", async () => {
    const user = userEvent.setup();
    render(<CodeBlock command="npx create-ai-template" />);
    const button = screen.getByRole('button', { name: 'Copy command' });

    await user.click(button);

    expect(button).toHaveTextContent('✓ Copied');
  });

  it('resets copy button text after 2 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<CodeBlock command="npx create-ai-template" />);
    const button = screen.getByRole('button', { name: 'Copy command' });

    // Fire click without userEvent (fake timers incompatibility)
    await act(async () => {
      button.click();
      // Flush the promise from clipboard.writeText
      await Promise.resolve();
    });

    expect(button).toHaveTextContent('✓ Copied');

    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    expect(button).toHaveTextContent('Copy');
    vi.useRealTimers();
  });
});
