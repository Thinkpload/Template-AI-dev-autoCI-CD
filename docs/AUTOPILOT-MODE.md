# Autopilot Mode — Agent Teams + BMAD Quality Gates

## Что это

Режим, при котором Claude Code **самостоятельно** принимает решения о проверках, дополнениях и качестве — без постоянного участия человека.

**Реализовано через 4 слоя:**

| Слой | Что делает | Где настроено |
|------|-----------|---------------|
| Agent Teams | Параллельные агенты-тиммейты | `settings.json` → `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` |
| Hooks Quality Gates | Автоматические проверки lint/test/types | `settings.json` → `hooks.TeammateIdle`, `hooks.TaskCompleted` |
| Stop Hook | Продолжение работы без ожидания человека | `settings.json` → `hooks.Stop` |
| Rules + Command | Поведенческие правила автопилота | `.claude/rules/autopilot.md` + `/autopilot` |

---

## Архитектура

```
Человек говорит "автопилот" или /autopilot
        │
        ▼
┌─────────────────────────────────┐
│  .claude/commands/autopilot.md  │  ← Slash command: загружает контекст,
│                                 │     читает STATE.md, начинает цикл
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  .claude/rules/autopilot.md     │  ← Правила: что можно/нельзя сам,
│                                 │     quality gate chain, self-correction
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXECUTION LOOP                           │
│                                                             │
│  Task → BMAD Skill → Quality Gate → Commit → Next Task     │
│    │                      │                      │          │
│    │                      ▼                      │          │
│    │         ┌─────────────────────┐             │          │
│    │         │  TeammateIdle Hook  │ ← exit 2 = │          │
│    │         │  (lint, tests,      │   возврат   │          │
│    │         │   debug artifacts)  │   задачи    │          │
│    │         └─────────────────────┘             │          │
│    │                                             │          │
│    │         ┌─────────────────────┐             │          │
│    │         │ TaskCompleted Hook  │ ← exit 2 = │          │
│    │         │ (tsc, tests, lint,  │   блок      │          │
│    │         │  uncommitted files) │   завершения│          │
│    │         └─────────────────────┘             │          │
│    │                                             ▼          │
│    │         ┌─────────────────────┐  ┌──────────────────┐  │
│    │         │  Stop Hook          │→ │ Автопилот активен?│  │
│    │         │  (autopilot-        │  │ Есть задачи?     │  │
│    │         │   continue.js)      │  │ Контекст > 25%?  │  │
│    │         └─────────────────────┘  └───────┬──────────┘  │
│    │                                     да   │  нет        │
│    │                                     ▼    ▼             │
│    │                               Продолжить  СТОП        │
│    │                               работу                   │
└────┴────────────────────────────────────────────────────────┘
```

---

## Как активировать

### Способ 1: Slash command

```
/autopilot
```

Claude прочитает `.planning/STATE.md` и `.planning/ROADMAP.md`, определит текущую фазу и начнёт работать.

### Способ 2: Естественный язык

```
автопилот
autopilot on
работай сам
```

Правила из `.claude/rules/autopilot.md` загружаются автоматически в каждой сессии.

### Способ 3: GSD фазовое выполнение

```
/gsd:execute-phase 04
```

GSD сам оркестрирует выполнение плана. Hooks гейтят качество. Не требует полного автопилота — работает в рамках одной фазы.

---

## Что реально внедрено

