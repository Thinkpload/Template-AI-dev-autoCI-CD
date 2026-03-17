// Node version guard — must be first executable code (before any require/import)
// tsup CJS output preserves source order, so this runs before all require() calls
const _nodeVer = process.versions.node;
const _nodeMajor = parseInt(_nodeVer.split('.')[0], 10);
if (_nodeMajor < 20) {
  process.stderr.write(
    `Error: create-ai-template requires Node.js 20 or higher. You are running v${_nodeVer}. Please upgrade: https://nodejs.org\n`
  );
  process.exit(1);
}

/**
 * create-ai-template — CLI entry point
 * Phase 2: wires runWizard + writeConfig + --yes flag
 */

// CJS-safe package.json version read (no import.meta.url in CJS)
const { version } = require('../package.json') as { version: string };

import { runWizard } from './wizard.js';
import { buildInitialConfig, readConfig, writeConfig } from './config.js';
import { runInstaller } from './installer.js';

const yesMode = process.argv.includes('--yes') || process.argv.includes('-y');

async function main(): Promise<void> {
  const selections = await runWizard(yesMode);
  const existingConfig = readConfig();
  const config = buildInitialConfig(selections, version);

  // Preserve already-installed records from previous runs (WIZ-04 / idempotency)
  if (existingConfig) {
    const installedRecords = existingConfig.modules.filter(m => m.installState === 'installed');
    config.modules = [...installedRecords, ...config.modules];
    config.createdAt = existingConfig.createdAt;
  }

  writeConfig(config);
  await runInstaller(selections, yesMode);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
