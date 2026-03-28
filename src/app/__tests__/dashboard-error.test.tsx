import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardError from '../dashboard/error';

describe('DashboardError', () => {
  it('renders error message in production mode', () => {
    render(<DashboardError error={new Error('boom')} reset={vi.fn()} />);
    expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
  });

  it('renders "Try again" button', () => {
    render(<DashboardError error={new Error('boom')} reset={vi.fn()} />);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls reset when "Try again" is clicked', async () => {
    const reset = vi.fn();
    render(<DashboardError error={new Error('boom')} reset={reset} />);
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('has role="alert" and aria-live="assertive" on the card', () => {
    const { container } = render(<DashboardError error={new Error('boom')} reset={vi.fn()} />);
    const alert = container.querySelector('[role="alert"][aria-live="assertive"]');
    expect(alert).toBeInTheDocument();
  });
});
