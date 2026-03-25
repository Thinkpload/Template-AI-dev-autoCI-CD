export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded">
        Skip to main content
      </a>
      <div id="main-content" className="text-center px-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-indigo-400 bg-clip-text text-transparent mb-4">
          Template BMAD + auto CI/CD
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          Run <code className="font-mono text-primary">npx create-ai-template</code> to set up your project
        </p>
        <p className="text-sm text-muted-foreground">
          Landing page coming in Story 3.1
        </p>
      </div>
    </main>
  );
}
