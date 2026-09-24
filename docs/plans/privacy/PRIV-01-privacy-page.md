# PRIV-01. A privacy page, open to strangers, linked from every page

Board key: `a-privacy-page-open-to-strangers-linked-from-every-page`. Kind:
feature. Priority high. Built on branch `work/privacy` together with this
folder; this file is the record of what was built and why, so the next four
tickets change it knowingly.

## Why

John, 2026-09-24: UmaKuma has `umakuma.com/privacy` and Itsutsu has nothing.
`itsutsu.com/privacy` sent a stranger to `/join`, so the one person who most
needs the page (somebody deciding whether to ask for an invite, or a parent
deciding whether a child may) could not read it. ItsYourTurn and GoldToken,
the sites this one is a tribute to, both have one; the README compares them.

## What was built

- `src/app/privacy/page.tsx` renders `PRIVACY_SECTIONS` from
  `privacy.constants.ts`: a title paired with kanji like About, a subtitle,
  the date it last changed, and one `<section>` per entry with an id, a
  heading, paragraphs and optional points. Text runs the frame's width
  (`e2e/page-width.spec.ts`); no `max-w-prose`.
- `privacy.constants.ts` holds every sentence. Each is a claim the code has to
  keep, checked against the code the day it was written; the header comment
  lists what was read. The one figure in it, how long a words-only account
  lives, is filled from `PLAYER_SESSION_DAYS` by the page, never typed.
- `src/proxy.ts`: `/privacy` in `OPEN_EXACTLY`, with its reason beside it, the
  way `/thanks` was added. `proxy.test.ts` lists it among the open paths and
  `/privacyx` and `/privacy/anything` among the shut ones. `robots.ts` allows
  it, and the existing robots test proves the gate really opens it.
- `SiteFooter.tsx`: a `Privacy` link after About, through the phrase
  `nav.privacy` (`i18n.constants.ts`) with a `ja.drafted` entry
  (プライバシー, the loanword every Japanese site uses), and
  `docs/japanese-review.md` regenerated. `src/app/join/page.tsx`: the same
  link beside the version stamp on the doorstep, since the doorstep has no
  footer.
- `privacy.coverage.test.ts` reads the page against the code: every cookie
  constant in `src/lib` is named on the page; `CONTACT_ADDRESS` is on it;
  each `OPERATOR_ACTIONS` key is named; the sentence about move notices
  agrees with `NOTICES.sending`; `package.json` carries no analytics or
  advertising package; the gate, robots, the footer and the doorstep all
  carry `/privacy`; the date at the top is a real date not in the future;
  every section has a heading, kanji, and at least one paragraph.
- `e2e/privacy.spec.ts`: with no session, `/privacy` answers 200 with every
  heading; the footer link on `/games` and the doorstep link on `/join` both
  reach it; the contact address is a mailto link.
- `docs/DOCS_UPKEEP.md`: a row for `/privacy`, re-read when the schema, the
  cookies, the mail, the gate or the operator's actions change.

## What it deliberately says

- Reading is open, playing is gated, and a stranger sees nothing about a
  member except the beta testers on `/thanks` who asked to be there.
- The two credentials: a Google address (address, name, picture received;
  address kept to recognise you), or four words kept only as a hash.
- Every move of every game, and that every game is a page any member can
  open, with its reactions and notes.
- Invite requests are saved nowhere (the mail says so itself); only a
  scrambled count is kept for the rate limit.
- No analytics, no advertising, no tracking pixel; the host's ordinary
  request logs exist and are read only to find a fault.
- The kept records from ItsYourTurn and GoldToken, with takedown offered.
- Cookies by name, and the sign-in library's own during Google sign-in.
- Google, Vercel, Neon, Resend, Sumilabu, named.
- Move notices exist and are switched off; the setting on your page will
  turn them off for you when they are on.
- Children: families play here; the site does not ask your age YET; a parent
  writes to `hello@itsutsu.com`. PRIV-02 rewrites this section.
- Removal on request by hand, games stay with the name unless asked. PRIV-04
  rewrites this section.

## What not to do

- Do not soften a sentence to make the coverage test pass. If the code
  changed, change the page to say what the code does now, and move the date.
- Do not add a Japanese translation without a reader; see the README's
  decisions. `Paired` already shows the kanji beside each heading.
- Do not link the page from inside a game or a form. The footer and the
  doorstep are where a policy lives.
