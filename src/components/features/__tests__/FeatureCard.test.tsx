import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureCard } from '../FeatureCard';

describe('FeatureCard', () => {
  it('renders icon, title, and description in sm variant', () => {
    render(
      <FeatureCard
        icon="🤖"
        title="Auto-Bugfix"
        description="CI failures auto-create issues"
        variant="sm"
      />
    );
    expect(screen.getByText('🤖')).toBeInTheDocument();
    expect(screen.getByText('Auto-Bugfix')).toBeInTheDocument();
    expect(screen.getByText('CI failures auto-create issues')).toBeInTheDocument();
  });

  it('uses sm variant (centered, flex-col) by default', () => {
    const { container } = render(<FeatureCard icon="🤖" title="Test" description="Desc" />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('flex-col');
    expect(card.className).toContain('items-center');
  });

  it('renders lg variant (horizontal layout with gap-5)', () => {
    const { container } = render(
      <FeatureCard icon="🤖" title="Test" description="Desc" variant="lg" />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('flex');
    expect(card.className).toContain('gap-5');
  });

  it('renders icon text content', () => {
    render(<FeatureCard icon="🚀" title="Deploy" description="One-click deploy" />);
    expect(screen.getByText('🚀')).toBeInTheDocument();
  });

  it('renders title as h3', () => {
    render(<FeatureCard icon="🔒" title="Security" description="Auth built-in" />);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Security');
  });

  it('renders description text', () => {
    render(<FeatureCard icon="🔒" title="Security" description="Auth and security built-in" />);
    expect(screen.getByText('Auth and security built-in')).toBeInTheDocument();
  });

  it('renders lg variant with the correct card border style', () => {
    const { container } = render(
      <FeatureCard icon="⚡" title="Speed" description="Fast by default" variant="lg" />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('rounded-xl');
    expect(card.className).toContain('border');
  });
});