### 1. `settings.json` — полная конфигурация

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "hooks": {
    "SessionStart":   [...],  // GSD update check
    "PostToolUse":    [...],  // Context monitor (35%/25%)
    "TeammateIdle":   [...],  // Quality gate: агент idle
    "TaskCompleted":  [...],  // Quality gate: task done
    "Stop":           [...]   // Autopilot continuation
  }
}
```

### 2. `.claude/rules/autopilot.md` — поведенческие правила

Загружается **автоматически** в каждую сессию (Claude Code читает все файлы из `.claude/rules/`). Содержит:

- **Quality Gate Chain** — какую валидацию запускать для каждого типа артефакта:

| Артефакт | Автоматическая валидация |
|----------|------------------------|
| Product Brief | Все секции заполнены, нет TBD |
| PRD | `bmad-validate-prd` |
| UX Design | Все user flows из PRD покрыты |
| Architecture | Все REQ-ID из PRD адресованы |
| Epics & Stories | `bmad-check-implementation-readiness` |
| Код (любая story) | lint → tests → tsc → `bmad-code-review` |
| Sprint | `bmad-sprint-status` |

- **Self-Correction Protocol:**
  1. Lint/type error → fix, re-run
  2. Test failure → read output, fix root cause, re-run (max 3)
  3. Validation failure → address each point, re-validate
  4. 3 failures подряд → `bmad-code-review` → apply findings
  5. Всё ещё stuck → report to user, skip to next task

- **Phase Transition Logic:** если человек не отвечал 5+ минут — переходить к следующему шагу автоматически

### 3. `.claude/commands/autopilot.md` — slash command

Startup checklist при активации:
1. Прочитать STATE.md + ROADMAP.md
2. Определить текущую фазу и прогресс
3. Показать статус (одна строка)
4. Начать работу над следующей задачей

Execution loop:
```
Task → BMAD Skill → Quality Gate → Commit → Report → Next
```

### 4. `.claude/hooks/teammate-idle-gate.js`

Срабатывает на событие `TeammateIdle` — когда агент-тиммейт завершает работу.

| Проверка | Команда | Таймаут | При провале |
|----------|---------|---------|-------------|
| Lint | `npm run lint` | 30s | Exit 2 → возврат задачи |
| Tests | `npm test` | 60s | Exit 2 → возврат задачи |
| Debug artifacts | git diff analysis | 10s | Exit 2 → возврат задачи |

Что ищет в debug artifacts: `console.log()`, `debugger;`, `TODO: HACK`, `FIXME: REMOVE`

### 5. `.claude/hooks/task-completed-gate.js`

Срабатывает на событие `TaskCompleted` — когда задача помечается как done.

| Проверка | Команда | Таймаут | При провале |
|----------|---------|---------|-------------|
| TypeScript | `npx tsc --noEmit` | 45s | Exit 2 → блок |
| Tests | `npm test` | 120s | Exit 2 → блок |
| Lint | `npm run lint` | 30s | Exit 2 → блок |
| Git clean | `git status --porcelain` | 10s | Exit 2 → блок |

### 6. `.claude/hooks/autopilot-continue.js`

Срабатывает на событие `Stop` — после каждого ответа Claude.

Логика:
1. Читает `.planning/STATE.md`
2. Ищет `autopilot: true` (или `active`/`on`)
3. Проверяет что контекст > 25% (через metrics от context-monitor)
4. Если автопилот активен и контекст достаточен → инжектит напоминание продолжить работу

**Это ключевой механизм:** без него Claude остановится после каждого ответа и будет ждать пользователя.

---

## Как это работает с BMAD по фазам

### Фаза 1 — Analysis

```
/autopilot
→ rules/autopilot.md загружены
→ Claude читает STATE.md: "фаза = analysis"
→ Запускает bmad-create-product-brief
→ Brief готов → автопроверка: все секции, нет TBD
→ Gate passed → запускает bmad-domain-research
→ Research готов → переход к Planning
→ Stop hook → "autopilot active, continue" → Claude продолжает
```

### Фаза 2 — Planning

```
→ Запускает bmad-create-prd
→ PRD готов → автозапуск bmad-validate-prd
→ Валидация failed → self-correction: фиксит, re-validate
→ Валидация passed → запускает bmad-create-ux-design
→ UX готов → проверка покрытия user flows
→ Stop hook → продолжает
```

### Фаза 3 — Solutioning

```
→ Запускает bmad-create-architecture
→ Архитектура готова → проверка REQ-ID coverage
→ Запускает bmad-create-epics-and-stories
→ Stories готовы → bmad-check-implementation-readiness
→ Readiness failed → доработка → re-check
→ Readiness passed → переход к Implementation
```

### Фаза 4 — Implementation

```
→ bmad-sprint-planning
→ Для каждой story:
  → bmad-create-story (spec)
  → bmad-dev-story (код)
  → TeammateIdle hook: lint + tests + debug check
    → failed? → задача возвращена агенту с фидбеком
    → passed? → продолжаем
  → bmad-code-review (3 слоя)
  → TaskCompleted hook: tsc + tests + lint + git clean
    → failed? → блок, fix, retry
    → passed? → commit
