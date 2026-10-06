# ENJA-11. Privacy and Terms in Japanese, with a native reader's sign-off

Board key: `privacy-and-terms-in-japanese-with-a-native-reader-s-sign-off`.
Kind: feature. Priority normal. Needs ENJA-10.

## Why this one is different

Legal text, and text about children and parental consent (PRIV-02, PRIV-03).
The reviewer's pass is required but not enough on its own. Each phrase ships as
`agentReviewed` and is listed on the review sheet for a person, and the page
says which version governs.

## Do

1. `privacy.constants.ts` and `terms.constants.ts` into phrases, drafted with `back`.
2. A line at the top of the Japanese pages: the English version governs. This is the usual practice, and it is reviewed.
3. Run the reviewer, then list every phrase for a native read on the sheet.

## Done when

Both pages read in Japanese, the governing line is there, and the person-review list is on the sheet. John decides when a person has read it.

## Built (2026-10-06)

- The sentences are phrases: `privacy.*` and `terms.*` (`phrases.privacy.constants.ts`, `phrases.terms.constants.ts`),
  with their Japanese beside a literal back-translation (`ja.drafted.privacy.constants.ts`,
  `ja.drafted.terms.constants.ts`). `privacy.constants.ts` and `terms.constants.ts` keep the order of the page, each
  section's anchor and the kanji beside its heading, and the date. The English is the text the coverage tests read.
- Every Japanese phrase is stamped as read by the reviewer agent and carries an `ask`, so the review sheet lists all of
  them for a native reader, children's and consent sentences under their own question. A person's sign-off is John's to
  decide and is not recorded: `legalJapanese.coverage.test.ts` refuses a phrase that is neither read by a person nor
  waiting for one.
- The Japanese pages open with a line that says the English version governs (`GoverningNote`, drawn for every reader
  whose language is not English, never for an English reader).
- `src/app/privacy` and `src/app/terms` are off `PENDING_PATHS` and `RECORDED`.

## Open for a native reader

- The line's wording: 「このページの日本語版は参考訳です。英語版が正式な文書で、内容に違いがあるときは英語版が優先されます。」
  (the Terms page says 「この利用規約の日本語版は…」). `正本` or `正文` may be what a Japanese lawyer would write.
- The English sentence about a words-only account ("lives in one browser for 30 days unless you link Google, and then it
  goes") can be read two ways, and so can "and so are the applause, the reactions and the notes left on them". The
  Japanese says what each most plainly says; the English should be settled first.
