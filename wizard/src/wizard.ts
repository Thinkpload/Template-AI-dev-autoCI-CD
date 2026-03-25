// wizard/src/wizard.ts — CJS package, no ESM-only APIs

import {
  intro, outro, select, multiselect, isCancel, cancel, log
} from '@clack/prompts';
import { MODULE_REGISTRY } from './registry.js';
import { readConfig } from './config.js';
import type { UserSelections, AiMethodology, AgenticSystem, AuthProvider, OrmChoice, ModuleId } from './types.js';

// Direction C: warm/orange aesthetic — approximated with ANSI yellow (closest terminal color)
// Only apply ANSI codes when stdout is a TTY and NO_COLOR is not set.
// @clack/prompts does not strip codes from strings passed by the caller.
const _useColor = process.stdout.isTTY && !process.env['NO_COLOR'];
const ORANGE = _useColor ? '\x1b[33m' : '';
const RESET = _useColor ? '\x1b[0m' : '';
const BOLD = _useColor ? '\x1b[1m' : '';

export function validateConflicts(ids: ModuleId[]): string[] {
  const seen = new Set<string>();
  const errors: string[] = [];
  for (const id of ids) {
    const def = MODULE_REGISTRY[id];
    if (!def) continue;
    for (const cid of (def.conflicts ?? [])) {
      if (ids.includes(cid as ModuleId)) {
        const key = [id, cid].sort().join('|');
        if (!seen.has(key)) {
          seen.add(key);
          const conflictDef = MODULE_REGISTRY[cid as ModuleId];
          errors.push(
            `"${def.label}" conflicts with "${conflictDef?.label ?? cid}"`
          );
        }
      }
    }
  }
  return errors;
}

