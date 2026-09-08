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
- `*.constants.ts` and `*.test.ts` are reported when long but do not fail the
  gate. A data table split in half becomes two files that must be kept in
  step, and a suite of forty focused cases is not complexity — the limit is
  there to catch a file doing too many jobs, which is a property of logic.

### Types And Constants Pattern

- Shared `type` and `Props` declarations live in adjacent `*.types.ts` files (for example `board.types.ts`), not inline in components.
- One constants module per component group (`Board.constants.ts`), not one per component.
- Domain values (`Stone`, `RuleVariant`, `GameStatus`) are compared through the constants in `src/lib/gomoku/gomoku.constants.ts`, never inline string literals. Display text for domain values comes from `STONE_DISPLAY` / `RULE_VARIANT_DISPLAY`.

### Engine Is Pure

- Game rules live only in `src/lib/gomoku/engine.ts` and the `src/lib/gomoku/rules/` modules it delegates to (winning lines, forbidden shapes, captures, turn length, openings), each unit tested beside its source. Components and hooks never inspect the board to decide outcomes; they call the engine.
- Every engine function returns a new `GameState` and leaves its input untouched.
- A rule variant is a row in `VARIANT_SPECS` (`gomoku.constants.ts`) plus its copy in `variants.constants.ts`. The engine reads the spec and never switches on a variant's name. Analysis (`threats.ts`, `analysis.ts`) is advisory and sits above the engine: it filters through the rules, never the other way round.
- Anything that asks "may this colour…" reads `rulesFor(settings, stone)` in `rules/handicap.ts`, which lays the handicap over the variant's spec. Never read `VARIANT_SPECS[...].lineRule`, `.forbidden`, `.captures` or `.stonesPerTurn` directly for a colour.

### New Game Gate

A rule variant is cheap to add and expensive to finish. The engine will play anything
you put in `VARIANT_SPECS`, so the work that gets skipped is everything that makes it a
game a person can find, understand and trust. None of that is optional.

**A game is not done until all of these are true.** They are enforced by
`src/lib/gomoku/variants.coverage.test.ts`, which runs in `pnpm test:unit`, so a game
that is missing any of them fails the build rather than shipping quietly.

- **It is tested.** At least one unit test under `src/lib/gomoku/` names the variant and
  exercises what makes it different. A variant that only rides the shared simulation
  loop is untested: the loop proves the engine does not crash, not that the rule is
  right. Test the rule that is new — the capture size, the wrap, the losing condition.
- **It survives the simulator.** `simulation.test.ts` plays every variant automatically,
  and `simulation.checks.ts` / `simulation.scan.ts` restate the rules by hand as an
  independent check. A new mechanism means extending the checker too. If the simulator
  cannot decide who won, neither can a player.
- **It is a solid game, not a rule.** Before it ships, play it out: it has to end, it
  has to be possible for either side to win, and it must not be decided in the opening
  by a move anyone would find. A variant that is a forced win, or that random play
  cannot finish, is a puzzle — say so on its rules page or leave it out.
- **It has a screenshot.** `public/art/games/<variant>.jpg`, from `pnpm screenshots:games`.
  The rules page, the games index and the family cards all show it. Regenerate after any
  change to board or branding.
- **It has full copy.** `RULE_VARIANT_DISPLAY` needs a label, a kanji name, a tagline, an
  origin, board advice, and at least three rule bullets; `rulesPageFor` must fill every
  section. If the game is our version of a published game, set `inspiredBy` — see
  `RULES_ATTRIBUTION`.
- **It belongs to a family.** Add it to `GAME_FAMILIES` in `families.ts`. A game in no
  family appears on no index page, so nobody will ever meet it.
- **It has an end-to-end test.** One Playwright case that opens the game and plays the
  move that shows its rule working.

TypeScript already forces the `VARIANT_SPECS` and `RULE_VARIANT_DISPLAY` rows, because
both are `Record<RuleVariant, …>`. The gate covers what types cannot see.

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
