# ENJA-10. Home, About, Learn, players, history, My account, the feed and inbox in English and Japanese

Board key: `home-about-learn-players-history-my-account-the-feed-and-inbox-in-english-and-ja`.
Kind: feature. Priority normal. Needs ENJA-02.

## Where

- `src/app/page.tsx`, `src/app/about/*`, `src/app/learn/*`.
- `src/lib/learn/` (strategy.ts, cubeMethod.ts).
- `src/app/players/*`, `/history` and its filter chips.
- `src/components/mine/` (`mine.constants.ts`, about 230 strings).
- The feed lines, the inbox, `/releases` headings (the release notes themselves stay English: they are a record).
- The join and invite pages a stranger sees.

## Watch

- The About and home pages may not type a count (`about.coverage.test.ts`, `homePitch.coverage.test.ts`). Translated sentences use the same placeholders.
- A stranger's view of an open page must be checked signed out, in Japanese, by clicking the picker.

## Done when

These paths are off the pending list.
