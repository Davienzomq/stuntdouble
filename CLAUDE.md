# stuntdouble

Skill open source para Claude Code (não app/proxy). Tagline: "Your frontier
model is the star — stop making it do the stunts." Dois modos:

- **Advisor** (`/stuntdouble <tarefa>`): pontua a tarefa e recomenda o modelo
  com o comando pronto (`/model haiku` etc.). Não executa a troca.
- **Orchestrator** (`/stuntdouble on|off`, persistente estilo caveman): toda
  mensagem do usuário é pontuada; tarefas decomponíveis são despachadas para
  subagentes "dublês" com o parâmetro `model` certo por parte (haiku/sonnet/
  opus) e a "estrela" (fable/opus) só entra no final para verificar e corrigir.
  Tarefas pequenas executam direto (overhead de subagente come a economia).

## Lógica de score

4 dimensões: complexidade 40%, contexto 20%, qualidade 25%, velocidade/custo
15% (inverte). Tiers: ≤0.33 haiku · 0.34–0.66 sonnet · ≥0.67 opus/fable.

## Provedores

- **Anthropic**: haiku, sonnet, opus, fable (+ `[1m]`, thinking, fast mode) — único com orquestração
- **OpenAI**: gpt-5.4-mini, gpt-5.5, gpt-5.4-codex — só advisor
- **Google**: Gemini Flash, Pro, Ultra — só advisor

## Arquivos

- `stuntdouble/SKILL.md` — a skill (instalada em `~/.claude/skills/`)
- `stuntdouble/models.md` — catálogo de modelos
- `README.md` — docs e instalação
- `PLAN.md` — plano de implementação
- `examples/fable5-landing/` — demo real construída pela skill (~40% economia, verificador corrigiu 13 bugs)

## Deploy

Publicado em https://github.com/Davienzomq/stuntdouble (público, MIT).
Nota: `/fable5-landing/` na raiz está no .gitignore (cópia antiga travada por
processo; a oficial é a de examples/ — pode ser deletada quando destravar).
