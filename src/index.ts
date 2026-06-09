#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { loadConfig } from './config';
import { scan } from './scanner';
import { loadIndex, saveIndex, addSkills, getSkill, defaultIndexPath } from './indexer';
import { search } from './search';
import { installSkill } from './installer';
import { exportHtml } from './exporter';

const APP_NAME = 'agent-skills';
const defaults = {
  endpoint: 'http://localhost:11434/v1',
  model: 'llama3.2',
  skillsDir: `${homedir()}/.claude/skills`,
};

function printHelp(): void {
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
  console.log(`agent-skills v${pkg.version}
Index, search, and manage SKILL.md collections for AI agents.

Usage:
  agent-skills scan <dir>...       Scan directories for SKILL.md files
  agent-skills search <query>      Search indexed skills
  agent-skills install <skill>     Copy skill to agent skills directory
  agent-skills export --html       Export indexed skills to static HTML
  agent-skills list                List all indexed skills
  agent-skills --help              Show this help message

Environment variables:
  AGENT_SKILLS_ENDPOINT    LLM endpoint (default: http://localhost:11434/v1)
  AGENT_SKILLS_MODEL       Model name (default: llama3.2)
  AGENT_SKILLS_SKILLS_DIR  Target skills directory (default: ~/.claude/skills)
`);
}

function fail(msg: string): never {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    process.exit(0);
  }

  const config = loadConfig(APP_NAME, defaults);
  const indexPath = defaultIndexPath();

  const cmd = args[0];

  switch (cmd) {
    case 'scan': {
      const dirs = args.slice(1);
      if (dirs.length === 0) fail('Usage: agent-skills scan <dir>...');
      const skills = scan(dirs);
      let index = loadIndex(indexPath);
      index = addSkills(index, skills);
      saveIndex(index, indexPath);
      console.log(`Indexed ${skills.length} skill${skills.length === 1 ? '' : 's'} from ${dirs.length} director${dirs.length === 1 ? 'y' : 'ies'}.`);
      console.log(`Total indexed: ${index.skills.length}`);
      break;
    }

    case 'search': {
      const query = args.slice(1).join(' ');
      if (!query) fail('Usage: agent-skills search <query>');
      const index = loadIndex(indexPath);
      if (index.skills.length === 0) {
        console.log('No skills indexed. Run `agent-skills scan <dir>` first.');
        break;
      }
      const results = search(index, query);
      if (results.length === 0) {
        console.log('No matching skills found.');
        break;
      }
      console.log(`Found ${results.length} result${results.length === 1 ? '' : 's'}:\n`);
      for (const r of results) {
        const tags = (r.skill.frontmatter.tags || []).map(t => `[${t}]`).join(' ');
        console.log(`  ${r.skill.name}  (score: ${r.score})`);
        console.log(`    ${r.skill.frontmatter.description || 'No description'}`);
        if (tags) console.log(`    Tags: ${tags}`);
        console.log(`    Path: ${r.skill.path}`);
        console.log();
      }
      break;
    }

    case 'install': {
      const skillId = args[1];
      if (!skillId) fail('Usage: agent-skills install <skill>');
      const index = loadIndex(indexPath);
      const skill = getSkill(index, skillId);
      if (!skill) fail(`Skill "${skillId}" not found in index. Run ">agent-skills scan <dir>" first.`);
      const force = args.includes('--force');
      try {
        const dest = installSkill(skill, config.skillsDir!, { force });
        console.log(`Installed "${skill.name}" to ${dest}`);
      } catch (err) {
        fail((err as Error).message);
      }
      break;
    }

    case 'export': {
      const htmlFlag = args.includes('--html');
      if (!htmlFlag) fail('Usage: agent-skills export --html');
      const index = loadIndex(indexPath);
      if (index.skills.length === 0) {
        console.log('No skills indexed. Run `agent-skills scan <dir>` first.');
        break;
      }
      const outDir = args.find(a => a.startsWith('--out='))?.split('=')[1] || './agent-skills-export';
      exportHtml(index, outDir);
      console.log(`Exported ${index.skills.length} skill${index.skills.length === 1 ? '' : 's'} to ${outDir}/`);
      break;
    }

    case 'list': {
      const index = loadIndex(indexPath);
      if (index.skills.length === 0) {
        console.log('No skills indexed. Run `agent-skills scan <dir>` first.');
        break;
      }
      console.log(`${index.skills.length} skill${index.skills.length === 1 ? '' : 's'} indexed:\n`);
      for (const skill of index.skills) {
        const tags = (skill.frontmatter.tags || []).map(t => `[${t}]`).join(' ');
        console.log(`  ${skill.name}`);
        console.log(`    ${skill.frontmatter.description || 'No description'}`);
        if (tags) console.log(`    Tags: ${tags}`);
        console.log();
      }
      break;
    }

    default:
      fail(`Unknown command: ${cmd}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
