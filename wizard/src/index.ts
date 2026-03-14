/**
 * create-ai-template — package entry point
 * Phase 1: exports registry and version data only.
 * Phase 2: adds @clack/prompts CLI wizard entry.
 */
export { MODULE_REGISTRY } from './registry.js';
export type { ModuleDefinition, ModuleId, ModuleRegistry } from './types.js';
export * from './dependency-versions.js';
