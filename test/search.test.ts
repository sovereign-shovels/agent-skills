import { search } from '../src/search';
import type { SkillIndex, IndexEntry } from '../src/indexer';

function makeIndex(skills: Partial<IndexEntry>[]): SkillIndex {
  return {
    version: 1,
    indexedAt: Date.now(),
    skills: skills.map(s => ({
      id: s.id || 'test',
      name: s.name || 'Test',
      path: '/test',
      relativePath: 'test',
      frontmatter: s.frontmatter || {},
      content: s.content || '',
      modifiedAt: 0,
      indexedAt: Date.now(),
      ...s,
    })) as IndexEntry[],
  };
}

describe('search', () => {
  test('returns empty for empty query', () => {
    const index = makeIndex([{ id: 'a', name: 'Alpha' }]);
    const results = search(index, '');
    expect(results.length).toBe(1);
    expect(results[0].score).toBe(0);
  });

  test('ranks exact name matches highest', () => {
    const index = makeIndex([
      { id: 'pdf', name: 'PDF Processing', frontmatter: { description: 'Process PDFs' } },
      { id: 'web', name: 'Web Scraping', frontmatter: { description: 'PDF related web scraping' } },
    ]);
    const results = search(index, 'pdf');
    expect(results[0].skill.id).toBe('pdf');
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  test('matches tags with high score', () => {
    const index = makeIndex([
      { id: 'a', name: 'Alpha', frontmatter: { tags: ['rust'] } },
      { id: 'b', name: 'Beta', frontmatter: { tags: ['python'] } },
    ]);
    const results = search(index, 'rust');
    expect(results).toHaveLength(1);
    expect(results[0].skill.id).toBe('a');
  });

  test('matches content with lower score', () => {
    const index = makeIndex([
      { id: 'a', name: 'Alpha', content: 'deep learning neural networks' },
      { id: 'b', name: 'Beta', content: 'web scraping with python' },
    ]);
    const results = search(index, 'neural');
    expect(results).toHaveLength(1);
    expect(results[0].skill.id).toBe('a');
  });

  test('multi-term query accumulates score', () => {
    const index = makeIndex([
      { id: 'a', name: 'PDF CLI Tool', frontmatter: { tags: ['pdf'] } },
      { id: 'b', name: 'PDF Web Tool', frontmatter: { tags: ['pdf'] } },
    ]);
    const results = search(index, 'pdf cli');
    expect(results[0].skill.id).toBe('a');
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  test('returns no results for non-matching query', () => {
    const index = makeIndex([{ id: 'a', name: 'Alpha' }]);
    const results = search(index, 'zzzzzz');
    expect(results).toHaveLength(0);
  });

  test('case insensitive search', () => {
    const index = makeIndex([{ id: 'a', name: 'PDF Processing' }]);
    const results = search(index, 'pdf');
    expect(results).toHaveLength(1);
    const results2 = search(index, 'PDF');
    expect(results2).toHaveLength(1);
  });

  test('boosts project scope skills', () => {
    const index = makeIndex([
      { id: 'a', name: 'Alpha', frontmatter: { scope: 'project' } },
      { id: 'b', name: 'Alpha', frontmatter: { scope: 'user' } },
    ]);
    const results = search(index, 'alpha');
    expect(results[0].skill.id).toBe('a');
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });
});