export async function runWizard(yesMode = false, version = ''): Promise<UserSelections> {
  intro(`${BOLD}${ORANGE}✦ create-ai-template${RESET}${version ? ` v${version}` : ''}\n  AI-native dev environment: BMAD + GSD + CI/CD in one setup`);

  const existingConfig = readConfig();
  const installedIds = (existingConfig?.modules ?? [])
    .filter(m => m.installState === 'installed')
    .map(m => m.id);

  // Notify user about already-installed modules (neutral info, not warning)
  for (const id of installedIds) {
    const mod = MODULE_REGISTRY[id as ModuleId];
    if (mod) log.info(`○ ${mod.label} already installed, skipping`);
  }

  const availableModules = Object.values(MODULE_REGISTRY)
    .filter(m => !installedIds.includes(m.id));

  // Q1: AI Methodology
  let aiMethodology: AiMethodology = 'both';
  if (!yesMode) {
    const result = await select({
      message: 'Which AI methodology would you like?',
      options: [
        {
          value: 'bmad' as AiMethodology,
          label: 'BMAD Method v6',
          hint: 'AI-driven development with agents, epics, and stories.\nBest for structured product development.',
        },
        {
          value: 'gsd' as AiMethodology,
          label: 'GSD Workflow Engine',
          hint: 'AI planning and execution framework.\nBest for fast, task-driven delivery.',
        },
        {
          value: 'both' as AiMethodology,
          label: 'Both BMAD + GSD [Recommended for most]',
          hint: 'Full stack AI methodology — plan with BMAD, execute with GSD.\nThe complete AI-native developer experience.',
        },
      ],
      initialValue: 'both' as AiMethodology,
    });
    if (isCancel(result)) { cancel('Setup cancelled.'); process.exit(0); }
    aiMethodology = result as AiMethodology;
  }

  // Q2: Agentic System
  let agenticSystem: AgenticSystem = 'claude-code';
  if (!yesMode) {
    const result = await select({
      message: 'Which agentic system do you use?',
      options: [
        {
          value: 'claude-code' as AgenticSystem,
          label: 'Claude Code [Recommended for most]',
          hint: 'Anthropic\'s AI coding agent with slash commands.\nDeep BMAD + GSD integration out of the box.',
        },
        {
          value: 'cursor' as AgenticSystem,
          label: 'Cursor',
          hint: 'AI-powered code editor with inline completions.\nWorks with BMAD agent prompts via .cursorrules.',
        },
        {
          value: 'vscode' as AgenticSystem,
          label: 'VS Code',
          hint: 'Standard editor with GitHub Copilot or similar.\nManual BMAD workflow — copy prompts as needed.',
        },
        {
          value: 'antigravity' as AgenticSystem,
          label: 'Antigravity (Google)',
          hint: 'Google\'s AI assistant using Claude as underlying model.\nCompatible with BMAD agent skill files.',
        },
      ],
      initialValue: 'claude-code' as AgenticSystem,
    });
    if (isCancel(result)) { cancel('Setup cancelled.'); process.exit(0); }
    agenticSystem = result as AgenticSystem;
  }

  // Q3: Auth Provider
  let authProvider: AuthProvider = 'better-auth';
  if (!yesMode) {
    const result = await select({
      message: 'Choose your auth provider:',
      options: [
        {
          value: 'better-auth' as AuthProvider,
          label: 'Better Auth [Recommended for most]',
          hint: 'Self-hosted, free, no vendor lock-in.\nFull control over your user data.',
        },
        {
          value: 'clerk' as AuthProvider,
          label: 'Clerk',
          hint: 'Managed service, faster initial setup.\nFree tier limited; paid at scale.',
        },
      ],
      initialValue: 'better-auth' as AuthProvider,
    });
    if (isCancel(result)) { cancel('Setup cancelled.'); process.exit(0); }
    authProvider = result as AuthProvider;
  }

  // Q4: ORM Choice
  let ormChoice: OrmChoice = 'prisma';
  if (!yesMode) {
    const result = await select({
      message: 'Choose your ORM:',
      options: [
        {
          value: 'prisma' as OrmChoice,
          label: 'Prisma [Recommended for most]',
          hint: 'Schema-first, visual Studio, best docs.\nIdeal for teams new to ORMs.',
        },
        {
          value: 'drizzle' as OrmChoice,
          label: 'Drizzle',
          hint: 'TypeScript-native, SQL-like syntax.\nLighter, faster, preferred by TypeScript purists.',
        },
      ],
      initialValue: 'prisma' as OrmChoice,
    });
    if (isCancel(result)) { cancel('Setup cancelled.'); process.exit(0); }
    ormChoice = result as OrmChoice;
  }

  // Q5: Module selection — must-have + methodology-derived modules pre-checked, already-installed filtered out
  const mustHaveIds = availableModules
    .filter(m => m.priority === 'must-have')
    .map(m => m.id as ModuleId);

  // Derive pre-checked methodology modules from the aiMethodology answer
  const methodologyPreselect: ModuleId[] = ['gsd'];
  if (aiMethodology === 'bmad' || aiMethodology === 'both') methodologyPreselect.push('bmad');

  const initialModuleIds = [...new Set([...mustHaveIds, ...methodologyPreselect])]
    .filter(id => availableModules.some(m => m.id === id));

  let selectedModules: ModuleId[];
  if (yesMode) {
    selectedModules = initialModuleIds;
  } else {
    const result = await multiselect<ModuleId>({
      message: 'Select modules to install (pre-selected based on your choices):',
      options: availableModules.map(m => ({
        value: m.id as ModuleId,
        label: m.label,
        hint: m.description,
      })),
      initialValues: initialModuleIds,
      required: false,
    });
    if (isCancel(result)) { cancel('Setup cancelled.'); process.exit(0); }
    selectedModules = result as ModuleId[];
  }

  // Conflict validation — BEFORE outro() or returning
  const errors = validateConflicts(selectedModules);
  if (errors.length > 0) {
    for (const err of errors) log.error(err);
    cancel('Resolve conflicts and re-run.');
    process.exit(1);
  }

  outro('Selections complete. Writing config...');

  return { aiMethodology, agenticSystem, authProvider, ormChoice, selectedModules };
}
