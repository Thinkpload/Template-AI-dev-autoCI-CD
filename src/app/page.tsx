import { GradientHero } from '@/components/features/GradientHero';
import { FeatureCard } from '@/components/features/FeatureCard';
import { Navbar } from '@/components/shared/Navbar';

const FEATURES = [
  {
    icon: '🤖',
    title: 'Auto-Bugfix Pipeline',
    description: 'CI failures auto-create issues and PRs to fix them',
  },
  {
    icon: '🚀',
    title: 'One-Click Deploy',
    description: 'Vercel + Neon deployment pre-configured out of the box',
  },
  {
    icon: '🔒',
    title: 'Auth + Security Built-in',
    description: 'Better Auth, security headers, CodeQL scanning included',
  },
];

export default function HomePage() {
  return (
    <>
      {/* Skip to main content for keyboard/screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <Navbar />

      <main id="main-content">
        {/* Hero */}
        <GradientHero ctaHref="https://github.com/mad-one/template-bmad-auto-cicd" />

        {/* Features section */}
        <section
          id="features"
          aria-labelledby="features-heading"
          className="bg-[#0f0a1a] px-4 py-24 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <h2
              id="features-heading"
              className="mb-4 text-center text-3xl font-bold text-purple-100 md:text-4xl"
            >
              Everything you need to ship
            </h2>
            <p className="mb-16 text-center text-purple-300">Stop configuring. Start building.</p>

            {/* 3-up on desktop, 1-up on mobile */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  variant="sm"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <footer className="border-t border-purple-900/30 bg-[#0f0a1a] py-12 text-center">
          <p className="text-sm text-purple-300/60">
            Built with BMAD + Next.js 15 + Tailwind CSS v4 &middot;{' '}
            <a
              href="https://github.com/mad-one/template-bmad-auto-cicd"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 underline-offset-4 hover:underline"
            >
              View on GitHub
            </a>
          </p>
        </footer>
      </main>
    </>
  );
}
