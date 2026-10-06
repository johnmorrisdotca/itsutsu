# ENJA-02. A gate on English typed outside the phrase table, with a pending list that only shrinks

Board key: `a-gate-on-english-typed-outside-the-phrase-table-with-a-pending-list-that-only-s`.
Kind: chore. Priority high. Needs nothing. Every later ticket needs this one.

## Why

Nothing on Itsutsu stops a new hard-coded sentence, so the site can grow
English faster than it is translated. UmaKuma solved this with
`scripts/check-i18n-strings.mjs` (`pnpm i18n:check`). It fails on JSX text,
on `title`/`aria-label`/`placeholder`/`alt` literals and on untranslated copy
strings. Its list of pending paths was emptied one area at a time.

## Do

1. Port UmaKuma's script to `scripts/check-i18n-strings.mjs` (read it from
   `origin/main` there, `git show origin/main:scripts/check-i18n-strings.mjs`).
   Add it as a lane in `scripts/preflight.mjs` and a leg of the `verify`
   matrix: parallel, never another `&&`.
2. `PENDING_PATHS` starts with every folder that has English today, each named
   with the ticket that will take it off (ENJA-03 to ENJA-13). A test fails if
   the list grows, or if a pending path no longer has any English in it (so a
   finished area must come off).
3. Split `PHRASES` into `phrases.<area>.constants.ts` files, as UmaKuma did,
   before it grows from 193 to thousands. The same for the Japanese halves.
4. Allowed without a phrase: brand names (Itsutsu, XP), a game's kanji, coordinates and notation, and test files. Each allowance is written in the script with its reason.
5. AGENTS.md: a short "Every Word Goes Through The Phrase Table" section.
   New visible text is added to `PHRASES` in English and Japanese, the
   Japanese is drafted with `back` and run past `japanese-reviewer`, and the
   gate is named.

## Done when

`pnpm quality:check` runs the gate. A new inline sentence anywhere outside
the pending list fails the build.
