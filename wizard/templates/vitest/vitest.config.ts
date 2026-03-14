// Compatible with vitest ^4.0.0 and @vitest/coverage-v8 ^4.0.0
// Review coverage API on major version bumps
// Output path coverage/lcov.info matches sonar-project.properties sonar.javascript.lcov.reportPaths
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      thresholds: {
        statements: 80,
        functions: 80,
        lines: 80,
        branches: 70,
      },
    },
  },
});
