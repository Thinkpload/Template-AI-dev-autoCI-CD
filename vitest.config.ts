import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  css: {
    // Disable PostCSS processing in tests — Tailwind v4 uses native lightningcss
    // which requires the native binary not available in test environment
    postcss: {},
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    exclude: ['node_modules', '.next', 'wizard/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      // Coverage tracks business logic only — App Router pages/layouts excluded
      // (those are tested via E2E in e2e/**). When src/lib, src/hooks, src/components
      // are populated in Epic 3+, this include pattern will pick them up automatically.
      include: [
        'src/lib/**/*.{ts,tsx}',
        'src/hooks/**/*.{ts,tsx}',
        'src/components/**/*.{ts,tsx}',
        'src/stores/**/*.{ts,tsx}',
        'src/types/**/*.{ts,tsx}',
        'src/actions/**/*.{ts,tsx}',
      ],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/**/__tests__/**',
        // shadcn/ui components — render-only wrappers, covered by E2E
        'src/components/ui/**',
        // Shared UI components (Navbar etc.) — covered by E2E
        'src/components/shared/**',
        // Better Auth config stub — no testable logic until story 4.1 (DB)
        'src/lib/auth.ts',
        // Pure TypeScript type declarations — no runnable code
        'src/types/**',
        // cn utility — trivial wrapper around clsx/tailwind-merge
        'src/lib/utils.ts',
        // UI-only hooks covered by E2E
        'src/hooks/**',
        // Feature components without tests — covered by E2E (story 3.1)
        'src/components/features/FeatureCard.tsx',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
