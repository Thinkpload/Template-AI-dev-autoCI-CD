/**
 * Core type definitions for the wizard module registry.
 * No wizard UI logic or installer logic — pure data contracts only.
 */

export interface ModuleDefinition {
  /** Unique identifier matching the registry key */
  id: string;
  /** Human-readable display name shown in wizard prompts */
  label: string;
  /** Short description shown in wizard prompts */
  description: string;
  /** Installation priority — controls which modules are pre-checked in multi-select */
  priority: 'must-have' | 'should-have' | 'nice-to-have';
  /** Runtime npm dependencies to install in the target project */
  deps: string[];
  /** Dev npm dependencies to install in the target project */
  devDeps: string[];
  /**
   * Path to template directory relative to wizard/ root.
   * Phase 3 installer copies files from this directory into the target project.
   * Must point to an existing directory (use empty dir with .gitkeep if no templates).
   */
  templateDir: string;
  /**
   * Ordered shell commands to run in the target project after npm install.
   * Phase 3 installer executes these sequentially.
   */
  postInstall: string[];
  /**
   * Module IDs that cannot be installed alongside this module.
   * Phase 2 wizard validates this before any installation begins.
   */
  conflicts?: string[];
}

export type ModuleId =
  | 'eslint'
  | 'husky'
  | 'vitest'
  | 'tsconfig'
  | 'bmad'
  | 'gsd';

export type ModuleRegistry = Record<ModuleId, ModuleDefinition>;

export type AiMethodology = 'bmad' | 'gsd' | 'both';
export type AgenticSystem = 'claude-code' | 'cursor' | 'vscode' | 'antigravity';

export interface UserSelections {
  aiMethodology: AiMethodology;
  agenticSystem: AgenticSystem;
  selectedModules: ModuleId[];
}

export type InstallState = 'pending' | 'installed' | 'failed' | 'skipped';

export interface ModuleInstallRecord {
  id: string;
  installState: InstallState;
}

export interface TemplateConfig {
  wizardVersion: string;
  aiMethodology: AiMethodology;
  agenticSystem: AgenticSystem;
  modules: ModuleInstallRecord[];
  createdAt: string;
  updatedAt: string;
}
