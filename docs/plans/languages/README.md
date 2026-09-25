# Eleven more languages, as vint.ee offers them

John, 2026-09-24: vint.ee offers Belarusian, Chinese, Estonian, English, French,
Italian, Japanese, Mongolian, Russian, Spanish, Swedish, Turkish and
Vietnamese. "I think we should aim to support all these languages too."

Row: `plan-the-eleven-more-languages-vint-ee-offers-from-russian-and-estonian-to-vietn`.
This is a plan, not a build. **The rule the Japanese work set holds for every
language here: nothing ships without a reader who can sign it off.**

## What there is today (read 2026-09-25)

- **Two languages are spoken: English and Japanese.** `LOCALES` in
  `src/lib/i18n/i18n.constants.ts` also declares Spanish, Chinese and German
  with no dictionary, so no picker offers them (`OFFERED_LOCALES` in
  `dictionaries.ts`).
- **What is translated is the dictionary, and only the dictionary.** `PHRASES`
  holds about 170 phrases: navigation, the account menu, the footer, the
  filter bars, the catalogue, the record's buttons, the rivalry scoreboard and
  the XP notice. Every game's name is already paired with its kanji.
- **Japanese has two halves.** `ja.site.constants.ts` is John's own kanji,
  already published (14). `ja.drafted.constants.ts` is machine-written, each
  phrase with an English back-translation (157). `docs/japanese-review.md` is
  generated from them for a reader to check. `japanese.coverage.test.ts` fails
  when a phrase is in neither half or in both, or when the sheet is stale.
- **The picker** (`LanguagePicker.tsx`) is a line of endonyms in the footer and
  in the account menu. Each is a link with `?lang=`, remembered in a cookie and
  on the member's account. With two entries it fits anywhere.
- **Outside the dictionary, and English for everyone**: the About chapters,
  every game's rules page and copy (`RULE_VARIANT_DISPLAY`,
  `variants.constants.ts`), `/learn`, `/privacy`, the set-up screen's words
  (`live.constants.ts`), the game screen's (`game.constants.ts`), the puzzle
  copy, emails, and most sentences on most pages. A reader in any new language
  meets their language in the frame of every page and English in its body.
  That is true of Japanese today, and each language should say so rather than
  hide it.

## The order, by who is likely to play

| # | Language | Endonym | Why here | Script and type |
|---|---|---|---|---|
| 1 | Russian | Русский | one of renju and gomoku's strongest countries | Cyrillic |
| 2 | Estonian | Eesti | vint.ee's home, and a renju country | Latin |
| 3 | Chinese | 中文 | gomoku's widest audience | Han: Simplified or Traditional is a decision (below) |
| 4 | Vietnamese | Tiếng Việt | caro is Vietnam's own five-in-a-row, played here already | Latin with stacked diacritics |
| 5 | Spanish | Español | declared already, a large audience | Latin |
| 6 | French | Français | a large audience, and the French Gomoji (Mot) is here | Latin |
| 7 | Italian | Italiano | | Latin |
| 8 | Swedish | Svenska | a renju country | Latin |
| 9 | Turkish | Türkçe | | Latin, with dotted and dotless i |
| 10 | Belarusian | Беларуская | | Cyrillic |
| 11 | Mongolian | Монгол | | Cyrillic, as Mongolia writes it today |

German (Deutsch) is declared and not on vint.ee's list. It stays declared, and
the German Gomoji (Wort) gives it a reason to follow French.

## What each language needs, in order

1. **A reader who will sign it off**, found before the drafting starts. That is
   the constraint on the order above, and it may reorder it: a language with a
   reader goes ahead of one without.
2. **A drafted dictionary**, `src/lib/i18n/dictionaries/<tag>.drafted.constants.ts`:
   every `PhraseKey`, each with its text and an English back-translation, as
   Japanese's are. The type refuses a partial dictionary.
3. **A review sheet**, `docs/<language>-review.md`, generated as the Japanese
   one is. `japaneseReview.ts` becomes one generator taking the language, and
   its `MET` list of where a phrase is seen is shared by every language.
4. **A coverage test**, the Japanese one made general. Every phrase is in the
   dictionary, the sheet is current, and a phrase the reader has signed off
   moves from drafted to reviewed and no longer appears on the sheet.
5. **The endonym in `LOCALES`**, with its BCP 47 tag, and `script` extended to
   say Cyrillic where it applies. The type's own comment already expects that
   day ("a simplification the day a Cyrillic or Arabic locale arrives").
6. **Fonts.** Check the body and heading faces carry Cyrillic and Vietnamese's
   stacked marks, and load those subsets only for a reader in that language.
7. **Offered** by adding it to `DICTIONARIES`, only when the reader has signed
   the sheet. Until then it can be switched on locally to review in place.

## The picker past two languages

A line of thirteen endonyms is too long for the account menu on a phone, and
for the footer it becomes a paragraph.

- **The footer** keeps a line while there are four or fewer. Past that it
  becomes a native `<select>` of endonyms, each option carrying its `lang`
  attribute so a screen reader says it in its own language. A native select
  costs nothing and is what a phone does best.
- **The account menu** shows one row: "Language: Русский ›". It opens the list
  in place, the current one ticked, so the menu's height changes only when
  asked.
- The choice keeps its current path: `?lang=`, the cookie, the account, and the
  click test in `e2e/language.spec.ts` (drive the control, and the way back).
- `negotiate` (`locale.ts`) already reads `Accept-Language`, so a first-time
  reader in Tallinn arrives in Estonian once it is offered, with nothing new.

## Decisions for John before the first build

- **Chinese: Simplified, Traditional, or both.** vint.ee says "Chinese". The
  gomoku world plays in both. Recommendation: Simplified first (`zh-Hans`),
  Traditional as its own language later.
- **The kanji beside every heading.** For every new language it is shown as it
  is for English, paired and read as a picture. For Chinese it is Japanese
  orthography, which is why `kanjiReadsAsOwn` is false for `zh` already. The
  pairing stays, and needs no decision unless John wants it hidden in Chinese.
- **How much of the body to translate.** The frame alone (the dictionary) is
  about 170 phrases a language. The rules of forty-odd games, About and the set-up
  screen are many thousands of words together. Recommendation: the frame for
  every language first, then each game's short tagline and rules bullets, which
  are what a new player reads, then the rest.

## Tickets

| Ticket | What | Needs |
|---|---|---|
| LANG-00 | The picker as a select past four, the account-menu row, a Cyrillic `script`, the review generator and coverage test made general | nothing; do it first |
| LANG-01 … LANG-11 | One language each, in the order above, steps 1–7 | LANG-00, and a reader for that language |

## Not

- No language offered without a reader's sign-off, however good the draft
  looks. A wrong word in a language nobody here reads is invisible until a
  player tells us.
- No machine translation at request time: a paid service, and a word nobody
  checked.
- No second copy of a page per language. The dictionary is the one place a
  word is translated.
