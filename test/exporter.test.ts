import { exportHtml } from '../src/exporter';
import { mkdtempSync, writeFileSync, existsSync, readFileSync, rmSync, readdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { SkillIndex } from '../src/indexer';

describe('exporter', () => {
  let tmpDir: string;
  let outDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'agent-skills-export-'));
    outDir = join(tmpDir, 'export');
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function makeIndex(): SkillIndex {
    return {
      version: 1,
      indexedAt: Date.now(),
      skills: [
        {
          id: 'pdf-processing',
          name: 'PDF Processing',
          path: '/fake/pdf-processing',
          relativePath: 'pdf-processing',
          frontmatter: { title: 'PDF Processing', description: 'Process PDFs', tags: ['pdf', 'cli'], scope: 'project' },
          content: '# PDF Processing\n\nUse local tools.',
          modifiedAt: 0,
          indexedAt: Date.now(),
        },
      ],
    };
  }

  test('generates index.html', () => {
    exportHtml(makeIndex(), outDir);
    expect(existsSync(join(outDir, 'index.html'))).toBe(true);
  });

  test('generates skill detail pages', () => {
    exportHtml(makeIndex(), outDir);
    expect(existsSync(join(outDir, 'pdf-processing.html'))).toBe(true);
  });

  test('index contains skill name', () => {
    exportHtml(makeIndex(), outDir);
    const html = readFileSync(join(outDir, 'index.html'), 'utf-8');
    expect(html).toContain('PDF Processing');
    expect(html).toContain('pdf-processing.html');
  });

  test('skill page contains content', () => {
    exportHtml(makeIndex(), outDir);
    const html = readFileSync(join(outDir, 'pdf-processing.html'), 'utf-8');
    expect(html).toContain('PDF Processing');
    expect(html).toContain('Use local tools');
    expect(html).toContain('pdf');
    expect(html).toContain('cli');
  });

  test('handles empty index', () => {
    exportHtml({ version: 1, indexedAt: Date.now(), skills: [] }, outDir);
    expect(existsSync(join(outDir, 'index.html'))).toBe(true);
    const html = readFileSync(join(outDir, 'index.html'), 'utf-8');
    expect(html).toContain('0 skills');
  });
});
