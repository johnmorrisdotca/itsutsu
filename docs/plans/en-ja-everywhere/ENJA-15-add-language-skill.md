# ENJA-15. The add-language skill, for every app

Board key: `an-add-language-skill-one-recipe-for-adding-the-next-language-to-any-of-john-s-a`.
Kind: chore. Priority normal. Needs ENJA-14 and UmaKuma's four rows.

## Do

Write `add-language` as a skill, from "The process, for any app" in this folder's
README and what the tickets above actually ran into. It covers two jobs:

1. **Bringing an app to English and Japanese**: the `Speaker` model or the app's existing library, the gate with a pending list, sibling copy tables, dates and counts, emails, `<html lang>`, and the walk.
2. **Adding the next language to an app that is already bilingual**: declare it in `LOCALES`, draft the dictionary with `back`, generate the review sheet (`japaneseReview.ts` made general), offer it only when signed off. The reviewer for that language is a new agent made from `japanese-reviewer`'s pattern, and a person still signs off a language with no reviewer.

Keep it in a place every project can read. Each repo that uses it gets a
pointer in its AGENTS.md, and a copy in `.claude/skills/` where cloud agents
must see it.

## Done when

The skill is used once, end to end, on the first language from
`docs/plans/languages/`, and corrected by what that run finds.
