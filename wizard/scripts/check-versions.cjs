#!/usr/bin/env node
/**
 * check-versions.cjs — weekly CI version drift detector
 *
 * Reads pinned versions from wizard/src/dependency-versions.ts,
 * resolves current @latest from npm registry, diffs, and outputs
 * changed=true to GitHub Actions if any version differs.
 *
 * Usage: node wizard/scripts/check-versions.cjs
 * Output: Sets GITHUB_OUTPUT changed=true|false
 */

'use strict';

const { execSync } = require('child_process');
const { readFileSync, writeFileSync, appendFileSync } = require('fs');
const { resolve } = require('path');

// Package name → constant name map
const PACKAGES = {
  '@bmad-method/bmad-agent': 'BMAD_VERSION',
  'husky': 'HUSKY_VERSION',
  'lint-staged': 'LINT_STAGED_VERSION',
  '@commitlint/cli': 'COMMITLINT_CLI_VERSION',
  '@commitlint/config-conventional': 'COMMITLINT_CONVENTIONAL_VERSION',
  'eslint': 'ESLINT_VERSION',
  'typescript-eslint': 'TYPESCRIPT_ESLINT_VERSION',
  'vitest': 'VITEST_VERSION',
  '@vitest/coverage-v8': 'VITEST_COVERAGE_V8_VERSION',
  'typescript': 'TYPESCRIPT_VERSION',
};

function getLatestVersion(pkg) {
  try {
    const version = execSync(`npm info ${pkg} version --json 2>/dev/null`, {
      encoding: 'utf-8',
      timeout: 10000,
    }).trim().replace(/"/g, '');
    return version;
  } catch {
    console.warn(`Warning: could not resolve version for ${pkg}`);
    return null;
  }
}

function setOutput(name, value) {
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    appendFileSync(githubOutput, `${name}=${value}\n`);
  }
  console.log(`::set-output name=${name}::${value}`);
}

const VERSIONS_FILE = resolve(__dirname, '../src/dependency-versions.ts');
let source;
try {
  source = readFileSync(VERSIONS_FILE, 'utf-8');
} catch {
  console.error(`Error: could not read ${VERSIONS_FILE}`);
  console.error('Run this script from the repository root after the wizard source has been generated.');
  setOutput('changed', 'false');
  process.exit(0);
}

let changed = false;
const changes = [];

for (const [pkg, constantName] of Object.entries(PACKAGES)) {
  const latestVersion = getLatestVersion(pkg);
  if (!latestVersion) continue;

  // Find the current pin for this constant (matches 'export const CONSTANT_NAME = 'value'')
  const pattern = new RegExp(`(export const ${constantName} = ')(\\^?[\\d.]+)(')`);
  const match = source.match(pattern);
  if (!match) continue;

  const currentPin = match[2];
  const latestClean = latestVersion.replace('^', '');
  const currentClean = currentPin.replace('^', '');

  if (currentClean !== latestClean) {
    console.log(`${pkg}: ${currentPin} → ${latestClean} (${constantName})`);
    source = source.replace(pattern, `$1${latestClean}$3`);
    changes.push(`${pkg}: ${currentPin} → ${latestClean}`);
    changed = true;
  }
}

if (changed) {
  writeFileSync(VERSIONS_FILE, source);
  console.log('\nChanges written to dependency-versions.ts:');
  changes.forEach(c => console.log(`  ${c}`));
  setOutput('changed', 'true');
} else {
  console.log('All versions up to date.');
  setOutput('changed', 'false');
}
