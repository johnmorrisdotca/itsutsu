# Every word in English and Japanese, before any third language

John, 2026-10-06: "we should make sure all apps are EN/JP support and then add
the next ones once we're ready for it." Then: "focus only in Itsutsu and
Umakuma for now. the others can go later, if you correctly document the
process or work needed."

So this plan does three things:

- It takes **Itsutsu** from a translated frame to a fully bilingual site (ENJA-01 to ENJA-15 below).
- It finishes **UmaKuma**, which is most of the way there (four rows on its board).
- It writes down **the process and each other app's status**, so any of them can be started later without surveying again.

It comes before `docs/plans/languages/` (the eleven vint.ee languages). That
plan still holds, but its first language waits until this one is done. Its
LANG-00 is the add-language skill here (ENJA-15) plus the picker work.

## How Japanese is verified

John does not read Japanese, and both sites publish Japanese under his name.
Until now the rule was "an entry leaves the drafted file only when a Japanese
reader has read it". No reader was found, so nothing left it: 179 drafted
phrases on Itsutsu and 4,886 on UmaKuma, all unread.

John, 2026-10-06: "you have a japanese expert language agent that handles the
verificatio for me." That agent is `japanese-reviewer`
(`~/.claude/agents/japanese-reviewer.md` on John's Mac). It checks the following for every string:

- grammar and natural phrasing
- the right level of politeness for a button compared with a sentence
- the established game and learning terms
- whether the text fits on a phone
- that placeholders survive
- that counters read right at 0, 1 and many
- what each kanji name actually means

It reports in English, with a literal back-translation, a verdict and a proposed
wording for each string, so John can see what would ship.

What changes in the code:

- **Each Japanese phrase records who has read it:** `drafted` (a machine wrote
  it), `agentReviewed` (the reviewer passed it, with the date) or
  `personReviewed` (a native reader signed it off). The gate and the review
  sheet show the state, and only `drafted` blocks.
- **High-stakes text still gets a person.** The reviewer marks legal text
  (Privacy, Terms), anything about children or consent, payments and brand
  names `question` and recommends a native read. Those ship as `agentReviewed`
  and are listed on the review sheet for a person.
- **Every ticket below runs the reviewer on the Japanese it adds, before it
  lands.** That is part of each ticket's done list, not a follow-up.

## What there is (surveyed 2026-10-06)

### Itsutsu

| | Today |
|---|---|
| Mechanism | `PHRASES` in `src/lib/i18n/i18n.constants.ts`, a `Speaker` (`say`, `pair`, `pairName`), `useSpeaker()` on the client |
| Phrases | **193**: 14 of John's own words (`ja.site.constants.ts`), 179 machine-drafted (`ja.drafted.constants.ts`, each with `back`) |
| Locales | en and ja offered; es, zh and de declared with no dictionary |
| Chosen by | just-chosen cookie, then the account, then the `lang` cookie, then `Accept-Language`, then en. The address never changes |
| Gates | every phrase answered, placeholders kept, every key rendered somewhere, the Japanese halves kept apart, the review sheet current, the plain-English glossary |
| Not gated | **inline English**. Nothing stops a new hard-coded sentence |
| Translated | about 5% of visible strings: the navigation, footer, account menu, filters, feed, catalogue lines, rivalry board and XP notice. The body of almost every page is English |
| Hard-coded | about 2,800 prose literals in `.ts`/`.tsx`, plus about 1,180 inline JSX texts and string props |

Where the English is, in order of size:

| Area | Roughly | Where |
|---|---|---|
| Rules and game copy | 342 | `src/lib/gomoku/variants.constants.ts` (48 variants: label, tagline, origin, alsoKnownAs, about 200 rule bullets, board advice) |
| XP and levels | 233 | `src/lib/xp/xp.constants.ts`, `levelNames.constants.ts` (100 level names, 18 with kanji) |
| Puzzles | 410 | `src/lib/puzzles/puzzles.constants.ts`, `src/components/puzzles/` |
| Party and card games | 410 | `src/components/party/`, `src/lib/party/`, `src/lib/cardGames/cardGames.copy.ts` |
| API errors | 247 | `src/app/api/` |
| Account pages | 231 | `src/components/mine/` |
| Set-up and game screens | 308 | `live.constants.ts`, `game.constants.ts`, `resultWords.ts`, `resultCard.constants.ts` |
| About, home, Privacy, Terms | 275 | `src/app/about`, `src/app/page.tsx`, `privacy.constants.ts`, `terms.constants.ts` |
| Learn | 151 | `src/lib/learn/` |
| Emails | about 30 | `src/lib/mail/`: none read the member's language |

Other things in the way:

- **About 200 hand-written "English 漢字" pairs.** These are `font-mincho` spans outside `Paired`/`OneName`, so a Japanese reader sees both halves.
- **About 194 hand-built plurals** (`=== 1 ?`, `+ "s"`).
- **Dates and numbers with hard-coded locales.** `en-US` is written into `MemberStrip`, `MyXp` and `FeedLine`, and `en-GB` into `PhraseSetup` and `rating/figures.ts`. English month and day names are hard-coded in `SectionedDocument`, `recordMonth` and `daysOff`.
- **English inside packages.** Hitotsu's colour and card words, and Tenka's territory names.

### UmaKuma

| | Today |
|---|---|
| Mechanism | the same `Speaker` model, ported from Itsutsu and grown: about 4,900 phrases in about 70 `phrases.<area>.constants.ts` files |
| Japanese | 4,886 machine-drafted, all with `back`, none reviewed; `JA_ALREADY_SAID` is empty |
| Locales | en-CA (default), en-US (selectable, no dictionary, falls back to en-CA), ja |
| Chosen by | `Account.locale`, then the `umakuma-locale` cookie, then `Accept-Language`; public pages are cached per locale |
| Gates | `pnpm i18n:check` (`scripts/check-i18n-strings.mjs`) fails on inline English, with nothing pending; the phrase and Japanese coverage tests |
| Translated | about 90 to 95% of what a member sees. Admin and API errors are English, which is deliberate |
| Left | the review of 4,886 phrases, about 78 hard-coded `en-*` locales in date and number formatting, about 71 hand-built plurals, and member-facing English in `src/lib` (XP awards, personas, capabilities, source showcase) |

UmaKuma is the model for Itsutsu's next step. Its gate and its per-area phrase
files are exactly what Itsutsu lacks, and porting them is ENJA-02.

## Itsutsu tickets, in order

Each file in this folder is one ticket. The board row's detail says `Plan:
docs/plans/en-ja-everywhere/ENJA-NN-…`. The parent row is
`every-word-on-itsutsu-in-english-and-japanese-route-all-visible-text-through-the`.

| Ticket | What | Needs |
|---|---|---|
| [ENJA-01](ENJA-01-review-state.md) | Each phrase records who read it; the reviewer passes the 179 drafted phrases | nothing |
| [ENJA-02](ENJA-02-inline-english-gate.md) | A gate on inline English with a pending list that only shrinks; phrases split per area | nothing |
| [ENJA-03](ENJA-03-one-language-a-line.md) | The hand-written "English 漢字" pairs go through `Paired`/`OneName` | ENJA-02 |
| [ENJA-04](ENJA-04-dates-numbers-plurals.md) | Dates, numbers and counts in the reader's language | ENJA-02 |
| [ENJA-05](ENJA-05-game-copy-tables.md) | Per-language copy for every game: rules, taglines, openings, bots, families | ENJA-02 |
| [ENJA-06](ENJA-06-set-up-and-play.md) | The set-up screen, the game screen and every ending | ENJA-05 |
| [ENJA-07](ENJA-07-puzzles.md) | Puzzles | ENJA-05 |
| [ENJA-08](ENJA-08-party-and-cards.md) | Party and card games, and the packages' words | ENJA-05 |
| [ENJA-09](ENJA-09-xp-and-levels.md) | XP, the 100 level names, the points ladder | ENJA-02 |
| [ENJA-10](ENJA-10-pages.md) | Home, About, Learn, players, history, My account, the feed and inbox | ENJA-02 |
| [ENJA-11](ENJA-11-privacy-and-terms.md) | Privacy and Terms, with a native read | ENJA-10 |
| [ENJA-12](ENJA-12-emails.md) | Every email in the member's language | ENJA-02 |
| [ENJA-13](ENJA-13-api-errors.md) | The API errors a person can see | ENJA-02 |
| [ENJA-14](ENJA-14-done-check.md) | Done: the pending list is empty, both languages played end to end at phone and desk width | all above |
| [ENJA-15](ENJA-15-add-language-skill.md) | The add-language skill, for every app, from what this plan learned | ENJA-14, UmaKuma's four |

ENJA-03 to ENJA-13 can run side by side once ENJA-02 has landed. Each one
touches its own area, and each takes its own paths off the pending list.

## UmaKuma rows (on UmaKuma's board, `pnpm task` there)

| Row | What |
|---|---|
| `cmuwg57xn000tl404j7urppk9` | The reviewer checks all 4,886 drafted phrases, module by module; each phrase records who read it (the same three states as ENJA-01) |
| `cmuwg58sk000ul4040kvsxx39` | Dates and numbers in the reader's language (about 78 hard-coded `en-*`) |
| `cmuwg59kn000vl4044wblvcqc` | Counts that read right in Japanese (about 71 hand-built plurals) |
| `cmuwg5abs000wl404vpfa2njr` | Member-facing English left in `src/lib`; the gate extended to cover it. Admin and API stay English, recorded as a decision |

**Decided, for review:** UmaKuma's en-US stays selectable and keeps falling
back to en-CA's text. Spelling is the only difference, and the site's rule is
Canadian spelling.

## The process, for any app

This is what ENJA-15 turns into a skill. Every step has been done on Itsutsu or
UmaKuma, so none of it is theory.

1. **One mechanism: the `Speaker` model.**
   - A typed `PHRASES` catalogue, split into one file per area.
   - One dictionary per language, as a `Record<PhraseKey, …>` so the type refuses a partial one.
   - `say`/`pair` on the server and `useSpeaker()` on the client.
   - The locale read from the account, then a cookie, then `Accept-Language`. The address never changes.
   
   Itsutsu's `src/lib/i18n/` is the small reference, UmaKuma's the large one. An app on next-intl (WazaDB) or vue-i18n (judo-kata-judge) keeps its library, and gets steps 2 to 6 in that library's terms.
2. **A gate on inline English, with a pending list.** Port UmaKuma's `check-i18n-strings.mjs`, list every unported folder as pending, and take a folder off only when it is done. The list may only shrink.
3. **Copy that belongs to data gets a sibling table per language**, typed `Record<Locale, …>` beside the data. It is never a second copy of the data.
4. **Japanese is drafted with a `back` translation, then checked by `japanese-reviewer`.** It records `drafted`, `agentReviewed` or `personReviewed`, generates a review sheet from the shipping text, and sends legal, children's and payment text to a person as well.
5. **Dates, numbers and counts follow the reader.** No `en-*` locale is hard-coded. A count is a phrase with `{count}` and its own counter word in Japanese. `Intl` is never called while rendering a client component (Node and Chromium disagree, see AGENTS.md).
6. **Emails read the member's saved language.**
7. **`<html lang>` follows the reader.** The tag is BCP 47 (`ja`, never `jp`).
8. **Done means played.** Both languages walked end to end at phone and desk width, every ending reached, as the English review rule asks.

## Other apps, later

Not started, by John's word. Each row says where the app stands and what its
first ticket would be. A survey that is older than a month should be re-read
before starting.

| App | Today | Effort to full EN/JP | First step |
|---|---|---|---|
| WazaDB (`wazadb-web`) | next-intl 4.1, `src/lang/{en,de,fr,jp}.json`, 1,187 keys (de/fr/jp lack `auth.register.errors.inviteCodeRequired`). Japanese is real but of unknown origin and unreviewed. About 55% of the UI is translatable; about 900 inline items remain (certification, admin, terms, exam review); exam questions are English in the database (`CertQuestion.text`); emails in four languages | Medium | **Rename the locale `jp` to `ja`** in routing, `<html lang>`, the files, the database defaults and the email dictionary. `jp` is not a language tag, so the page currently declares an invalid language. Then add a key-parity test and run the reviewer over `jp.json` |
| judo-kata-judge | Nuxt 3, `@nuxtjs/i18n`, messages inline in `i18n.config.js`, en (52 keys) and fr (mostly empty); technique names in romaji (`Te-waza:Uki-otoshi`) | Small | Move messages to locale files, add `ja`, and give technique names a model with kanji beside romaji |
| Vintage-steel (RideMuseum) | No mechanism, `<html lang="en">` hard-coded; about 350 inline items, about 276 prose literals, English email templates | Medium to large | Port the `Speaker` model as UmaKuma did, starting with the layout and navigation, with the gate from day one |
| Onibako | Vite dashboard, no mechanism, about 265 inline items, English email alerts | Small to medium | Only if wanted: it is a one-operator tool |
| Sumilabu dashboard | 7 components, no mechanism; `en-US` formatting in `ics.ts`, `board/rules.ts`, `reports/image.ts` | Small | Low value (operator tool). Make its formatting locale-neutral at most |
| rest-in-pieces | 2-component playground | Small | Optional |
| Yukikuma | Expo prototype, superseded by UmaKuma | None | Deleted from the Mac on 2026-10-06 (John: "not used. it's the old Umakuma"); its history stays at github.com/spxis/yukikuma. No ticket |
| address-plus, toudai, ayatori | A library, a script and machine set-up: no UI | None | No ticket |

### The packages (`@johnmorrisdotca/…`)

These rules follow from "packages generic, consumers brand": a package that draws text takes its words as an option, ships English and Japanese defaults, and picks them with a `locale` prop.

| Package | Today | Needed |
|---|---|---|
| korokoro | `STRINGS.en` and `STRINGS.ja`, a `locale` prop, a `strings` override | Nothing: it is the model |
| hitotsu | A `strings` option, English default only; the engine returns English (`colourWords`, `hitotsuWords`) and Itsutsu shows them | Japanese defaults; card words through the strings, not the engine |
| kumimoji, tenka | Their own UIs hard-code English, with no strings option; Tenka's territory names are English data | A `strings` option and Japanese defaults; Tenka's names per language. Itsutsu draws its own UI over both, so this blocks only their demos |
| kyuubu, narabe, tane, toranpu | No visible text | Nothing |

The board's existing row
`every-package-a-language-picker-on-the-board-itself-shown-on-focus-on-by-default`
covers the picker. The table above is what each package needs first.

## Not

- No third language until ENJA-14 and UmaKuma's four are done.
- No machine translation at request time: it is a paid service, and the text it produces is never read before it ships.
- No hiding the kanji: a game's kanji name stays beside its English name for an English reader, as it is today.
- No Japanese shipped without a reviewer's pass.
