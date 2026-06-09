import { scan } from '../src/scanner';
import { join } from 'path';

const FIXTURES = join(__dirname, 'fixtures');

describe('scanner', () => {
  test('finds SKILL.md files recursively', () => {
    const results = scan([FIXTURES]);
    expect(results.length).toBeGreaterThanOrEqual(4);
  });

  test('parses YAML frontmatter correctly', () => {
    const results = scan([join(FIXTURES, 'pdf-processing')]);
    expect(results).toHaveLength(1);
    const skill = results[0];
    expect(skill.name).toBe('PDF Processing');
    expect(skill.frontmatter.description).toBe('Extract and process PDFs with local tools');
    expect(skill.frontmatter.tags).toEqual(['pdf', 'rust', 'cli']);
    expect(skill.frontmatter.scope).toBe('project');
  });

  test('handles files without frontmatter', () => {
    const results = scan([join(FIXTURES, 'no-frontmatter')]);
    expect(results).toHaveLength(1);
    expect(results[0].frontmatter.title).toBeUndefined();
    expect(results[0].content).toContain('No Frontmatter Skill');
  });

  test('finds nested skills', () => {
    const results = scan([join(FIXTURES, 'nested')]);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('deep-skill');
    expect(results[0].name).toBe('Deep Nested Skill');
  });

  test('skill id is directory name', () => {
    const results = scan([join(FIXTURES, 'pdf-processing')]);
    expect(results[0].id).toBe('pdf-processing');
  });

  test('gracefully handles nonexistent directories', () => {
    const results = scan([join(FIXTURES, 'does-not-exist')]);
    expect(results).toHaveLength(0);
  });
});
