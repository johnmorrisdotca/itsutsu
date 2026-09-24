# PRIV-05. Terms of play: one account each, how to behave, how an account ends

Board key: `terms-of-play-one-account-each-how-to-behave-how-an-account-ends`.
Kind: feature. Priority normal. Needs PRIV-01.

## Why

ItsYourTurn keeps a user agreement beside its privacy policy: one account per
person, no harassment, either side may end the account at any time, accounts
inactive for two years may be closed, the site discusses an account only with
its registered address. GoldToken has house rules and a support team that
acts on reports. Itsutsu has an invite, a ban (`Member.bannedAt`,
`bannedNote`), an ignore list, a report link, and says none of it to a member
anywhere. A page that says it, in the register of `/privacy`.

## Exact changes

- `src/app/terms/page.tsx` and `terms.constants.ts`, built exactly like
  `/privacy`: sections with ids, kanji-paired headings, full-width text.
- The sections: one account per person; play your own moves (the computer
  players are the site's; a member's own engine is not a player); be civil
  in reactions, notes and messages, and the ignore list and the report link
  at the foot of every page are how to deal with somebody; the operator can
  shut an account and says why to the member by the address they have, and
  a shut account's games and rating stay; a finished game is never removed;
  the site is free and in beta and promises no uptime; a game abandoned by
  one side is decided by the clock rules of that game; these terms change
  with the site and the date moves.
- Open in `OPEN_EXACTLY`, allowed in `robots.ts`, in `proxy.test.ts` and
  `e2e/page-width.spec.ts`; a `Terms` link in the footer after Privacy and
  on the doorstep; `nav.terms` phrase with a `ja.drafted` entry (利用規約).
- `terms.coverage.test.ts`: the ban and the ignore list exist in the schema;
  the report link exists in the footer; the gate, robots, footer and
  doorstep carry `/terms`; the date is real.
- `e2e/terms.spec.ts`: a stranger reads it, and reaches it from the footer.

## What not to do

- No legalese. If a sentence would not be said to a friend across a board,
  rewrite it.
- No rule the code does not enforce, unless the sentence says it is a
  request.
