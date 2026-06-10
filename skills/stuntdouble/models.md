# Model Catalog

Reference catalog used by the `stuntdouble` skill. Community-maintained —
PRs welcome when providers ship new models. Prices change often; always check
the provider's pricing page before relying on exact numbers.

## Orchestration dispatch per host

| Host | How workers are spawned |
|---|---|
| Claude Code | Agent/Task tool with `model` parameter (`haiku`/`sonnet`/`opus`/`fable`) |
| Codex (OpenAI) | `codex exec -m <model> "<prompt>"` child runs (check `codex exec --help`) |
| Gemini CLI | `gemini -m <model> -p "<prompt>"` child runs (check `gemini --help`) |
| Other | Phase mode: plan parts, recommend `/model` switch per phase |

## Anthropic (Claude)

| Model | Tier | Cost | Best for | Notes |
|---|---|---|---|---|
| `haiku` (Haiku 4.5) | Low | $ | classification, extraction, formatting, translation, simple Q&A | fastest, cheapest |
| `sonnet` (Sonnet 4.6) | Mid | $$ | everyday coding, refactoring, review, analysis | recommended default |
| `sonnet[1m]` | Mid | $$ | same, with 1M-token context | whole-repo work |
| `opus` (Opus 4.8) | High | $$$ | architecture, deep debugging, critical reasoning | supports fast mode (`/fast`) |
| `claude-fable-5` (Fable 5) | High | $$$ | frontier reasoning and agentic work | `[1m]` variant available |

Modifiers:
- **Extended thinking / effort** — longer internal reasoning for hard problems; raises latency and cost.
- **Fast mode** (`/fast`, Opus 4.6+) — same model, faster output.
- **`[1m]` variants** — 1M-token context window for very large codebases/sessions.

Switch in Claude Code: `/model haiku`, `/model sonnet`, `/model opus`, `/model sonnet[1m]`, etc.

Pricing: https://claude.com/pricing

## OpenAI

| Model | Tier | Cost | Best for |
|---|---|---|---|
| `gpt-5.4-mini` | Low | $ | simple tasks, high-volume, drafts |
| `gpt-5.5` | Mid–High | $$–$$$ | general coding and reasoning; scale reasoning effort up for hard problems |
| `gpt-5.4-codex` | Mid | $$ | agentic coding (Codex CLI) |

Modifier: **reasoning effort** (low/medium/high) — analogous to extended thinking.

Pricing: https://openai.com/api/pricing

## Google (Gemini)

| Model | Tier | Cost | Best for |
|---|---|---|---|
| Gemini Flash | Low | $ | fast, cheap, high-volume |
| Gemini Pro | Mid | $$ | general coding and analysis |
| Gemini Ultra | High | $$$ | hardest reasoning tasks |

Pricing: https://ai.google.dev/pricing

## Adding a provider

Add a section with: model names as the user types them, tier (Low/Mid/High),
relative cost, best-for tasks, and any modifiers (thinking/effort/context
variants). Then map the tiers in `SKILL.md` Step 4.
