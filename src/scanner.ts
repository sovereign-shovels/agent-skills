import { readdirSync, readFileSync, statSync } from 'fs';
import { basename, dirname, join, relative } from 'path';

export interface SkillFrontmatter {
  title?: string;
  description?: string;
  tags?: string[];
  scope?: string;
  [key: string]: unknown;
}

export interface ScannedSkill {
  id: string;
  name: string;
  path: string;
  relativePath: string;
  frontmatter: SkillFrontmatter;
  content: string;
  modifiedAt: number;
}

function parseYamlFrontmatter(text: string): { frontmatter: SkillFrontmatter; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/;
  const match = text.match(frontmatterRegex);
  if (!match) {
    return { frontmatter: {}, content: text };
  }

  const yamlText = match[1];
  const content = match[2];
  const frontmatter: SkillFrontmatter = {};

  let currentKey: string | null = null;
  let currentList: string[] | null = null;

  for (const line of yamlText.split('\n')) {
    const trimmed = line.trimEnd();
    if (!trimmed) continue;

    const listMatch = trimmed.match(/^(\s*)-\s+(.*)$/);
    if (listMatch && currentKey && currentList) {
      currentList.push(listMatch[2].replace(/^["']|["']$/g, ''));
      continue;
    }

    const keyValueMatch = trimmed.match(/^(\w+):\s*(.*)$/);
    if (keyValueMatch) {
      if (currentKey && currentList) {
        (frontmatter as Record<string, unknown>)[currentKey] = currentList;
      }
      currentKey = keyValueMatch[1];
      const value = keyValueMatch[2].trim();
      if (value === '') {
        currentList = [];
      } else if (value.startsWith('[') && value.endsWith(']')) {
        try {
          const parsed = JSON.parse(value.replace(/'/g, '"'));
          (frontmatter as Record<string, unknown>)[currentKey] = Array.isArray(parsed) ? parsed : value;
        } catch {
          (frontmatter as Record<string, unknown>)[currentKey] = value.replace(/^["']|["']$/g, '');
        }
        currentList = null;
      } else {
        (frontmatter as Record<string, unknown>)[currentKey] = value.replace(/^["']|["']$/g, '');
        currentList = null;
      }
    }
  }

  if (currentKey && currentList) {
    (frontmatter as Record<string, unknown>)[currentKey] = currentList;
  }

  return { frontmatter, content };
}

export function scanDirectory(root: string, dir: string, results: ScannedSkill[] = [], basePath: string = dir): ScannedSkill[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(root, fullPath, results, basePath);
    } else if (entry.name.toLowerCase() === 'skill.md') {
      const text = readFileSync(fullPath, 'utf-8');
      const { frontmatter, content } = parseYamlFrontmatter(text);
      const skillDir = dirname(fullPath);
      const id = basename(skillDir);
      results.push({
        id,
        name: frontmatter.title || id,
        path: skillDir,
        relativePath: relative(basePath, skillDir),
        frontmatter,
        content,
        modifiedAt: statSync(fullPath).mtimeMs,
      });
    }
  }
  return results;
}

export function scan(dirs: string[]): ScannedSkill[] {
  const results: ScannedSkill[] = [];
  for (const dir of dirs) {
    try {
      scanDirectory(dir, dir, results, dir);
    } catch (err) {
      console.error(`Warning: could not scan ${dir}: ${(err as Error).message}`);
    }
  }
  return results;
}
