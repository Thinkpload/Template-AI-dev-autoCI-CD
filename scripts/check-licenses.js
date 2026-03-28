#!/usr/bin/env node
// scripts/check-licenses.js
// MIT license compliance checker — blocks GPL/AGPL dependencies
// Usage: node scripts/check-licenses.js [--json] [--production]

'use strict';

/* eslint-disable @typescript-eslint/no-require-imports */
const licenseChecker = require('license-checker');
const path = require('path');

const BLOCKED_LICENSES = [
  'GPL-2.0',
  'GPL-2.0-only',
  'GPL-2.0-or-later',
  'GPL-3.0',
  'GPL-3.0-only',
  'GPL-3.0-or-later',
  'AGPL-3.0',
  'AGPL-3.0-only',
  'AGPL-3.0-or-later',
  'LGPL-2.0',
  'LGPL-2.0-only',
  'LGPL-2.0-or-later',
  'LGPL-2.1',
  'LGPL-2.1-only',
  'LGPL-2.1-or-later',
  'LGPL-3.0',
  'LGPL-3.0-only',
  'LGPL-3.0-or-later',
];

/**
 * Check if a license string contains a blocked license.
 * Handles semicolon-separated multi-license strings (e.g., "MIT; GPL-2.0").
 * @param {string|null|undefined} licenseString
 * @returns {boolean}
 */
function isBlockedLicense(licenseString) {
  if (!licenseString || licenseString === 'UNLICENSED' || licenseString === '') {
    return true;
  }
  const licenses = licenseString.split(/[;,]/).map((l) => l.trim().replace(/[()]/g, ''));
  return licenses.some((l) => BLOCKED_LICENSES.includes(l));
}

/**
 * Run the license check using the provided checker instance.
 * Accepts checker as a parameter to enable unit testing with mocks.
 * @param {Object} options - Options to pass to license-checker
 * @param {Object} checker - license-checker module (defaults to real one)
 * @returns {Promise<{violations: Array<{package: string, license: string}>, all: Object}>}
 */
function runCheck(options, checker) {
  const checkerToUse = checker || licenseChecker;
  return new Promise((resolve, reject) => {
    checkerToUse.init(options, (err, packages) => {
      if (err) {
        reject(err);
        return;
      }

      const violations = [];
      for (const [pkg, info] of Object.entries(packages)) {
        const license = info.licenses || '';
        if (isBlockedLicense(license)) {
          violations.push({ package: pkg, license: license || 'UNLICENSED' });
        }
      }

      resolve({ violations, all: packages });
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const productionOnly = args.includes('--production');
  const startPath = path.resolve(__dirname, '..');

  const options = {
    start: startPath,
    production: productionOnly,
    excludePrivatePackages: true,
  };

  let result;
  try {
    result = await runCheck(options);
  } catch (err) {
    process.stderr.write(`Error running license check: ${err.message}\n`);
    process.exit(1);
  }

  const { violations, all } = result;

  if (jsonOutput) {
    process.stdout.write(
      JSON.stringify(
        {
          blocked: violations,
          total: Object.keys(all).length,
          violations: violations.length,
        },
        null,
        2
      )
    );
    process.stdout.write('\n');
  }

  if (violations.length > 0) {
    process.stderr.write(`\n❌ Blocked licenses found (${violations.length}):\n`);
    for (const v of violations) {
      process.stderr.write(`   ${v.package}: ${v.license}\n`);
    }
    process.stderr.write('\nThese licenses are incompatible with the MIT license policy.\n');
    process.exit(1);
  } else {
    process.stdout.write(
      `\n✅ All licenses MIT-compatible (${Object.keys(all).length} packages checked)\n`
    );
    process.exit(0);
  }
}

// Only run main() when executed directly (not when required in tests)
if (require.main === module) {
  main();
}

module.exports = { isBlockedLicense, runCheck, BLOCKED_LICENSES };
