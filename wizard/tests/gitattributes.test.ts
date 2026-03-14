import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect } from 'vitest';

// Repo root is one level up from wizard/
const REPO_ROOT = resolve(__dirname, '../../');
const GITATTRIBUTES_PATH = resolve(REPO_ROOT, '.gitattributes');

describe('.gitattributes', () => {
  it('exists at repo root', () => {
    expect(existsSync(GITATTRIBUTES_PATH)).toBe(true);
  });

  it('contains text=auto eol=lf rule for all files', () => {
    const content = readFileSync(GITATTRIBUTES_PATH, 'utf-8');
    expect(content).toMatch(/\* text=auto eol=lf/);
  });

  it('contains eol=lf rule for shell scripts', () => {
    const content = readFileSync(GITATTRIBUTES_PATH, 'utf-8');
    expect(content).toMatch(/\*\.sh text eol=lf/);
  });
});
