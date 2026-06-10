# Plan: model-selector — Claude Code Skill para Seleção Inteligente de Modelos

## Context

O usuário quer uma **skill open source** (não um app/proxy como o Manifest) que, dentro de qualquer conversa de IA, analisa a tarefa em andamento e recomenda/executa a troca para o modelo mais adequado. A diferença chave em relação ao Manifest é que ele é uma infraestrutura de proxy (roda fora da conversa); esta skill roda *dentro* da conversa como um assistente de decisão.

**Objetivo:** Ajudar devs a não desperdiçar tokens caros do Opus em tarefas simples, nem usar Haiku em raciocínio complexo — automaticamente, com um único comando.

---

## O que será criado

Repositório GitHub: `model-selector` com a seguinte estrutura:

```
model-selector/
├── model-selector/
│   ├── SKILL.md      # A skill em si (formato oficial: pasta + SKILL.md maiúsculo)
│   └── models.md     # Catálogo de referência dos modelos por provedor
├── README.md         # Docs + instalação + como adaptar para outros provedores
├── CLAUDE.md         # Contexto do projeto para agentes
└── PLAN.md           # Este plano
```

> **Correção importante:** skills do Claude Code ficam em `<nome-da-skill>/SKILL.md`
> (instaladas em `~/.claude/skills/` ou `.claude/skills/`). Uma skill **não pode
> executar** comandos embutidos do CLI como `/model` — ela recomenda e entrega o
> comando pronto para o usuário copiar.

---

## Arquivo Principal: `model-selector/SKILL.md`

Skill para Claude Code no formato padrão (YAML frontmatter + instruções markdown).

**Frontmatter:**
```yaml
---
name: model-selector
description: |
  Analyzes the current task and selects the best AI model based on complexity,
  speed, and cost. TRIGGER when user says "select the best model", "which model
  should I use", "switch model for this task", "optimize model", or /model-select.
  Recommends from Anthropic (Haiku/Sonnet/Opus), OpenAI (mini/standard/codex),
  Google (Flash/Pro), and others. Outputs the exact switch command ready to copy.
---
```

**Lógica dentro da skill (instruções para Claude seguir):**

### Step 1 — Detectar provedor atual
- Se rodando em Claude Code → provedor = Anthropic
- Se usuário mencionar OpenAI/GPT → provedor = OpenAI
- Se não souber → perguntar

### Step 2 — Avaliar a tarefa usando 4 dimensões

| Dimensão | Peso | Sinais |
|---|---|---|
| Complexidade cognitiva | 40% | múltiplos constraints, raciocínio encadeado, novidade do problema |
| Tamanho do contexto | 20% | muitos arquivos, histórico longo, > 10k tokens |
| Qualidade exigida | 25% | produção/crítico vs. exploratório/rascunho |
| Velocidade/custo | 15% | "rápido", "só testando", "barato" |

### Step 3 — Mapear para modelo

**Anthropic (Claude Code):**
- Score baixo (0-33%) → `haiku` — classificação, formatação, tradução, Q&A simples
- Score médio (34-66%) → `sonnet` — código, análise, refatoração, explicações
- Score alto (67-100%) → `opus` — arquitetura, raciocínio profundo, decisões críticas
- Contexto muito grande (repo inteiro, históricos longos) → variantes `[1m]`
- Raciocínio prolongado → extended thinking / effort alto; pressa → fast mode (Opus)

**OpenAI:**
- Score baixo → `gpt-5.4-mini`
- Score médio → `gpt-5.5` (effort padrão)
- Score alto → `gpt-5.5` com reasoning effort alto
- Código especializado → `gpt-5.4-codex`

**Google:**
- Baixo → `gemini-flash`
- Médio → `gemini-pro`
- Alto → `gemini-ultra`

### Step 4 — Output

Para Claude Code: mostrar o comando exato pronto para copiar (`/model haiku`, `/model opus` etc.) + motivo em 1 linha. A skill **não executa** o comando — `/model` é um comando do usuário no CLI.
Para outros: mostrar o nome do modelo + onde trocar na plataforma.

---

## README.md

- O que é e por que usar
- Instalação: `npx skills add <repo>/model-selector`
- Uso: digitar `/model-select` ou pedir "select best model for this task"
- Como adaptar para OpenAI, Google, outros provedores
- Tabela de modelos por provedor com preços e casos de uso
- Contribuição (como adicionar novos provedores)

---

## models.md

Catálogo de referência (atualizado pela comunidade):
- Anthropic: Haiku 4.5, Sonnet 4.6, Opus 4.8, Fable 5 (+ variantes [1m], effort, fast mode)
- OpenAI: GPT-5.5, GPT-5.4-codex, GPT-5.4-mini (+ reasoning effort)
- Google: Gemini Flash, Pro, Ultra
- Outros: Mistral, LLaMA, etc.

---

## Ordem de implementação

1. `skill.md` — arquivo principal com toda a lógica de decisão
2. `models.md` — catálogo de referência
3. `README.md` — documentação e instalação

---

## Verificação

- Testar com `/model-select` no Claude Code em diferentes tipos de tarefa
- Verificar que o `description` da skill dispara nos casos corretos
- Confirmar que a skill executa `/model haiku` etc. corretamente no Claude Code
- Checar que para OpenAI ela apenas recomenda sem tentar executar comandos
