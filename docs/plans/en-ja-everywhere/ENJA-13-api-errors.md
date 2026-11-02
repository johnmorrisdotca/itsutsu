# ENJA-13. API errors a person can see, in their language

Board key: `api-errors-a-person-can-see-in-their-language`.
Kind: fix. Priority low. Needs ENJA-02.

## Why

About 250 English strings in `src/app/api/`. Only the ones a page shows to a
person matter: "that name is taken", "twenty games at once", and so on.

## Do

1. A route returns an error key and its values, never a sentence. The page says it through the speaker.
2. Leave log-only and operator-only messages in English, and mark the folder's rule in the gate.

## Done when

`src/app/api` is off the pending list, apart from a written list of operator-only routes.

## Done (2026-11-02)

- A refusal is a key and its values: `err.*` (the API, the history and phrase libraries, the party tables) and `chk.*` (why a puzzle's check will not take an answer). The Japanese is drafted with `back` and marked `ask` until it has been read.
- The answer keeps `error` in English and adds `code` and `values`; the page says the key through the speaker (`src/lib/api/refusalText.ts`). Statuses and the proxy's decisions are unchanged.
- Operator-only routes stay in English, listed in the gate's `EXCLUDED_PATHS`: `src/app/api/admin`, `members`, `invites`, `invites/[code]`, `site` and `embed-tokens`.
- `PENDING_PATHS` is empty, and `inlineEnglish.coverage.test.ts` holds it there.
- Left in English, in one path only: the reason Kazu's six puzzles, Awase and Kumimoji give from their own packages, and a Backwards guess's broken rule, inside "Not solved: …" when the server disagrees with the browser's check. Each needs its package to take words as an option.
