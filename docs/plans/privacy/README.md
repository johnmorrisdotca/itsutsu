# Privacy: what the site keeps, who sees it, and what a child needs

John, 2026-09-24, on finding that UmaKuma has a privacy page and Itsutsu does
not: "this is absolutely mandatory. we need this asap." Five tickets, one file
each, in the order to take them. The first is built on the branch that adds
this folder; the rest are filed on the live board with `Plan:` pointing here.

Each plan is written so an agent can implement it without asking: what to
read first, every file that changes, the tests, the acceptance list, and what
not to do. If a plan and the code disagree, the code moved after the plan was
written; say so in the row and follow the code.

## Order

| Ticket | Plan | Needs |
|---|---|---|
| PRIV-01 A privacy page, open to strangers, linked from every page | `PRIV-01-privacy-page.md` | nothing (built with this folder) |
| PRIV-02 The profile asks your age band, and a member under 13 needs a parent's consent | `PRIV-02-age-band-and-consent.md` | PRIV-01 (the page's Children section changes in the same release) |
| PRIV-03 What a member under 13 shows and receives | `PRIV-03-under-13-rules.md` | PRIV-02 |
| PRIV-04 Ask what we hold, and have an account removed | `PRIV-04-remove-and-ask.md` | PRIV-01 |
| PRIV-05 Terms of play: one account each, how to behave, how an account ends | `PRIV-05-terms-of-play.md` | PRIV-01 |

PRIV-02 carries a migration. AGENTS.md "Back It Up Before You Migrate It"
applies in full: a Neon `before-*` branch and a DiskStation dump before
anything reaches production, and its push carries no other migration.

## What the two sites this one is a tribute to say

Both policies were read on 2026-09-24. They are short, plain and old, and
that is the register to write in: a person deciding whether to trust the site
with their address, not a lawyer.

**ItsYourTurn** (`itsyourturn.com/pp?privacy`, ©1998–2026 It's Your Turn, Inc.):

- An email address is required to register and is used to say it is your
  turn. It is visible to nobody else on the site, not even an opponent,
  unless you post it yourself.
- Email notices can be switched off in the profile and then "you will not
  receive any email from us, ever". No advertising in email. The address is
  never given to a third party without explicit permission.
- Profile fields such as a town are optional, not released to outsiders and
  not used for marketing.
- One cookie tracks the user id between pages so you need not log on again.
- Private messages: do not discuss very sensitive subjects; the site does not
  monitor, edit or disclose them beyond what processing needs, and cannot be
  liable for a bug that exposes one.
- It never asks for a street address or phone number, so nobody can discover
  them through the site; report anybody who asks for them in IYT's name.
- Nothing about age or children. The user agreement (`/pp?useragree`) has no
  minimum age; it asks for one account per person and lets IYT close an
  account inactive for two years.

**GoldToken** (`goldtoken.com/games/info?info=Privacy+Policy`, ©2000–2026
GoldToken.com LLC):

- Nothing sent to the site is divulged to a third party except to provide
  the service, comply with law and court orders, or protect property or
  life; a street address is only ever asked for to post a prize.
- A valid email address is required, since it is how players are told apart;
  it may have to be re-verified when mail bounces.
- Comments in public areas are public. Support can read private messages in
  a case of reported harassment or threats.
- An honest paragraph about breaches: the database is safeguarded, a bug or
  misconfiguration could still expose it, and the site would go offline to
  fix one.
- The policy can change without notice; continued use is acceptance.
- Contact: GoldToken Support or a management address.
- "Chumping" (mutual ignore), and three visibility levels on photos and
  blogs: public, semi-private (chums only), private.
- One cookie, created at login and destroyed at logout.
- Its home page says the site is "suitable and safe for all ages"; the policy
  itself says nothing about children or age.

**Where Itsutsu's page goes further, and why:**

- Reading is open and playing is gated, so the page has a section on what a
  stranger sees (nothing about a member) that neither site needed.
- Google sign-in and the four-word phrase are two credentials with different
  footprints; both are described, and the hash is named as a hash.
- Every game is a page any member can open, with the reactions and notes on
  it, so "your games are visible to members" is said plainly.
- The kept records from ItsYourTurn and GoldToken are personal data about
  people who never signed up here; the page names them and offers takedown.
- Children play here, in families. UmaKuma asks an age band and records a
  parent's consent under 13; Itsutsu will too (PRIV-02, PRIV-03). Until it
  does, the page says so and gives a parent the way to ask.
- The services that handle data are named (Google, Vercel, Neon, Resend,
  Sumilabu), as UmaKuma's page does and neither older site does.
- A coverage test holds the page to the code: cookie names, the contact
  address, the operator's actions, whether move notices are on, and the
  absence of analytics or advertising packages. IYT's page has no date and
  GT's says it may change without notice; ours dates every change.

## Decisions taken without John, for him to reverse

Filed on the board as "Decisions to review: privacy" so he can reverse any
of them later (memory: decide, then file for review).

1. The page is English, with kanji pairs on headings like About. A Japanese
   translation is drafted for review only when a reader can be found for it;
   the English governs, as on UmaKuma.
2. Policy statements the code cannot prove are stated as policy and kept:
   the operator does not read direct messages except when one is reported;
   host logs are read only to find a fault; removal is done by hand on
   request until PRIV-04 lands, games stay with the name unless asked.
3. The age vocabulary is UmaKuma's (`under_13`, `13_17`, `18_plus`), so the
   two sites can be compared and copy can be shared.
4. The Children section says the site does not ask your age YET, rather than
   promising a date.
5. `/privacy` is in robots.txt's allow list, like `/about` and `/thanks`.