→ Stop hook → следующая story
→ Все stories done → bmad-sprint-status
```

---

## Permissions

Для работы автопилота нужны permissions в `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run lint*)",
      "Bash(npm run test*)",
      "Bash(npm run build*)",
      "Bash(npx tsc --noEmit)",
      "Bash(npx vitest run*)",
      "Bash(git add*)",
      "Bash(git commit*)"
    ]
  }
}
```

**Без этих permissions** Claude будет спрашивать подтверждение на каждый lint/test/commit — автопилот потеряет смысл.

Для полного автопилота без вопросов:
```bash
claude --dangerously-skip-permissions
```

---

## Безопасность

### Автопилот делает сам (safe operations):
- Создание/редактирование файлов
- Локальные `git commit`
- `npm run lint`, `npm test`, `npm run build`
- Запуск BMAD skills и validations
- Code review
- Переход между фазами

### Автопилот спрашивает (dangerous operations):
- `git push` (любой)
- `git push --force`
- Удаление файлов/веток
- Изменение `.github/workflows/*`
- `npm publish`
- Изменение permissions/secrets

### Аварийный стоп
- **Ctrl+C** — немедленная остановка
- **Escape** — мягкая остановка
- **"стоп"/"stop"/"pause"** — автопилот отключается

### Автоматический стоп
- Контекст ≤ 25% (context-monitor) → autopilot-continue.js не инжектит продолжение
- 3+ неудачных попытки на одной задаче → report + skip

---

## Чтобы автопилот знал что он активен

В `.planning/STATE.md` должна быть строка:

```markdown
autopilot: true
```

Команда `/autopilot` должна добавить эту строку при активации. При деактивации — убрать.

Хук `autopilot-continue.js` читает STATE.md и ищет именно этот флаг.

---

## Troubleshooting

### Автопилот не продолжает работу после ответа
1. Проверь `autopilot: true` в `.planning/STATE.md`
2. Проверь что `Stop` hook подключён в `settings.json`
3. Тест: `echo '{"cwd":"'$(pwd)'"}' | node .claude/hooks/autopilot-continue.js`

### Hooks не срабатывают
1. Проверь `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` = `"1"`
2. Проверь что файлы хуков существуют: `ls .claude/hooks/`
3. Тест: `echo '{}' | node .claude/hooks/teammate-idle-gate.js; echo $?`

### Агент зацикливается на gate
Gate возвращает exit 2, агент фиксит, gate снова exit 2.

Защита:
- Таймауты на каждую проверку (30-120s)
- При ошибке самого хука → silent exit 0 (пропуск)
- Rules: max 3 попытки, потом skip

### Контекст заканчивается
- `gsd-context-monitor.js` предупреждает при 35% (WARNING) и 25% (CRITICAL)
- При CRITICAL `autopilot-continue.js` не инжектит продолжение
- Агент предлагает `/gsd:pause-work`

---

## Все файлы системы

| Файл | Тип | Назначение |
|------|-----|-----------|
| `.claude/settings.json` | Config | Env vars, все hooks, statusline |
| `.claude/settings.local.json` | Config | Permissions для автопилота |
| `.claude/rules/autopilot.md` | Rules | Поведенческие правила (авто-загрузка) |
| `.claude/commands/autopilot.md` | Command | `/autopilot` — активация |
| `.claude/hooks/teammate-idle-gate.js` | Hook | TeammateIdle quality gate |
| `.claude/hooks/task-completed-gate.js` | Hook | TaskCompleted quality gate |
| `.claude/hooks/autopilot-continue.js` | Hook | Stop → продолжение работы |
| `.claude/hooks/gsd-context-monitor.js` | Hook | PostToolUse → мониторинг контекста |
| `.claude/hooks/gsd-statusline.js` | Hook | Status bar метрики |
| `.planning/STATE.md` | State | `autopilot: true` — флаг активности |
