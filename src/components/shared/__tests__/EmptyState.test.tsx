import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No items yet" />);
    expect(screen.getByText('No items yet')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(<EmptyState title="No items" description="Add something to get started" />);
    expect(screen.getByText('Add something to get started')).toBeInTheDocument();
  });

  it('does not render description when omitted', () => {
    render(<EmptyState title="No items" />);
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('renders the CTA link with default label', () => {
    render(<EmptyState title="No items" />);
    expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
  });

  it('renders the CTA link with custom label and href', () => {
    render(<EmptyState title="No items" ctaLabel="Start now" ctaHref="/start" />);
    const link = screen.getByRole('link', { name: /start now/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/start');
  });

  it('renders decorative illustration with aria-hidden', () => {
    const { container } = render(<EmptyState title="No items" />);
    const illustration = container.querySelector('[aria-hidden="true"]');
    expect(illustration).toBeInTheDocument();
  });
});
