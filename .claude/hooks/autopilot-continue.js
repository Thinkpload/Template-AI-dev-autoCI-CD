#!/usr/bin/env node
// Stop Hook — Autopilot Continuation
// After Claude finishes responding, if autopilot is active and there are
// remaining tasks, inject a reminder to continue working.
//
// This hook reads .planning/STATE.md to detect autopilot mode.
// The /autopilot command sets `autopilot: true` in STATE.md.

const fs = require('fs');
const path = require('path');

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    const cwd = data.cwd || process.cwd();

    // Check if autopilot flag exists in STATE.md
    const statePath = path.join(cwd, '.planning', 'STATE.md');
    if (!fs.existsSync(statePath)) {
      process.exit(0);
    }

    const stateContent = fs.readFileSync(statePath, 'utf8');

    // Look for autopilot: true or autopilot: active
    const autopilotMatch = stateContent.match(/autopilot:\s*(true|active|on)/i);
    if (!autopilotMatch) {
      process.exit(0);
    }

    // Check context monitor — don't continue if context is critical
    const os = require('os');
    const sessionId = data.session_id;
    if (sessionId) {
      const metricsPath = path.join(os.tmpdir(), `claude-ctx-${sessionId}.json`);
      if (fs.existsSync(metricsPath)) {
        try {
          const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
          if (metrics.remaining_percentage && metrics.remaining_percentage <= 25) {
            // Context critical — do not push to continue
            process.exit(0);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    // Extract current phase info for context
    const phaseMatch = stateContent.match(/current[_ ]phase:\s*(.+)/i);
    const phase = phaseMatch ? phaseMatch[1].trim() : 'unknown';

    const output = {
      hookSpecificOutput: {
        hookEventName: 'Stop',
        additionalContext:
          `AUTOPILOT ACTIVE (phase: ${phase}). ` +
          'You have remaining work in the current plan. ' +
          'Continue to the next task per .claude/rules/autopilot.md. ' +
          'If all tasks for the current deliverable are done, run the quality gate. ' +
          'If blocked, report and move to next independent task.'
      }
    };

    process.stdout.write(JSON.stringify(output));
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
