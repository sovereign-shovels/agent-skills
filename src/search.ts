import type { SkillIndex, IndexEntry } from './indexer';

export interface SearchResult {
  skill: IndexEntry;
  score: number;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

function scoreSkill(skill: IndexEntry, terms: string[]): number {
  const nameTokens = tokenize(skill.name);
  const descTokens = tokenize(skill.frontmatter.description || '');
  const tagTokens = (skill.frontmatter.tags || []).map(t => t.toLowerCase());
  const contentTokens = tokenize(skill.content);

  let score = 0;
  for (const term of terms) {
    // Exact match in name is highest
    if (skill.name.toLowerCase() === term) score += 20;
    else if (skill.name.toLowerCase().includes(term)) score += 10;
    else if (nameTokens.includes(term)) score += 8;

    // Description matches
    if (skill.frontmatter.description?.toLowerCase().includes(term)) score += 5;
    else if (descTokens.includes(term)) score += 3;

    // Tag matches are strong signals
    if (tagTokens.includes(term)) score += 12;
    else if (tagTokens.some(t => t.includes(term))) score += 6;

    // Content matches
    if (skill.content.toLowerCase().includes(term)) score += 2;
    else if (contentTokens.includes(term)) score += 1;
  }

  // Boost by scope (project-level skills are often more relevant)
  if (skill.frontmatter.scope === 'project') score *= 1.05;

  return score;
}

export function search(index: SkillIndex, query: string): SearchResult[] {
  const terms = tokenize(query);
  if (terms.length === 0) {
    return index.skills.map(skill => ({ skill, score: 0 }));
  }

  const results: SearchResult[] = [];
  for (const skill of index.skills) {
    const score = scoreSkill(skill, terms);
    if (score > 0) {
      results.push({ skill, score });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
