# Email at itsutsu.com

How the site receives and sends email, what it costs (nothing), and what John
has to do to switch sending on. Written 2026-09-15 for the board rows
`email-the-site-can-send-and-receive` and
`say-that-we-will-bring-your-record-over`.

## Receiving: already works, no code

Namecheap hosts the DNS and forwards itsutsu.com mail for free: the domain's
MX records are Namecheap's `eforward1`–`eforward5.registrar-servers.com`, and
its SPF record includes `spf.efwd.registrar-servers.com`.

- **hello@itsutsu.com** is the one public address. Namecheap forwards it to
  John's own mailbox. The About page names it as a `mailto:` link, open to
  signed-out readers.
- There is no inbound code: no webhook, no mailbox password, and nothing on the
  site reads mail.

## Sending: Resend's free plan, from noreply@itsutsu.com

Resend's **Free plan**, as read from resend.com/pricing on **2026-09-15**:
**3,000 emails a month, 100 a day, 3 domains, no card.** Anything beyond that
needs a paid Resend plan, and the site must never need one. John: "I do not
want ANY things that will cost the site extra money."

So the site's own caps sit well under the plan (`src/lib/mail/mail.constants.ts`,
each with its reason beside it):

| Cap | Site | Resend Free | Why that number |
| --- | --- | --- | --- |
| Whole site, per UTC day | **50** | 100 | Half. The plan is per Resend *account*, which may send for another of John's domains. And if Resend's day doesn't start at midnight UTC, fifty on each side of its boundary still comes to a hundred. |
| Whole site, per UTC month | **1,000** | 3,000 | A third. Two of our months overlapping one of Resend's still stay under it, with room left for other domains. |
| One member, per UTC day | **5** | — | Nobody inviting friends by hand needs more, and one person must not use up everybody's day. |

`sendMail.test.ts` fails the build if a cap goes over the plan, or if twice a
cap goes over it.

### How the caps are kept

- **In the database, not in memory.** A counter that resets on every
  serverless cold start isn't a cap. The table is `EmailSendCount`, one row per
  counter per period (`site:day:2026-09-15`, `site:month:2026-09`,
  `member:<id>:day:2026-09-15`), holding a key and a count and nothing else: no
  address, no name.
- **One atomic increment per counter.** Each send runs
  `INSERT … ON CONFLICT DO UPDATE SET count = count + 1 WHERE count < cap RETURNING count`
  for each of the three counters, inside one transaction. It sends only when all
  three moved. Two sends at the last place can't both get it: the second waits
  on the row lock, then finds the counter full.
  `mailCounter.play.test.ts` proves that against a real Postgres.
- **Past a cap, nothing is sent.** The refusal is logged, and the person is told
  plainly the email wasn't sent today (or this month). They still get the
  invitation link to send themselves.
- **A transport error keeps its count.** Resend may have accepted the email,
  so an error can make the site stop sooner but never later.
- **Migration:** `prisma/migrations/20260915180000_email_send_counts`. It is
  additive: one new table, and no existing row or column touched. Before it
  reaches production it needs, as AGENTS.md says, a Neon branch, a DS1 dump,
  and John's word.

### What sends, and what doesn't

- **The one flow that sends:** a member's "Email an invitation" under
  *Me → People → Invite a friend*. One click sends one email to one address
  they typed, with a fresh one-use join link. The address isn't stored or
  logged.
- **Nothing else sends.** No sign-up mail, no game notices (`lib/notify/email.ts`
  stays a placeholder on purpose, because a your-turn email on every move would
  spend the day), nothing on a timer, a poll or a batch.
- **One HTTP call per action:** a single `POST https://api.resend.com/emails`
  with a 10-second timeout and no retry. There is no SDK, no queue service, no
  webhook endpoint and no held connection.
- **It fails closed.** Outside production (development, tests, Vercel previews)
  nothing is sent, whatever is set. In production with no `RESEND_API_KEY`,
  nothing is sent, the reason is logged, and the invite panel doesn't offer the
  email form at all. Tests can only send through a fake transport they hand in.

## DNS records at Namecheap — what was actually added

**Resend changed its setup, and this section was rewritten on 2026-09-16 after
doing it for real.** It previously described an MX on `send`, two separate SPF
TXT records, and a long warning about switching Mail Settings to Custom MX and
possibly breaking the forwarding that delivers hello@itsutsu.com. Resend does
not issue those records any more, and following the old text would send somebody
hunting for an MX that should not exist and editing a root SPF record for no
reason. Keeping it would have been the dangerous kind of out of date.

Resend now hands over **CNAMEs**, which touch nothing at the root:

| # | Type | Host | Value | Notes |
| --- | --- | --- | --- | --- |
| 1 | TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3…` from Resend | DKIM: what makes the mail provably ours. |
| 2 | CNAME | `send` | `send.forge.rmta.net.` | Resend's return path. |
| 3 | CNAME | `rsend` | `rsend.forge.rmta.net.` | Resend's second return-path host. |
| 4 | TXT | `_dmarc` | `v=DMARC1; p=none;` | Watching only, to start. Tighten to `p=quarantine` once reports show only our own mail passing. |

Four records, and **that is the whole of it**.

### Receiving was never at risk, and that is the point of the change

The old hazard was that sending and receiving fought over one Namecheap
setting. They do not any more. Because every Resend record above is a CNAME on
its own host, **Mail Settings stays on Email Forwarding** and the root is
untouched. Verified against live DNS after the records went in:

- root `MX` — all five of `eforward1`–`eforward5.registrar-servers.com`, unchanged
- root `TXT` — `v=spf1 include:spf.efwd.registrar-servers.com ~all`, unchanged

So there is no second SPF record to collide with the first, no Custom MX to
switch to, and nothing to write down before saving. If a future Resend guide
asks for an MX on `send` again, re-read this section before believing it: the
thing to protect is the root, and the test is that a message to
hello@itsutsu.com still arrives.

In Resend's **Add domain** screen: leave the Custom Return-Path as `send`
(these records assume it), leave the Tracking Subdomain empty, and turn **click
tracking OFF**. The one thing this site sends is an invitation carrying a
one-use join link; rewriting that link to run through a tracking domain makes a
note from a friend look like spam, needs a fifth DNS record, and tells us
nothing we do not learn when the person joins.

## John's steps, in order

**Steps 1 to 3 were done on 2026-09-16.** The account is the existing `spxis`
one, which already sends for wazadb.com — so the Free plan's **3,000 a month and
100 a day are shared between the two sites**, which is exactly why this site's
own caps are half of them. Free allows three domains; itsutsu.com is the second.

1. ~~Create the Resend account~~ — done. The `spxis` account, john@spxis.com.
2. ~~Add the domain~~ — done. Region us-east-1, return path `send`, tracking
   subdomain empty, click tracking off.
3. ~~Add the DNS records~~ — done, and verified against live DNS: all four
   resolve, and the root MX and SPF are untouched, so forwarding is unharmed.
4. **Create an API key** in Resend with *Sending access* only, limited to
   `itsutsu.com`. Put it in Vercel as `RESEND_API_KEY` in the **Production**
   environment only, marked **Sensitive**. Leave it out of Preview and
   Development, and out of any `.env`.
5. **Land the migration** `20260915180000_email_send_counts`: Neon branch
   first, DS1 dump, John's word. **Redeploy.** A new environment variable reaches
   the site only on the next deployment.
6. **Try it once:** Me → People → Invite a friend → Email an invitation, to an
   address of John's own. The email should come from noreply@itsutsu.com, and
   replying to it should reach hello@itsutsu.com.
