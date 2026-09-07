<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Workspace Gates

### File Size Gate

- Code files under `src/` must stay at or below 500 lines.
- Gate command: `pnpm loc:check`, run as part of `pnpm quality:check`.
- If a file approaches the limit, split by responsibility (`components/`, `lib/`, domain modules) rather than adding flags or nesting.

### Types And Constants Pattern

- Shared `type` and `Props` declarations live in adjacent `*.types.ts` files (for example `board.types.ts`), not inline in components.
- One constants module per component group (`Board.constants.ts`), not one per component.
- Domain values (`Stone`, `RuleVariant`, `GameStatus`) are compared through the constants in `src/lib/gomoku/gomoku.constants.ts`, never inline string literals. Display text for domain values comes from `STONE_DISPLAY` / `RULE_VARIANT_DISPLAY`.

### Engine Is Pure

- Game rules live only in `src/lib/gomoku/engine.ts` and the `src/lib/gomoku/rules/` modules it delegates to (winning lines, forbidden shapes, captures, turn length, openings), each unit tested beside its source. Components and hooks never inspect the board to decide outcomes; they call the engine.
- Every engine function returns a new `GameState` and leaves its input untouched.
- A rule variant is a row in `VARIANT_SPECS` (`gomoku.constants.ts`) plus its copy in `variants.constants.ts`. The engine reads the spec and never switches on a variant's name. Analysis (`threats.ts`, `analysis.ts`) is advisory and sits above the engine: it filters through the rules, never the other way round.
- Anything that asks "may this colour…" reads `rulesFor(settings, stone)` in `rules/handicap.ts`, which lays the handicap over the variant's spec. Never read `VARIANT_SPECS[...].lineRule`, `.forbidden`, `.captures` or `.stonesPerTurn` directly for a colour.

## Stack

- Next.js 16 (App Router), React 19, TypeScript 5, Tailwind v4.
- Node 24.x, **pnpm** (never npm/yarn).
- Vitest for unit tests.

## Scripts

| Task | Command |
| --- | --- |
| Dev server (port 6600, override with `WEB_PORT`) | `pnpm dev` |
| Lint / fix | `pnpm lint` / `pnpm lint:fix` |
| Typecheck | `pnpm typecheck` |
| Unit tests | `pnpm test:unit` |
| All gates | `pnpm quality:check` |
