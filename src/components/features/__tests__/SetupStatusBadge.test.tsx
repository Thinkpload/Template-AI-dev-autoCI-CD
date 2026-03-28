import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SetupStatusBadge } from '../SetupStatusBadge';

describe('SetupStatusBadge', () => {
  it('renders installed status with ✓ icon and label', () => {
    const { container } = render(<SetupStatusBadge status="installed" label="Better Auth" />);
    expect(screen.getByText('Better Auth')).toBeInTheDocument();
    expect(container.querySelector('[data-status="installed"]')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders installing status with ⋯ icon', () => {
    const { container } = render(<SetupStatusBadge status="installing" label="Prisma" />);
    expect(container.querySelector('[data-status="installing"]')).toBeInTheDocument();
    expect(screen.getByText('⋯')).toBeInTheDocument();
    expect(screen.getByText('Prisma')).toBeInTheDocument();
  });

  it('renders skipped status with — icon', () => {
    const { container } = render(<SetupStatusBadge status="skipped" label="Drizzle" />);
    expect(container.querySelector('[data-status="skipped"]')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('Drizzle')).toBeInTheDocument();
  });

  it('renders failed status with ✗ icon', () => {
    const { container } = render(<SetupStatusBadge status="failed" label="CodeQL" />);
    expect(container.querySelector('[data-status="failed"]')).toBeInTheDocument();
    expect(screen.getByText('✗')).toBeInTheDocument();
    expect(screen.getByText('CodeQL')).toBeInTheDocument();
  });

  it('renders label text for any status', () => {
    render(<SetupStatusBadge status="installed" label="Husky" />);
    expect(screen.getByText('Husky')).toBeInTheDocument();
  });

  it('has aria-hidden on the status icon span', () => {
    render(<SetupStatusBadge status="installed" label="Test" />);
    const icon = screen.getByText('✓');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('installed badge has green color class', () => {
    const { container } = render(<SetupStatusBadge status="installed" label="X" />);
    const badge = container.querySelector('[data-status="installed"]') as HTMLElement;
    expect(badge.className).toContain('text-green-400');
  });

  it('failed badge has red color class', () => {
    const { container } = render(<SetupStatusBadge status="failed" label="X" />);
    const badge = container.querySelector('[data-status="failed"]') as HTMLElement;
    expect(badge.className).toContain('text-red-400');
  });
});
