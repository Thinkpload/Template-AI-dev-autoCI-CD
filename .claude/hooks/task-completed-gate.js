#!/usr/bin/env node
// TaskCompleted Quality Gate Hook
// Blocks task completion until quality checks pass.
// Runs after a task is marked as complete — validates the deliverable.
//
// Exit codes:
//   0 — pass (task completion allowed)
//   2 — block (task completion rejected, feedback returned)

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 5000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    const cwd = data.cwd || process.cwd();
    const issues = [];

    // Gate 1: TypeScript compilation check (if tsconfig exists)
    const tsconfigPath = path.join(cwd, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      try {
        execSync('npx tsc --noEmit 2>&1', {
          cwd,
          encoding: 'utf8',
          timeout: 45000,
          windowsHide: true
        });
      } catch (tscErr) {
        const output = (tscErr.stdout || '') + (tscErr.stderr || '');
        if (/error TS/i.test(output)) {
          issues.push(`TYPE ERRORS — compilation failed:\n${output.slice(0, 600)}`);
        }
      }
    }

    // Gate 2: Run full test suite
    const pkgPath = path.join(cwd, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.scripts && pkg.scripts.test) {
          try {
            execSync('npm test 2>&1', {
              cwd,
              encoding: 'utf8',
              timeout: 120000,
              windowsHide: true
            });
          } catch (testErr) {
            const output = (testErr.stdout || '') + (testErr.stderr || '');
            issues.push(`TESTS FAILING:\n${output.slice(0, 600)}`);
          }
        }
      } catch (e) {
        // package.json parse error — skip
      }
    }

    // Gate 3: Lint check
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.scripts && pkg.scripts.lint) {
          try {
            execSync('npm run lint 2>&1', {
              cwd,
              encoding: 'utf8',
              timeout: 30000,
              windowsHide: true
            });
          } catch (lintErr) {
            const output = (lintErr.stdout || '') + (lintErr.stderr || '');
            if (/error/i.test(output) && !/0 errors/i.test(output)) {
              issues.push(`LINT ERRORS:\n${output.slice(0, 400)}`);
            }
          }
        }
      } catch (e) {
        // Skip
      }
    }

    // Gate 4: Check for uncommitted changes (task should be committed)
    try {
      const status = execSync('git status --porcelain', {
        cwd,
        encoding: 'utf8',
        timeout: 10000,
        windowsHide: true
      }).trim();

      if (status) {
        const changedFiles = status.split('\n').length;
        issues.push(`UNCOMMITTED CHANGES: ${changedFiles} file(s) not committed. Commit your work before completing the task.`);
      }
    } catch (e) {
      // Skip git check
    }

    // Verdict
    if (issues.length > 0) {
      const feedback = {
        hookSpecificOutput: {
          hookEventName: 'TaskCompleted',
          additionalContext: `TASK COMPLETION BLOCKED — quality gates failed.\n\n${issues.join('\n\n')}\n\nFix these issues before marking the task as complete.`
        }
      };
      process.stdout.write(JSON.stringify(feedback));
      process.exit(2);
    }

    process.exit(0);
  } catch (e) {
    // Silent fail — never block on hook errors
    process.exit(0);
  }
});
