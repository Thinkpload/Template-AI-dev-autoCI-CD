import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '../Sidebar';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from 'next/navigation';

describe('Sidebar', () => {
  it('renders nav with aria-label', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    render(<Sidebar />);
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });

  it('renders all nav items', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    render(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('sets aria-current="page" on the active link', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    render(<Sidebar />);
    const activeLink = screen.getByRole('link', { name: /dashboard/i });
    expect(activeLink).toHaveAttribute('aria-current', 'page');
  });

  it('does not set aria-current on inactive links', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    render(<Sidebar />);
    const settingsLink = screen.getByRole('link', { name: /settings/i });
    expect(settingsLink).not.toHaveAttribute('aria-current');
  });

  it('sets aria-current on settings link when on settings path', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard/settings');
    render(<Sidebar />);
    const settingsLink = screen.getByRole('link', { name: /settings/i });
    expect(settingsLink).toHaveAttribute('aria-current', 'page');
  });

  it('renders logo text', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    render(<Sidebar />);
    expect(screen.getByText('YourApp')).toBeInTheDocument();
  });
});
