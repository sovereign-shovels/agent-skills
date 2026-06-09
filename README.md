# agent-skills

Index, search, and manage SKILL.md collections for AI agents.

## Install

```bash
npm install -g agent-skills
```

## Usage

```bash
# Scan directories for SKILL.md files
agent-skills scan ~/.claude/skills

# Search indexed skills
agent-skills search pdf

# Install a skill to your agent's skills directory
agent-skills install pdf-processing

# Export all indexed skills to static HTML
agent-skills export --html

# List all indexed skills
agent-skills list
```

## Configuration

agent-skills reads configuration from `~/.config/agent-skills/config.toml`:

```toml
[provider]
endpoint = "http://localhost:11434/v1"
model = "llama3.2"

[agent-skills]
skillsDir = "~/.claude/skills"
```

Environment variables override config file values:

- `AGENT_SKILLS_ENDPOINT`
- `AGENT_SKILLS_MODEL`
- `AGENT_SKILLS_SKILLS_DIR`

## Philosophy

- **Sovereign-by-construction**: BYO API key, local-first, no telemetry, no required sign-up
- No hardcoded secrets. No phone-home. Default endpoint is `localhost:11434` (Ollama)
- Apache 2.0 licensed

## FAQ

**Which agents are supported?**

Any agent that uses SKILL.md files — Claude Code, Kimi, Paperclip, and custom setups.

## License

Apache 2.0
