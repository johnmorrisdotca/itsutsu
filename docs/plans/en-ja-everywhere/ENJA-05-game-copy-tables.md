# ENJA-05. Every game's rules, tagline, openings, bots and family names in English and Japanese

Board key: `every-game-s-rules-tagline-openings-bots-and-family-names-in-english-and-japanes`.
Kind: feature. Priority high. Needs ENJA-02. The largest body of text on the site.

## Why

`RULE_VARIANT_DISPLAY` (`src/lib/gomoku/variants.constants.ts`) holds 48
variants' label, kanji, tagline, origin, alsoKnownAs, about 200 rule bullets
and board advice, all English. `i18n.constants.ts` already names the shape:
domain copy "gains a per-locale sibling table".

## Do

1. Shape: the English row stays where it is. A Japanese sibling
   `variants.ja.constants.ts` is `Record<RuleVariant, VariantCopyJa>`, with
   `back` for each sentence. `rulesPageFor` and every reader of the copy take
   the speaker and pick. The kanji field stays: it is the game's name, not copy.
2. The same for `OPENING_DISPLAY`, `BOT_PROFILES`, `GAME_FAMILIES`' names and blurbs,
   `src/lib/learn/rulesPage.ts`, and the `RULES_ATTRIBUTION` lines.
3. `variants.coverage.test.ts` gains: every variant has full Japanese copy.
   A new game then cannot ship English-only, in the same way it cannot ship without a picture.
   Add that line to the New Game Gate in AGENTS.md.
4. Draft in batches of about eight games and run `japanese-reviewer` on each batch
   with `TERMS.md`. Established Japanese names (五目並べ, 連珠, 囲碁, オセロ
   is a trademark, リバーシ) come from the reviewer, not a guess.

## Done when

Every rules page reads fully in Japanese, the coverage test holds it, and
`src/lib/gomoku` is off the pending list.
