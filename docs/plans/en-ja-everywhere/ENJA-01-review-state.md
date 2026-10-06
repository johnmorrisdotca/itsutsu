# ENJA-01. Each Japanese phrase records who read it, and the reviewer reads the 179 drafted ones

Board key: `japanese-reviewer-agent-signs-off-drafted-japanese-and-each-phrase-records-who-r`.
Kind: chore. Priority high. Needs nothing.

## Why

`ja.drafted.constants.ts` says an entry leaves only when a Japanese reader has
read it. No reader was found, so all 179 are still unread, and the file cannot
say which have been checked by anything. John, 2026-10-06, made the
`japanese-reviewer` agent his reader (see this folder's README).

## Do

1. Add `review: { by: "agent" | "person"; on: "YYYY-MM-DD" } | undefined` to
   `DraftedPhrase`. Undefined means drafted. Keep the two files as they are:
   `ja.site` is John's own words and needs no review.
2. `japaneseReview.ts`: the sheet gets a Review column and lists `question`
   items and every phrase still awaiting a person at the top.
   `japanese.coverage.test.ts` keeps the sheet current.
3. Run `japanese-reviewer` over all 179, by prefix (`nav.`, `account.`,
   `filter.`, and so on), with the English source and the screen each is on.
   Apply its `fix` and `better` verdicts, update `back`, stamp `review`.
4. Bring its `question` items to John in one list, in English.
5. Write the terminology it settles (対局, 盤, 手, ゲーム…) into
   `docs/plans/en-ja-everywhere/TERMS.md`. Every later ticket's reviewer run
   reads it.

## Done when

- Every drafted entry has a `review`, or is listed as a question for John.
- The sheet is regenerated (`WRITE_JAPANESE_REVIEW=1 pnpm vitest run src/lib/i18n`).
- `TERMS.md` exists.
