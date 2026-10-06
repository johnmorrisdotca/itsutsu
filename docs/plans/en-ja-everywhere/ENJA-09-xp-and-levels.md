# ENJA-09. XP awards, the hundred level names and the points ladder in English and Japanese

Board key: `xp-awards-the-hundred-level-names-and-the-points-ladder-in-english-and-japanese`.
Kind: feature. Priority normal. Needs ENJA-02.

## Where

- `src/lib/xp/xp.constants.ts` (about 120 strings).
- `levelNames.constants.ts` (100 names with English notes, 18 with kanji).
- `/xp` and its scope switch (Everywhere 通算 / Itsutsu only 五).
- `ImportedXpNote`, `MemberLevel`, the points ladder.

## Watch

- The level names are a set. The reviewer judges all 100 together, so the ladder of titles climbs in Japanese as it does in English.
- The XP toast already goes through phrases (`xp.`), so keep its keys.

## Done when

`src/lib/xp` is off the pending list, and the 100 names are reviewed as a set.
