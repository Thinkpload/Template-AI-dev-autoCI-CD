import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorPage from '../error';

describe('ErrorPage', () => {
  it('renders error message in production mode', () => {
    render(<ErrorPage error={new Error('boom')} reset={vi.fn()} />);
    expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
  });

  it('renders "Try again" button', () => {
    render(<ErrorPage error={new Error('boom')} reset={vi.fn()} />);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls reset when "Try again" is clicked', async () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error('boom')} reset={reset} />);
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('has role="alert" and aria-live="assertive" on the card', () => {
    const { container } = render(<ErrorPage error={new Error('boom')} reset={vi.fn()} />);
    const alert = container.querySelector('[role="alert"][aria-live="assertive"]');
    expect(alert).toBeInTheDocument();
  });

  it('shows error digest when provided', () => {
    const error = Object.assign(new Error('boom'), { digest: 'abc123' });
    render(<ErrorPage error={error} reset={vi.fn()} />);
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });

  it('does not show digest element when digest is absent', () => {
    render(<ErrorPage error={new Error('boom')} reset={vi.fn()} />);
    expect(screen.queryByText(/error id/i)).not.toBeInTheDocument();
  });
});
