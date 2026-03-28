import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GradientHero } from '../GradientHero';

describe('GradientHero', () => {
  it("renders with role='banner'", () => {
    render(<GradientHero />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders the gradient headline text', () => {
    render(<GradientHero />);
    expect(screen.getByText(/Production-Ready AI/i)).toBeInTheDocument();
  });

  it("renders the glow blob with aria-hidden='true'", () => {
    const { container } = render(<GradientHero />);
    const glowBlob = container.querySelector('[aria-hidden="true"]');
    expect(glowBlob).toBeInTheDocument();
  });

  it("renders the 'Use this template' CTA link", () => {
    render(<GradientHero ctaHref="https://example.com/template" />);
    const link = screen.getByRole('link', { name: /Use this template/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com/template');
  });

  it('renders the CodeBlock with npx command', () => {
    render(<GradientHero />);
    expect(screen.getByText('npx create-ai-template')).toBeInTheDocument();
  });

  it('renders the copy button inside CodeBlock', () => {
    render(<GradientHero />);
    expect(screen.getByRole('button', { name: 'Copy command' })).toBeInTheDocument();
  });
});
