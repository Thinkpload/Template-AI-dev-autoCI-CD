#!/usr/bin/env node
// TeammateIdle Quality Gate Hook
// Runs when an agent teammate finishes its work.
// Checks the agent's output for quality signals and can return exit code 2
// to send the task back with feedback.
//
// Exit codes:
//   0 — pass (teammate can idle)
//   2 — reject (task sent back to teammate with feedback via stdout)

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
    const teammate = data.teammate || {};
    const taskDescription = teammate.task_description || '';

    // Skip non-code tasks (research, planning, etc.)
    const codeTaskPatterns = [/implement/i, /fix/i, /create.*file/i, /write.*code/i, /refactor/i, /build/i, /dev/i];
    const isCodeTask = codeTaskPatterns.some(p => p.test(taskDescription));
    if (!isCodeTask) {
      process.exit(0);
    }

    const issues = [];

    // Gate 1: Check for uncommitted lint errors in staged/changed files
    try {
      const diffFiles = execSync('git diff --name-only HEAD', {
        cwd,
        encoding: 'utf8',
        timeout: 15000,
        windowsHide: true
      }).trim();

      if (diffFiles) {
        const changedTsFiles = diffFiles.split('\n').filter(f =>
          /\.(ts|tsx|js|jsx)$/.test(f) && fs.existsSync(path.join(cwd, f))
        );

        if (changedTsFiles.length > 0) {
          try {
            execSync('npm run lint --silent 2>&1', {
              cwd,
              encoding: 'utf8',
              timeout: 30000,
              windowsHide: true
            });
          } catch (lintErr) {
            const output = (lintErr.stdout || '') + (lintErr.stderr || '');
            // Only flag actual errors, not warnings
            if (/error/i.test(output) && !/0 errors/i.test(output)) {
              issues.push(`LINT ERRORS found in changed files. Fix before completing:\n${output.slice(0, 500)}`);
            }
          }
        }
      }
    } catch (e) {
      // git diff failed — skip lint gate
    }

    // Gate 2: Check that tests pass if test files were modified
    try {
      const diffFiles = execSync('git diff --name-only HEAD', {
        cwd,
        encoding: 'utf8',
        timeout: 10000,
        windowsHide: true
      }).trim();

      const hasTestChanges = diffFiles && diffFiles.split('\n').some(f =>
        /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f)
      );

      if (hasTestChanges) {
        try {
          execSync('npm test --silent 2>&1', {
            cwd,
            encoding: 'utf8',
            timeout: 60000,
            windowsHide: true
          });
        } catch (testErr) {
          const output = (testErr.stdout || '') + (testErr.stderr || '');
          issues.push(`TESTS FAILING. Fix before completing:\n${output.slice(0, 500)}`);
        }
      }
    } catch (e) {
      // Skip test gate on error
    }

    // Gate 3: Check for debug/TODO leftovers in changed files
    try {
      const diffContent = execSync('git diff HEAD', {
        cwd,
        encoding: 'utf8',
        timeout: 10000,
        windowsHide: true
      });

      const addedLines = diffContent.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));
      const debugPatterns = [
        /console\.log\(/,
        /debugger;/,
        /TODO:\s*HACK/i,
        /FIXME:\s*REMOVE/i
      ];

      const debugHits = addedLines.filter(line =>
        debugPatterns.some(p => p.test(line))
      );

      if (debugHits.length > 0) {
        issues.push(`DEBUG/HACK artifacts found in added code:\n${debugHits.slice(0, 5).map(l => l.slice(0, 120)).join('\n')}`);
      }
    } catch (e) {
      // Skip debug check on error
    }

    // Verdict
    if (issues.length > 0) {
      const feedback = {
        hookSpecificOutput: {
          hookEventName: 'TeammateIdle',
          additionalContext: `QUALITY GATE FAILED — sending task back to teammate.\n\n${issues.join('\n\n')}\n\nPlease fix these issues before marking the task as complete.`
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
