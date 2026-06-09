import { cpSync, existsSync, mkdirSync } from 'fs';
import { basename, join } from 'path';
import type { IndexEntry } from './indexer';

export interface InstallOptions {
  force?: boolean;
}

export function installSkill(skill: IndexEntry, targetDir: string, opts: InstallOptions = {}): string {
  mkdirSync(targetDir, { recursive: true });
  const dest = join(targetDir, skill.id);
  if (existsSync(dest) && !opts.force) {
    throw new Error(`Skill already installed at ${dest}. Use --force to overwrite.`);
  }
  cpSync(skill.path, dest, { recursive: true, force: true });
  return dest;
}

export function uninstallSkill(skillId: string, targetDir: string): void {
  const dest = join(targetDir, skillId);
  if (!existsSync(dest)) {
    throw new Error(`Skill not found at ${dest}`);
  }
  const { rmSync } = require('fs');
  rmSync(dest, { recursive: true, force: true });
}
