# Testing Patterns

**Analysis Date:** 2026-03-14

## Context

This is a pre-application SaaS template. No `src/` application test files exist yet. The
CI pipeline and SonarCloud are configured and functional. Testing conventions below reflect:
(1) the CI pipeline configuration in `.github/workflows/ci.yml`, (2) SonarCloud config in
`sonar-project.properties`, and (3) the intended test stack specified in
`research/RESEARCH-template-technologies.md`. GSD TDD methodology is documented in
`.claude/get-shit-done/references/tdd.md`.

## Test Framework

**Runner (intended):**
- Vitest v4 — native ESM/TypeScript/JSX support, no transpilation config needed
- Config file: `vitest.config.ts` (to be created at project root)
- Coverage provider: v8 (built-in)

**Assertion Library:**
- Vitest built-in `expect`
- Matchers: `toBe`, `toEqual`, `toThrow`, `toMatchObject`, `toHaveBeenCalledWith`
- React Testing Library: `@testing-library/react` + `@testing-library/jest-dom`

**Run Commands:**
```bash
npm test                     # Run all tests
npm test -- --watch          # Watch mode
npm run test:coverage        # Run tests + generate coverage report (lcov for SonarCloud)
```

The CI pipeline runs `npm run test:coverage` — the `test:coverage` script is the canonical
test command. Individual test files can be run via:
```bash
npm test -- path/to/file.test.ts
```

## Test File Organization

**Location:**
- Co-located alongside source files: `*.test.ts` / `*.test.tsx` next to the module they test
- No separate `tests/` or `__tests__/` directory at project root

**Naming:**
- Unit/integration: `module-name.test.ts`
- Component tests: `ComponentName.test.tsx`
- No `.spec.ts` suffix — use `.test.ts` consistently

**Structure:**
```
src/
  lib/
    utils.ts
    utils.test.ts
    logger.ts
    logger.test.ts
  components/
    Button.tsx
    Button.test.tsx
  app/
    api/
      users/
        route.ts
        route.test.ts
```

**SonarCloud inclusion:** Both `sonar.sources=src` and `sonar.tests=src` with
`sonar.test.inclusions=**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx`
ensure co-located tests are picked up correctly.

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ModuleName', () => {
  describe('functionName', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      // reset state per test
    });

    it('should handle valid input', () => {
      // arrange
      const input = createTestInput();

      // act
      const result = functionName(input);

      // assert
      expect(result).toEqual(expectedOutput);
    });

    it('should throw on invalid input', () => {
      expect(() => functionName(null)).toThrow('error message');
    });
  });
});
```

**Patterns:**
- Use `beforeEach` for per-test setup — avoid `beforeAll` unless setup is truly shared and read-only
- Use `afterEach` or `vi.restoreAllMocks()` in `beforeEach` to clean up mocks
- Arrange/act/assert comments required in complex tests
- One concept per test — multiple `expect` calls are fine if they assert the same behavior
- Descriptive `it` names: "should reject empty email", not "test1" or "handles error"
- Test behavior, not implementation — tests must survive refactors

## TDD Methodology

The GSD system enforces TDD for business logic via a Red-Green-Refactor cycle.
See `.claude/get-shit-done/references/tdd.md` for full spec.

**When to use TDD (create a TDD plan):**
- Business logic with defined inputs/outputs
- API endpoints with request/response contracts
- Data transformations, parsing, validation
- Algorithms and state machines

**When to skip TDD (add tests after):**
- UI layout, styling, visual components
- Configuration changes and glue code
- One-off scripts and migrations
- Simple CRUD with no business logic

**TDD commit pattern:**
```
test(08-02): add failing test for email validation
feat(08-02): implement email validation
refactor(08-02): extract regex to constant (optional)
```

## Mocking

**Framework:**
- Vitest built-in mocking (`vi` object)
- Module mocking via `vi.mock()` at top of test file (hoisted automatically)

**Patterns:**
```typescript
import { vi } from 'vitest';
import { sendEmail } from '@/lib/email';

// Mock entire module
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
}));

describe('UserService', () => {
  it('sends welcome email on signup', async () => {
    const mockSend = vi.mocked(sendEmail);
    mockSend.mockResolvedValue({ id: 'email-123' });

    await createUser({ email: 'user@example.com' });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@example.com' })
    );
  });
});
```

**What to Mock:**
- External HTTP/API calls (Stripe, Resend, Inngest)
- Database clients (`prisma`, `db`) in unit tests
- File system operations
- Time/dates: `vi.useFakeTimers()` + `vi.setSystemTime()`
- Environment variables: `vi.stubEnv('NODE_ENV', 'test')`

**What NOT to Mock:**
- Pure utility functions and string/array helpers
- Internal business logic being tested
- Zod validation schemas
- TypeScript types

## Fixtures and Factories

**Test Data Pattern:**
```typescript
// Factory function — define near usage or in a shared factories file
function createTestUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

