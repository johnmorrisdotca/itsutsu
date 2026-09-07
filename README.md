# Gomoku 五目並べ

Five in a row on a go board, played by two people at one screen.

Black opens. Players alternate placing stones on intersections of a 15 × 15
(or 19 × 19) board. The first to make an unbroken line of five, horizontally,
vertically or diagonally, wins.

Two rule variants are offered:

- **Freestyle**: five or more in a row wins.
- **Standard**: exactly five wins; an overline of six or more (長連) does not.

## Development

Node 24 and pnpm. Install and start the dev server on port 6600:

```sh
pnpm install
pnpm dev
```

| Task | Command |
| --- | --- |
| Dev server | `pnpm dev` |
| Unit tests (engine) | `pnpm test:unit` |
| Lint, LOC gate, typecheck, tests | `pnpm quality:check` |
| Production build | `pnpm build` |

## Layout

- `src/lib/gomoku/` — the pure game engine: types, constants, `engine.ts`
  (`createGame`, `playMove`, `undoMove`, `findWinningLine`) and notation
  helpers. No React, fully unit tested.
- `src/components/board/` — the board: SVG lines and star points with a grid
  of buttons laid over them, one per intersection.
- `src/components/game/` — the `useGame` hook that holds state, the status and
  settings panel, and `GameView` which composes the two.
- `src/app/` — the Next.js App Router page and layout.
