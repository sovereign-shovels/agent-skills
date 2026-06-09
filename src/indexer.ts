import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { homedir } from 'os';
import type { ScannedSkill } from './scanner';

export interface IndexEntry extends ScannedSkill {
  indexedAt: number;
}

export interface SkillIndex {
  version: number;
  indexedAt: number;
  skills: IndexEntry[];
}

export function defaultIndexPath(): string {
  const configDir = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
  return join(configDir, 'agent-skills', 'index.json');
}

export function loadIndex(indexPath: string = defaultIndexPath()): SkillIndex {
  if (!existsSync(indexPath)) {
    return { version: 1, indexedAt: 0, skills: [] };
  }
  try {
    const raw = readFileSync(indexPath, 'utf-8');
    const parsed = JSON.parse(raw) as SkillIndex;
    if (!parsed.skills) parsed.skills = [];
    return parsed;
  } catch {
    return { version: 1, indexedAt: 0, skills: [] };
  }
}

export function saveIndex(index: SkillIndex, indexPath: string = defaultIndexPath()): void {
  mkdirSync(dirname(indexPath), { recursive: true });
  writeFileSync(indexPath, JSON.stringify(index, null, 2));
}

export function addSkills(index: SkillIndex, skills: ScannedSkill[]): SkillIndex {
  const existingMap = new Map(index.skills.map(s => [s.id, s]));
  for (const skill of skills) {
    existingMap.set(skill.id, { ...skill, indexedAt: Date.now() });
  }
  return {
    version: index.version,
    indexedAt: Date.now(),
    skills: Array.from(existingMap.values()),
  };
}

export function removeSkill(index: SkillIndex, id: string): SkillIndex {
  return {
    ...index,
    skills: index.skills.filter(s => s.id !== id),
  };
}

export function getSkill(index: SkillIndex, id: string): IndexEntry | undefined {
  return index.skills.find(s => s.id === id);
}
