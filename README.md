# vuegrate

A CLI codemod that migrates Vue 2 components to Vue 3: Options API → Composition API (`<script setup>`), plus common template syntax changes.

**English** | [Русский](#русский)

## Quick start

```bash
npx vuegrate ./src
```

By default this writes changes straight to your files — run with `--dry-run` first to preview the diff before anything is modified.

## What it converts

**Script (Options API → Composition API)**
- `data()` → `ref()`
- `methods` → plain functions
- `computed` → `computed(() => ...)`
- `watch` (shorthand, function, and `{ handler, deep, immediate }` forms) → `watch()`
- Lifecycle hooks (`mounted`, `beforeDestroy` → `onBeforeUnmount`, etc.) → `onMounted` / etc. `created` and `beforeCreate` are inlined directly, since `setup()` already runs at that point
- `props` → `defineProps()`
- `emits` (explicit or inferred from `this.$emit(...)` calls) → `defineEmits()`, and `this.$emit(...)` → `emit(...)`
- `this.xxx` references are resolved to `xxx.value` (refs), `props.xxx` (props), or a plain call (methods) — this pass only touches names it can confidently identify (`this.$refs`, `this.$nextTick`, etc. are left alone)
- Leftover options it can't convert (`mixins`, `components`, `name`, ...) are preserved via `defineOptions()`
- `<script>` is rewritten to `<script setup>`

**Template**
- `.native` modifier removed (no longer needed in Vue 3)
- `slot` / `slot-scope` → `v-slot`
- `.sync` modifier → `v-model:propName`
- Filters (`{{ value | filter }}`, including chains and arguments) → function calls (`{{ filter(value) }}`)

## Flags

| Flag | Description |
|---|---|
| `--dry-run` | Print a diff instead of writing to disk |
| `--only=<names>` | Run only specific transforms, comma-separated (e.g. `--only=data,methods,props`) |
| `--ext=<extensions>` | File extensions to scan, default `.vue` |

## Known limitations

This is an early-stage tool — always run with `--dry-run` first, review the diff, and commit your working tree before applying changes.

- Event names passed to `this.$emit()` dynamically (not as a string literal) aren't picked up automatically
- `this.` resolution only recognizes names declared by this tool's own script transforms in the same file — unusual or highly dynamic component code may need manual cleanup
- Components already using `<script setup>` are left as-is
- Deep/mixin-based inheritance patterns aren't rewritten, only preserved via `defineOptions()`

## Status

Early MVP, under active development. Issues and PRs welcome.

## License

MIT

---

## Русский

CLI-инструмент для автоматической миграции Vue 2 → Vue 3: Options API → Composition API (`<script setup>`), плюс основные изменения синтаксиса шаблонов.

### Быстрый старт

```bash
npx vuegrate ./src
```

По умолчанию изменения сразу пишутся в файлы — запустите с `--dry-run`, чтобы посмотреть diff, прежде чем что-то применять изменения.

### Что конвертирует

**Script:** `data` → `ref`, `methods` → функции, `computed` → `computed()`, `watch` (все формы записи) → `watch()`, lifecycle-хуки → `onMounted`/`onBeforeUnmount`/и т.д. (`created`/`beforeCreate` — инлайнятся напрямую), `props` → `defineProps()`, `emits`/`this.$emit()` → `defineEmits()` + `emit()`, обращения `this.xxx` резолвятся в `xxx.value`/`props.xxx`/обычный вызов, `<script>` переименовывается в `<script setup>`.

**Template:** удаление `.native`, `slot`/`slot-scope` → `v-slot`, `.sync` → `v-model:propName`, фильтры → вызовы функций.

### Флаги

| Флаг | Описание |
|---|---|
| `--dry-run` | Показать diff без записи на диск |
| `--only=<имена>` | Применить только указанные трансформации через запятую (например `--only=data,methods,props`)|
| `--ext=<расширения>` | Какие расширения сканировать, по умолчанию `.vue` |

### Ограничения

Инструмент на раннем этапе — рекомендуется запускать с флагом `--dry-run`, проверять diff и коммитить рабочее состояние перед применением изменений. Динамические имена событий в `this.$emit()`, компоненты уже на `<script setup>`, и глубокая логика через `mixins` — не покрываются автоматически.

### Лицензия

MIT
