---
name: stuntdouble
description: >
  Your frontier model is the star — stop making it do the stunts. Two modes.
  ADVISOR: analyzes a task and recommends the best AI model
  (Anthropic/OpenAI/Google) with the exact switch command. ORCHESTRATOR: stays
  ON for the whole session (like a mode toggle) — every task gets scored,
  decomposed, and dispatched to "stunt double" subagents running the cheapest
  capable model per part, with the star (strongest model) doing only the final
  close-up: verification. TRIGGER on /stuntdouble, "stuntdouble on/off",
  "which model should I use", "select the best model", "optimize model usage",
  "is this task worth Opus". DO NOT TRIGGER when the user asks about model
  pricing/APIs in their own application code.
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

## Scoring (used by both modes)

Score each dimension 0–1, then combine:

| Dimension | Weight | Low (0) | High (1) |
|---|---|---|---|
| Cognitive complexity | 40% | formatting, renaming, boilerplate, simple Q&A | architecture, race conditions, novel algorithms, multi-constraint design |
| Context size | 20% | one file, short snippet | whole repo, long history, many files |
| Quality required | 25% | draft, prototype, throwaway | production, security-sensitive, public API |
| Speed/cost pressure | 15% | "take your time" | "quick", "cheap", "just testing" (inverts: pushes score DOWN) |

Final score = `0.40·complexity + 0.20·context + 0.25·quality − 0.15·speed_pressure` (clamp 0–1).

Tier map (Anthropic / Claude Code — see `models.md` for OpenAI/Google):

| Score | Model | Typical tasks |
|---|---|---|
| 0 – 0.33 | `haiku` | classification, formatting, boilerplate, static content, commit messages |
| 0.34 – 0.66 | `sonnet` | everyday coding, refactoring, CSS/layout, review, explanations |
| 0.67 – 1.0 | `opus` / `fable` | architecture, deep debugging, critical decisions, final verification |

---

## Advisor Mode (one-shot)

1. Identify provider: Claude Code → Anthropic (`/model <name>`); user mentions
   GPT/Codex → OpenAI; Gemini → Google; ambiguous → ask one short question.
2. Score the task (above). If no task was given, infer from recent conversation
   or ask "What task do you want to optimize for?"
3. Output, short:

```
Recommended: <model>
Why: <one line — dominant dimension(s)>
Switch: /model <name>
Saves: <only if downgrading — e.g. "Haiku is ~15x cheaper than Opus">
```

Rules: never execute `/model` yourself (user-level command). If the current
model is already right, say so. Mixed-phase tasks → one model per phase.
Mention an alternative only when the score is within 0.05 of a boundary.

---

## Orchestrator Mode (persistent, like a session toggle)

On activation, reply with exactly this status block and nothing else:

```
🎬 stuntdouble ON — the star only shoots the close-ups
Every task you send will be scored, routed to the cheapest capable model
(the doubles), and verified by the strongest model (the star) before delivery.
Tip: run your session on sonnet — the director's chair doesn't need a frontier model.
Turn off: /stuntdouble off
```

From now on, apply this pipeline to EVERY user message until turned off:

### Pipeline

1. **Classify the message.** Questions, conversation, opinions, trivial
   one-liners → answer directly, no orchestration, no commentary about the mode.

2. **Score the task** (scoring table above).

3. **Choose strategy:**
   - **Direct** — task is small, atomic, or not decomposable (one function, one
     edit, one explanation): do it yourself in the session. Don't spawn agents
     — subagent overhead would eat the savings.
   - **Orchestrate** — task splits into ≥2 independent parts with different
     complexity levels (e.g. a landing page, a feature with backend + UI +
     tests, a multi-file refactor):
     a. Decompose into subtasks; score each one.
     b. Map each subtask to a model: ≤0.33 → `haiku`, 0.34–0.66 → `sonnet`,
        ≥0.67 → `opus`.
     c. Show the user a one-line plan per subtask (`part → model`) before
        dispatching.
     d. Dispatch subagents (`subagent_type: general-purpose`) with the `model`
        parameter set per subtask. Run independent subtasks IN PARALLEL (one
        message, multiple Agent calls). Subagents start cold: include full
        context in each prompt — file paths, conventions, what the other
        subagents are building, exact deliverables.

4. **Verify — the star's close-up** (orchestrated tasks only): after all
   subagents finish, launch ONE final subagent on the strongest available model
   (`fable`, else `opus`) to review the integrated result against the user's
   request, fix small issues directly (inconsistencies, broken references,
   style mismatches), and report what it changed. Skip verification only for
   throwaway/draft work.

5. **Report**, compact:

```
🎬 That's a wrap — orchestrated across N models
hero + FAQ        → haiku   (double)
layout + pricing  → sonnet  (double)
form validation   → sonnet  (double)
final close-up    → fable   (star — fixed: 2 issues)
Est. savings vs. shooting everything with the star: ~XX%
```

### Rules

- The mode survives the whole session. Re-apply it on every message — do not
  let it fade. Only `/stuntdouble off` (or the user clearly asking to stop)
  deactivates it.
- Never orchestrate the conversation itself — only concrete work tasks.
- When in doubt between Direct and Orchestrate, prefer Direct: a wrong
  decomposition costs more than a slightly expensive model.
- Savings estimate: rough input-price ratio (haiku ≈ 1/3 of sonnet, sonnet
  ≈ 1/5 of opus-tier). Label it as an estimate.
