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
