import { loadIndex, saveIndex, addSkills, removeSkill, getSkill, defaultIndexPath } from '../src/indexer';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('indexer', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'agent-skills-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('returns empty index when file does not exist', () => {
    const index = loadIndex(join(tmpDir, 'nonexistent.json'));
    expect(index.skills).toEqual([]);
    expect(index.version).toBe(1);
  });

  test('saves and loads index', () => {
    const path = join(tmpDir, 'index.json');
    const index = { version: 1, indexedAt: Date.now(), skills: [] };
    saveIndex(index, path);
    const loaded = loadIndex(path);
    expect(loaded.version).toBe(1);
    expect(loaded.skills).toEqual([]);
  });

  test('adds skills to index', () => {
    const index = loadIndex(join(tmpDir, 'index.json'));
    const newSkills = [
      { id: 'skill-a', name: 'Skill A', path: '/a', relativePath: 'a', frontmatter: {}, content: '', modifiedAt: 0 },
    ];
    const updated = addSkills(index, newSkills as any);
    expect(updated.skills).toHaveLength(1);
    expect(updated.skills[0].id).toBe('skill-a');
    expect(updated.skills[0].indexedAt).toBeGreaterThan(0);
  });

  test('updates existing skills by id', () => {
    let index = loadIndex(join(tmpDir, 'index.json'));
    index = addSkills(index, [{ id: 'skill-a', name: 'Old', path: '/a', relativePath: 'a', frontmatter: {}, content: '', modifiedAt: 0 }] as any);
    index = addSkills(index, [{ id: 'skill-a', name: 'New', path: '/a', relativePath: 'a', frontmatter: {}, content: '', modifiedAt: 0 }] as any);
    expect(index.skills).toHaveLength(1);
    expect(index.skills[0].name).toBe('New');
  });

  test('removes skill by id', () => {
    let index = loadIndex(join(tmpDir, 'index.json'));
    index = addSkills(index, [{ id: 'skill-a', name: 'A', path: '/a', relativePath: 'a', frontmatter: {}, content: '', modifiedAt: 0 }] as any);
    index = removeSkill(index, 'skill-a');
    expect(index.skills).toHaveLength(0);
  });

  test('getSkill returns undefined for missing skill', () => {
    const index = loadIndex(join(tmpDir, 'index.json'));
    expect(getSkill(index, 'missing')).toBeUndefined();
  });

  test('defaultIndexPath includes agent-skills', () => {
    const path = defaultIndexPath();
    expect(path).toContain('agent-skills');
    expect(path).toContain('index.json');
  });
});
