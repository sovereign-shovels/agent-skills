import { scan } from '../src/scanner';
import { loadIndex, saveIndex, addSkills, getSkill, defaultIndexPath } from '../src/indexer';
import { search } from '../src/search';
import { installSkill } from '../src/installer';
import { exportHtml } from '../src/exporter';
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('integration', () => {
  let tmpDir: string;
  let fixturesDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'agent-skills-integration-'));
    fixturesDir = join(tmpDir, 'fixtures');
    
    // Create realistic skill fixtures
    const pdfDir = join(fixturesDir, 'pdf-processing');
    mkdirSync(pdfDir, { recursive: true });
    writeFileSync(join(pdfDir, 'SKILL.md'), `---
title: "PDF Processing"
description: "Extract and process PDFs with local tools"
tags: ["pdf", "rust", "cli"]
scope: "project"
---
# PDF Processing
Use pdftotext for local PDF extraction.
`);

    const webDir = join(fixturesDir, 'web-scraping');
    mkdirSync(webDir, { recursive: true });
    writeFileSync(join(webDir, 'SKILL.md'), `---
title: "Web Scraping"
description: "Scrape web pages ethically"
tags: ["web", "python"]
scope: "user"
---
# Web Scraping
Respect robots.txt and use polite crawl rates.
`);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('full scan-index-search flow', () => {
    // Scan
    const skills = scan([fixturesDir]);
    expect(skills).toHaveLength(2);

    // Index
    const indexPath = join(tmpDir, 'index.json');
    let index = loadIndex(indexPath);
    index = addSkills(index, skills);
    saveIndex(index, indexPath);

    // Search
    const results = search(index, 'pdf');
    expect(results).toHaveLength(1);
    expect(results[0].skill.id).toBe('pdf-processing');
    expect(results[0].score).toBeGreaterThan(0);

    const webResults = search(index, 'python web');
    expect(webResults[0].skill.id).toBe('web-scraping');
  });

  test('scan-install-export flow', () => {
    const skills = scan([fixturesDir]);
    const targetDir = join(tmpDir, 'skills');
    const indexPath = join(tmpDir, 'index.json');
    let index = loadIndex(indexPath);
    index = addSkills(index, skills);
    saveIndex(index, indexPath);

    const pdfSkill = getSkill(index, 'pdf-processing')!;
    const dest = installSkill(pdfSkill, targetDir);
    expect(existsSync(join(dest, 'SKILL.md'))).toBe(true);

    const outDir = join(tmpDir, 'export');
    exportHtml(index, outDir);
    expect(existsSync(join(outDir, 'index.html'))).toBe(true);
    expect(existsSync(join(outDir, 'pdf-processing.html'))).toBe(true);
    expect(existsSync(join(outDir, 'web-scraping.html'))).toBe(true);

    const html = readFileSync(join(outDir, 'index.html'), 'utf-8');
    expect(html).toContain('PDF Processing');
    expect(html).toContain('Web Scraping');
  });

  test('re-scanning updates existing entries', () => {
    const skills = scan([fixturesDir]);
    const indexPath = join(tmpDir, 'index.json');
    let index = loadIndex(indexPath);
    index = addSkills(index, skills);
    saveIndex(index, indexPath);

    // Modify a skill
    writeFileSync(join(fixturesDir, 'pdf-processing', 'SKILL.md'), `---
title: "PDF Processing Updated"
description: "Updated description"
tags: ["pdf"]
scope: "project"
---
# Updated
`);

    const newSkills = scan([fixturesDir]);
    index = addSkills(index, newSkills);
    saveIndex(index, indexPath);

    const loaded = loadIndex(indexPath);
    const pdf = loaded.skills.find(s => s.id === 'pdf-processing');
    expect(pdf!.name).toBe('PDF Processing Updated');
    expect(pdf!.frontmatter.description).toBe('Updated description');
  });
});
