# Gomoku 五目並べ

Five in a row on a go board, for two players. Next.js 16, React 19, TypeScript,
Tailwind v4, Prisma + Postgres.

## Getting started

```bash
pnpm install
cp .env.example .env      # points at the local database below
pnpm local:db:up          # disposable Postgres in Docker
pnpm db:deploy            # apply migrations
pnpm dev                  # http://localhost:6600
```

`WEB_PORT` overrides the port. `pnpm local:db:reset` throws the database away
and rebuilds it from the migrations.

## Scripts

| Task | Command |
| --- | --- |
| Dev server (port 6600) | `pnpm dev` |
| Lint / fix | `pnpm lint` / `pnpm lint:fix` |
| Typecheck | `pnpm typecheck` |
| Unit tests | `pnpm test:unit` |
| End-to-end tests | `pnpm test:e2e` |
| Screenshots into `screenshots/` | `pnpm screenshots` |
| All gates | `pnpm quality:check` |
| Local database | `pnpm local:db:up` / `:down` / `:reset` |
| Migrations | `pnpm db:migrate` (dev) / `pnpm db:deploy` |

## How it is put together

The rules live in `src/lib/gomoku/engine.ts` and nowhere else. Every function
takes a `GameState` and returns a new one, so the same engine runs the board in
your browser, replays a stored game, and validates moves on the server. There
is no second implementation of "who has won".

A stored game is **a move list, never a board**. A board and a move list can
disagree; a move list replayed through the engine cannot.

- `src/lib/gomoku/` — engine, threat analysis, notation, replay. Pure, no React.
- `src/lib/history/` — reading and writing game history.
- `src/components/board/` — the board and its themes.
- `src/components/game/` — the local game, its session, settings and record.
- `src/components/live/` — games played from two devices.
- `src/app/api/` — the HTTP API.
- `e2e/` — Playwright specs, including the screenshot spec.

### Awareness is a lens, not a rule

`src/lib/gomoku/analysis.ts` reads a position and reports how it stands —
whether you can force a win, must answer a threat, or have already lost. The
engine never consults it. Turning awareness off changes what you are told and
nothing about what is legal.

The reading is shallow on purpose. It sees immediate wins, unanswerable fours
and the combined threats that follow from them, but it does not search. So
`lost` is reserved for positions that genuinely cannot be saved by one stone —
an open four already on the board. Everything short of that says "answer this",
not "it is over".

## The API

Listing endpoints answer `{ pagination, items }`, with `pagination` carrying
`page`, `pageSize`, `total` and `totalPages`. `page` is clamped against the real
total rather than rejected, so narrowing a filter never strands you on an empty
page. Ordering always ends with `id`, so paging cannot hide a row.

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/api/games` | List games. Paging, sorting, search, filters, facets. |
| `POST` | `/api/games` | Record a finished game with its moves. |
| `POST` | `/api/games/live` | Start a game for two devices. Returns a token per seat. |
| `GET` | `/api/games/:id` | One game with every move. |
| `DELETE` | `/api/games/:id` | Remove a game and its moves. |
| `GET` | `/api/games/:id/moves` | That game's moves, paged. |
| `POST` | `/api/games/:id/moves` | Play a stone in a shared game. |
| `GET` | `/api/players?q=` | Player-name autocomplete. |

`GET /api/games` accepts `page`, `pageSize`, `sortBy`
(`playedAt`/`moveCount`/`size`/`duration`), `sortDir`, `search`, `player`,
`result`, `variant`, `size`, `from` and `to`. Everything is validated with Zod
at the route boundary; an unknown sort column is a `400`, an unrecordable game
is a `422` listing what was wrong.

## Games played from two devices

`POST /api/games/live` returns `blackToken` and `whiteToken`. There is no
sign-in, so **a seat token is the seat**: whoever opens `/g/:id?p=<token>` plays
that colour. `/g/:id` without a token is a spectator view, and it is never shown
the seat links.

Every move is re-validated on the server — whose turn it is, whether the point
is free, whether the game is still running. The unique index on
`(gameId, number)` is the concurrency control: two devices racing to play the
same move number cannot both succeed.

Seat pages carry `robots: noindex`, and offer a QR code and an `sms:` link per
seat so a link can be handed over without any messaging infrastructure.

## Embedding the board

Use an iframe against `/embed`. It isolates CSS, JavaScript and React versions
completely, needs no shared build, and nothing the host sends can change the
rules:

```html
<iframe src="https://your-host/embed?size=9&theme=sumi&stones=neon"
        style="border:0;width:100%;height:640px" title="Gomoku"></iframe>
```

Parameters: `size` (9/13/15/19), `variant`, `obstacles`, `theme`, `stones`,
`coords=0`. Unknown values fall back rather than erroring.

The board posts messages outward to the host — `gomoku:ready`, `gomoku:resize`,
`gomoku:move`, `gomoku:result` — so a host can size the frame and react to
play:

```js
window.addEventListener("message", (event) => {
  if (event.data?.type === "gomoku:resize") frame.style.height = `${event.data.height}px`;
});
```

Framing is refused unless the host origin is listed in `EMBED_ALLOWED_ORIGINS`
(space-separated). Every route other than `/embed` refuses framing outright.

If you want deeper integration than an iframe, `src/lib/gomoku/` is a pure
TypeScript module with no React or database dependency and can be imported
directly.

### Using it inside a site that has its own sign-in

Seat tokens exist because this app has no accounts. A host that does have them
should map its own identities to seats and stop passing tokens through the
query string — `seatForToken` in `src/lib/history/liveGame.ts` is the single
place that decides which seat a request holds.

## Gates

`pnpm quality:check` runs lint, the 500-line file size gate, typecheck and the
unit tests. See `AGENTS.md` for the conventions those gates enforce.
