# AGENTS.md — agent-skills

## Project Context

`agent-skills` is a TypeScript CLI for indexing, searching, and managing SKILL.md collections for AI agents. It is part of the sovereign-shovels open-source portfolio.

## The 18 Universal No-Nos

1. **Never hardcode secrets** — API keys, tokens, and passwords must come from environment variables or config files.
2. **Never phone home** — No telemetry, analytics, or external reporting without explicit opt-in.
3. **Never require sign-up** — The tool must work out of the box with local defaults.
4. **Never send data to cloud LLMs by default** — Default endpoint is localhost:11434 (Ollama).
5. **Never store credentials in source control** — Use `.env` files (gitignored) or environment variables.
6. **Never log sensitive data** — Sanitize logs before output.
7. **Never expose internal paths in error messages** — Keep error messages generic in production.
8. **Never use eval or equivalent on untrusted input** — This includes `Function`, `setTimeout` with strings, etc.
9. **Never disable security warnings** — Do not suppress SSL/TLS verification without clear user intent.
10. **Never assume file system permissions** — Check before read/write operations.
11. **Never leave temp files behind** — Clean up after tests and operations.
12. **Never hardcode paths** — Respect XDG directories and user overrides.
13. **Never ignore encoding issues** — Always specify encoding for file operations.
14. **Never block the event loop** — Use async I/O for file system and network operations.
15. **Never leak stack traces to users** — Log them internally, show friendly messages.
16. **Never trust user input** — Validate and sanitize all inputs.
17. **Never run shell commands with unsanitized input** — Use parameterized execution.
18. **Never commit build artifacts** — Only source code in version control.

## Additional Rules

- **Skills are never uploaded. Everything stays local.** The scanner, indexer, and exporter all operate on the local file system. No skill content is transmitted over the network.
- Keep dependencies minimal. Prefer built-in Node.js APIs.
- Maintain strict TypeScript typing. Avoid `any` where possible.
- Follow existing code style. Use single quotes, 2-space indentation, and semicolons.
