import { installSkill, uninstallSkill } from '../src/installer';
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, readFileSync, rmSync, readdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { IndexEntry } from '../src/indexer';

describe('installer', () => {
  let tmpDir: string;
  let targetDir: string;
  let skillDir: string;
  let skill: IndexEntry;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'agent-skills-install-'));
    targetDir = join(tmpDir, 'target');
    skillDir = join(tmpDir, 'pdf-processing');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, 'SKILL.md'), '# PDF Processing\n\nTest skill content.');
    writeFileSync(join(skillDir, 'helper.js'), 'module.exports = {};');
    skill = {
      id: 'pdf-processing',
      name: 'PDF Processing',
      path: skillDir,
      relativePath: 'pdf-processing',
      frontmatter: {},
      content: 'Test skill content.',
      modifiedAt: 0,
      indexedAt: Date.now(),
    };
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('copies skill directory to target', () => {
    const dest = installSkill(skill, targetDir);
    expect(existsSync(dest)).toBe(true);
    expect(existsSync(join(dest, 'SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, 'helper.js'))).toBe(true);
  });

  test('throws if already installed without force', () => {
    installSkill(skill, targetDir);
    expect(() => installSkill(skill, targetDir)).toThrow('already installed');
  });

  test('overwrites with force flag', () => {
    installSkill(skill, targetDir);
    writeFileSync(join(skillDir, 'SKILL.md'), '# Updated');
    const dest = installSkill(skill, targetDir, { force: true });
    expect(readFileSync(join(dest, 'SKILL.md'), 'utf-8')).toContain('Updated');
  });

  test('uninstall removes skill directory', () => {
    installSkill(skill, targetDir);
    expect(existsSync(join(targetDir, 'pdf-processing'))).toBe(true);
    uninstallSkill('pdf-processing', targetDir);
    expect(existsSync(join(targetDir, 'pdf-processing'))).toBe(false);
  });

  test('uninstall throws for missing skill', () => {
    expect(() => uninstallSkill('missing', targetDir)).toThrow('not found');
  });
});
