# Backgammon and its relatives: the Tables family

**Status (2026-10-01): built on branch `sugoroku-site`. Not rated; no migration.**

John's late father, Chibi, played thousands of games of backgammon and its
variants on two play-by-mail sites, and his kept record is on the Honors roll
(`legacyPlayers.data.ts`). Every backgammon name in it said there was no game
here. They are played by Sugoroku (`@johnmorrisdotca/sugoroku`, 1.0.0), the
open-source package made for the purpose; its docs/VARIANTS.md says how each
name was read and from which pages (checked 2026-10-01).

## Decisions

1. **A party game, played round one device, against the computer, or on two
   devices.** Seven `PartyKind`s (backgammon, nackgammon, longGammon,
   hypergammon, backgammonRace, antiBackgammon, tabula), each the package's
   variant of the same name, all through one table (`src/components/party/sugoroku/`).
   Two devices use the existing party-online layer (`PartyTable`, `PartySeat`,
   `PartyAction`), so **no migration**: `ONLINE_GAMES` gains seven rows
   (`onlineSugoroku.ts`) and `ONLINE_VIEWS` one board.
2. **Not rated.** Real backgammon sites rate it, and so could this one, but the
   rated machinery is the engine's: a `Game` row of colours, a `Move` row of
   points, `recordResult`, ladders, IP and XP that read `RuleVariant`. A match
   is several games with a cube and dice, none of which those rows hold. Doing
   it is a plan of its own (a migration at least: a record column or a
   second move table, ladder rows per variant) and needs John's word, a Neon
   branch and a DS1 dump. Until then a table is never recorded, as every party
   table is, and a program earns nothing from it (XP is a fact about a
   recorded game).
3. **Seven games in one family, "Tables" 双六 (`/games/tables`), not one game
   with a variant setting.** They differ in where the checkers start, how many
   there are, what wins and how many dice are thrown, as Renju differs from
   Gomoku. The match length, the cube, gammons and the Crawford rule are *how a
   game is played*, chosen at its set-up: the party contract's "size" is the
   length in points (`SUGOROKU_LENGTHS`: 1, 3, 5, 7, 9 for backgammon,
   nackgammon and long gammon; 1, 3, 5 for hypergammon; 1, 5 for the race
   game; single only for anti-backgammon and tabula, as the sites offered
   them). The gate allows five lengths (not four boards) for these. Backgammon
   is also listed on the Dice shelf (`ALSO_LISTED_IN`).
4. **Chibi's names** moved from `NO_GAME_HERE` to `GAME_ALIASES`: each leads to
   its game, and a name that carries a match length ("Backgammon (7 Point)",
   "Pro Backgammon" = 5, "Pro Backgammon-9") puts `?points=N` in the link
   (`ALIAS_POINTS`, `aliasQuery`), which the game's Play button passes on and
   the set-up opens on. Levels 2 and 3 are tournament tiers, not rules.
   The sites' names appear only in the record; the rules pages use the
   generic names.

## How it plays

- A table is its seats and the package's own record text (`sugoroku 1`, the
  variant, the rules, a `seed`, then a line a turn): `src/lib/party/sugoroku/sugorokuTable.ts`.
  A move is made by adding a line, from the game as the last move left it; the
  record is replayed once for a table read from storage (`viewOf`).
- **The dice are the seed's** (`seededDice`). The roll is not a trip of its own:
  a turn is one move, the roll as the seed makes it and the play made with it,
  so a table on two devices costs one request a turn. The cube (double, take,
  drop) and giving up are moves too. Opening throws are made at once.
- A person plays by tapping a checker and the point, with Undo until Done
  (`useSugorokuTurn`); nothing is sent before Done.
- **Cost and cheating, stated.** A stored table holds its seed, so a person who
  reads the stored text could look ahead; they cannot make up dice, since every
  throw is held to the seed. A table on two devices is started with a seed the
  server draws, never the host's. The server replays nothing to answer a poll
  (the state is kept whole); a move is one decode, one replay of the new line.
- **The computer** is the package's four strengths: Beginner (random), Casual
  (greedy), Careful and Strong, with the cube it can reason about. On one device
  it moves in the page after a short pause; on two it is worked out in a
  browser at the table by the party worker, as every computer's is. They are
  not ladder tiers (`bots.constants.ts` is for rated games): a seat is
  "Computer (Strong)", and a program earns nothing here.

## Where things are

| What | Where |
|---|---|
| Rules, record, moves, computer | `src/lib/party/sugoroku/` |
| Copy for the seven | `sugoroku.copy.ts` (sources in the package's VARIANTS.md) |
| Two devices | `src/lib/party/online/onlineSugoroku.ts`, `components/party/online/SugorokuOnline.tsx` |
| Board, turn, stage, set-up | `src/components/party/sugoroku/` |
| Family and mark | `families.data.ts` (`tables`), `familyMarks.constants.ts` |
| Alias table | `src/lib/legacy/gameAliases.ts` |
| Pictures | `pnpm screenshots:party` (a scene each in `e2e/party-screenshots.spec.ts`) |
| Browser tests | `e2e/party-sugoroku.spec.ts` |

## Left for later

Rating (above); money play (`points: 0`) and the Jacoby rule and beavers, which
the package has; dragging a checker (tap and tap only); the package's sounds
(the site's dice sound is used); Plakoto, Fevga and acey-deucey, which the
package does not have yet; a "your move" notice (as every table, until the
digest exists); a Japanese review of the words (the board's own are a first
draft in the package).
