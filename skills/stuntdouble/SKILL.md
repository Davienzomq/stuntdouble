---
name: stuntdouble
description: >
  Your frontier model is the star — stop making it do the stunts. Two modes.
  ADVISOR: analyzes a task and recommends the best AI model
  (Anthropic/OpenAI/Google) with the exact switch command. ORCHESTRATOR: stays
  ON for the whole session (like a mode toggle) — every task gets scored,
  decomposed, and dispatched to "stunt double" workers running the cheapest
  capable model OF THE HOST'S OWN PROVIDER (Claude models in Claude Code,
  OpenAI models in Codex, Gemini models in Gemini CLI), with the star
  (strongest model) doing only the final close-up: verification. TRIGGER on
  /stuntdouble, "stuntdouble on/off", "which model should I use", "select the
  best model", "optimize model usage", "is this task worth Opus". DO NOT
  TRIGGER when the user asks about model pricing/APIs in their own application
  code.
---

# Stuntdouble

Hollywood doesn't make the star do the stunts. Doubles shoot the action scenes;
the star shows up for the close-up. Same movie, fraction of the cost — and the
audience can't tell. Stuntdouble does this with AI models: cheap capable models
do the heavy lifting, the strongest model only enters at the end to verify.

## Mode selection (check ARGUMENTS first)

- `on` → activate **Orchestrator Mode** (see below). Stays active for the rest
  of the session until the user turns it off.
- `off` → deactivate Orchestrator Mode. Confirm in one line and stop applying
  the pipeline.
- anything else (a task description, or empty) → **Advisor Mode**: one-shot
  recommendation for that task.

---

## Host detection (do this FIRST, in both modes)

Identify which agent you are running inside, and use ONLY that host's models
and dispatch method. **Never mention or dispatch models the host doesn't
offer** — recommending `haiku` inside Codex (or `gpt-5.5` inside Claude Code)
is a failure.

| Host | Your models (low / mid / high) | Worker dispatch | Star (verifier) |
|---|---|---|---|
| **Claude Code** | `haiku` / `sonnet` / `opus` | Native subagents: Agent/Task tool with the `model` parameter, `subagent_type: general-purpose` | `fable`, else `opus` |
| **Codex (OpenAI)** | `gpt-5.4-mini` / `gpt-5.5` or `gpt-5.4-codex` / `gpt-5.5` high reasoning | Child runs via shell: `codex exec -m <model> "<subtask prompt>"` — run `codex exec --help` once first to confirm flags and sandbox options | `gpt-5.5` with high reasoning effort |
| **Gemini CLI** | `gemini-flash` / `gemini-pro` / `gemini-ultra` | Child runs via shell: `gemini -m <model> -p "<subtask prompt>"` (confirm flags with `--help` first) | `gemini-ultra` |
| **Other / unknown** | infer the host's tiers from its docs or `models.md` | **Phase Mode** (see below) | strongest available |

**Phase Mode (fallback)** — when the host has no subagent tool and no CLI you
can shell out to: plan the parts, label each with its recommended tier, execute
the phases yourself in order, and before each phase tell the user the ideal
model to switch to (e.g. `/model <name>`). Cheap phases first so expensive
context is only loaded once.

---

## Scoring (used by both modes)

Score each dimension 0–1, then combine:

| Dimension | Weight | Low (0) | High (1) |
|---|---|---|---|
| Cognitive complexity | 40% | formatting, renaming, boilerplate, simple Q&A | architecture, race conditions, novel algorithms, multi-constraint design |
| Context size | 20% | one file, short snippet | whole repo, long history, many files |
| Quality required | 25% | draft, prototype, throwaway | production, security-sensitive, public API |
| Speed/cost pressure | 15% | "take your time" | "quick", "cheap", "just testing" (inverts: pushes score DOWN) |

Final score = `0.40·complexity + 0.20·context + 0.25·quality − 0.15·speed_pressure` (clamp 0–1).

Tier map: **≤ 0.33 → low** · **0.34–0.66 → mid** · **≥ 0.67 → high** — then
take the model from your host's row above. Full catalog: `models.md`.

---

## Advisor Mode (one-shot)

1. Detect the host/provider (table above); ambiguous → ask one short question.
2. Score the task. If no task was given, infer from recent conversation or ask
   "What task do you want to optimize for?"
3. Output, short:

```
Recommended: <model from YOUR host's row>
Why: <one line — dominant dimension(s)>
Switch: /model <name>   (or where to change it on this platform)
Saves: <only if downgrading — e.g. "Haiku is ~15x cheaper than Opus">
```

Rules: never execute `/model` yourself (user-level command). If the current
model is already right, say so. Mixed-phase tasks → one model per phase.
Mention an alternative only when the score is within 0.05 of a boundary.

---

## Orchestrator Mode (persistent, like a session toggle)

On activation, detect the host, then reply with this status block (fill in the
host line from the table) and nothing else:

```
🎬 stuntdouble ON — the star only shoots the close-ups
Host: <host> · Doubles: <low>, <mid> · Star: <verifier>
Every task: scored → routed to the cheapest capable model → verified by the star.
Tip: run your session on a mid-tier model — the director's chair doesn't need a frontier model.
Turn off: /stuntdouble off
```

From now on, apply this pipeline to EVERY user message until turned off:

### Pipeline

1. **Classify the message.** Questions, conversation, opinions, trivial
   one-liners → answer directly, no orchestration, no commentary about the mode.

2. **Score the task** (scoring table above).

3. **Choose strategy:**
   - **Direct** — task is small, atomic, or not decomposable (one function, one
     edit, one explanation): do it yourself in the session. Don't spawn workers
     — overhead would eat the savings.
   - **Orchestrate** — task splits into ≥2 independent parts with different
     complexity levels (e.g. a landing page, a feature with backend + UI +
     tests, a multi-file refactor):
     a. Decompose into subtasks; score each one; map to your host's low/mid/high models.
     b. Show the user a one-line plan per subtask (`part → model`) before
        dispatching.
     c. Dispatch workers using YOUR host's dispatch method (table above). Run
        independent subtasks in parallel when the host allows it. Workers start
        cold: include full context in each prompt — file paths, conventions,
        what the other workers are building, exact deliverables.
     d. If dispatch fails or is unavailable → fall back to Phase Mode for this
        task and say so in one line.

4. **Verify — the star's close-up** (orchestrated tasks only): after all
   workers finish, run ONE verification pass on your host's star model to
   review the integrated result against the user's request, fix small issues
   directly (inconsistencies, broken references, style mismatches), and report
   what it changed. Skip verification only for throwaway/draft work.

5. **Report**, compact (model names from YOUR host):

```
🎬 That's a wrap — orchestrated across N models
static content    → <low model>   (double)
core feature      → <mid model>   (double)
final close-up    → <star>        (star — fixed: 2 issues)
Est. savings vs. shooting everything with the star: ~XX%
```

### Rules

- The mode survives the whole session. Re-apply it on every message — do not
  let it fade. Only `/stuntdouble off` (or the user clearly asking to stop)
  deactivates it.
- Hard rule: only ever name models from the host's own row. No Claude model
  names inside Codex/Gemini; no OpenAI/Gemini names inside Claude Code.
- Never orchestrate the conversation itself — only concrete work tasks.
- When in doubt between Direct and Orchestrate, prefer Direct: a wrong
  decomposition costs more than a slightly expensive model.
- Savings estimate: rough input-price ratio (low ≈ 1/3 of mid, mid ≈ 1/5 of
  high tier). Label it as an estimate.
