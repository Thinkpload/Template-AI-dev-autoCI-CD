import { CodeBlock } from './CodeBlock';

interface GradientHeroProps {
  ctaHref?: string;
}

export function GradientHero({
  ctaHref = 'https://github.com/mad-one/template-bmad-auto-cicd',
}: GradientHeroProps) {
  return (
    <section
      role="banner"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0f0a1a] px-4 py-24 text-center"
    >
      {/* CSS radial-gradient glow blob — purely decorative */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.3) 0%, transparent 70%)',
        }}
      />

      {/* Badge chip */}
      <div className="mb-6 inline-flex items-center rounded-full border border-purple-900/50 bg-purple-950/50 px-4 py-1.5 text-sm text-purple-300">
        <span className="mr-2">🤖</span>
        Auto-bugfix CI/CD Pipeline
      </div>

      {/* Gradient headline */}
      <h1 className="mb-6 text-5xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
        <span className="bg-gradient-to-r from-purple-300 to-indigo-400 bg-clip-text text-transparent">
          Production-Ready AI
        </span>
        <br />
        <span className="bg-gradient-to-r from-purple-300 to-indigo-400 bg-clip-text text-transparent">
          Dev Template
        </span>
      </h1>

      {/* Subtext */}
      <p className="mb-4 max-w-2xl text-lg text-purple-300 md:text-xl">
        One command. BMAD agents, CI/CD pipeline, and auto-bugfix — all pre-configured.
      </p>
      <p className="mb-10 text-base text-purple-300/70">
        Built for developers who ship fast and break nothing.
      </p>

      {/* CodeBlock */}
      <div className="mb-10 w-full max-w-lg">
        <CodeBlock command="npx create-ai-template" prefix="$" />
      </div>

      {/* CTA */}
      <a
        href={ctaHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
      >
        Use this template
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </section>
  );
}
