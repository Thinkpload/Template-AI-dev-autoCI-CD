import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardHeader } from '../DashboardHeader';

// Mock next/navigation for DashboardBreadcrumb
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
}));

// Mock useSidebar hook
vi.mock('@/hooks/useSidebar', () => ({
  useSidebar: vi.fn(() => ({
    open: false,
    setOpen: vi.fn(),
    triggerRef: { current: null },
  })),
}));

import { useSidebar } from '@/hooks/useSidebar';

describe('DashboardHeader', () => {
  it('renders the hamburger button with aria-label', () => {
    render(<DashboardHeader />);
    expect(screen.getByRole('button', { name: /open navigation menu/i })).toBeInTheDocument();
  });

  it('renders the breadcrumb navigation', () => {
    render(<DashboardHeader />);
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
  });

  it('calls setOpen(true) when hamburger is clicked', async () => {
    const setOpen = vi.fn();
    vi.mocked(useSidebar).mockReturnValue({
      open: false,
      setOpen,
      triggerRef: { current: null },
    });
    render(<DashboardHeader />);
    await userEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));
    expect(setOpen).toHaveBeenCalledWith(true, expect.anything());
  });

  it('renders header element', () => {
    render(<DashboardHeader />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