// Use in tests
it('formats user display name', () => {
  const user = createTestUser({ name: 'Alice Smith' });
  expect(formatDisplayName(user)).toBe('Alice Smith');
});
```

**Location:**
- Simple factories: define inline in the test file
- Shared factories used across multiple test files: `src/tests/factories/` or `src/tests/fixtures/`
- Mock data: inline when trivial, factory function when 3+ fields or reused

## Coverage

**Requirements:**
- Target: 80% statements, 80% branches, 80% functions, 80% lines (per research spec)
- Enforcement: CI fails if coverage drops below thresholds
- Configure thresholds in `vitest.config.ts`:

```typescript
// vitest.config.ts (intended configuration)
export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text'],
      reportsDirectory: './coverage',
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

**Coverage report location:** `coverage/lcov.info` — consumed by SonarCloud via
`sonar.javascript.lcov.reportPaths=coverage/lcov.info` in `sonar-project.properties`.

**View coverage:**
```bash
npm run test:coverage
# Open coverage/index.html for HTML report (generated by lcov reporter)
```

**CI pipeline:** Coverage is generated and uploaded to SonarCloud in the same pipeline step:
```
npm run test:coverage → coverage/lcov.info → SonarSource/sonarcloud-github-action
```

## Test Types

**Unit Tests:**
- Test single function or component in isolation
- Mock all external dependencies (database, API calls, file system)
- Each test must complete in < 500ms
- Location: co-located `.test.ts` next to source

**Integration Tests:**
- Test multiple modules together with minimal mocking
- Mock only external service boundaries (Stripe, email, Redis)
- Use real Zod validation, real business logic
- May use an in-memory database or test database
- Location: co-located, distinguished by name: `user-flow.integration.test.ts`

**E2E Tests:**
- Framework: Playwright v1.57+ (config ships in template, browsers installed via `setup.sh`)
- Config file: `playwright.config.ts` at project root
- Location: `e2e/` directory separate from unit tests
- Tests full user flows against a running dev server
- Run with: `npx playwright test`
- Not run in the main CI `test:coverage` step — run separately in an `e2e` CI job

## Common Patterns

**Async Testing:**
```typescript
it('should create user in database', async () => {
  const user = await createUser({ email: 'alice@example.com' });
  expect(user.id).toBeDefined();
  expect(user.email).toBe('alice@example.com');
});
```

**Error Testing:**
```typescript
// Synchronous throws
it('should reject empty email', () => {
  expect(() => validateEmail('')).toThrow('Email is required');
});

// Async rejections
it('should fail on duplicate email', async () => {
  await createUser({ email: 'existing@example.com' });
  await expect(createUser({ email: 'existing@example.com' }))
    .rejects.toThrow('Email already exists');
});
```

**Environment Variable Testing:**
```typescript
it('uses configured API endpoint', () => {
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://myapp.com');
  expect(getApiUrl('/users')).toBe('https://myapp.com/users');
  vi.unstubAllEnvs();
});
```

**Component Testing:**
```typescript
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

it('calls onSubmit with form data', async () => {
  const handleSubmit = vi.fn();
  render(<LoginForm onSubmit={handleSubmit} />);

  await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

  expect(handleSubmit).toHaveBeenCalledWith({ email: 'user@example.com' });
});
```

**Snapshot Testing:**
- Not recommended — prefer explicit assertions
- If used, only for React components with stable, simple output
- Location: `__snapshots__/` next to test file (auto-generated by Vitest)

## CI Integration

The test pipeline runs in `.github/workflows/ci.yml` as:
```
Checkout → Setup Node 20 → npm ci → Lint → npm run test:coverage → SonarCloud Scan → Build
```

On test failure, the last 50 lines of `test.log` are posted to a GitHub Issue (label: `bug`)
for use by the `BUGFIX-CI-GITHUB-ISSUES` AI workflow.

**SonarCloud exclusions (from `sonar-project.properties`):**
```
sonar.exclusions=node_modules/**,coverage/**,_bmad/**,_bmad-output/**,.next/**,dist/**,build/**
```

---

*Testing analysis: 2026-03-14*
*Update when vitest.config.ts and first test files are added to src/*
