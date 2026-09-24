# PRIV-03. What a member under 13 shows and receives

Board key: `what-a-member-under-13-shows-and-receives`. Kind: feature.
Priority high. Needs PRIV-02.

## Why

A recorded age band that changes nothing is a form. UmaKuma's rule of thumb
is asymmetry: a child is seen only by the buddies the child added, and a
stranger sees a name and a level. Itsutsu is smaller and already keeps every
member behind the invite, so the list below is short, and each line is for
John to confirm or cut before it is built (the board row says so).

## The rules, proposed

Each is ONE function in `src/lib/social/childRules.ts` (or beside the thing
it governs), taking the member row's `ageBand` and answering a question, and
asked by the page AND by the API route that writes. Never by a component
alone: a hidden field is not a rule.

1. **Profile**: a member under 13 is offered no city, bio or time-zone field,
   and none is shown on their page even if a value is stored. `PATCH /api/me`
   refuses those fields for them.
2. **Messages**: a direct message reaches a member under 13 only from a member
   on the child's own buddy list. The messages page says why the box is
   missing; the API answers 403 with the reason.
3. **Here now**: a member under 13 is never listed among who is here,
   whatever `showOnline` says, and the switch is not offered to them.
4. **Email**: no email is sent to a member under 13 and no address is asked
   of them beyond the Google one they may have signed in with. `sendMail`'s
   caller checks; the invite-by-email form is not offered to them.
5. **Their page**: shows other members the playing name, the level, the
   record and the games, the same as anybody, and nothing from rule 1.

## Tests

One unit test per rule, on the function. One browser spec per rule from the
OTHER member's side (a second identity, minted by redeeming an invite; never a
copy of the admin state): the box is not there, and it is not there AFTER the
page it would be in has rendered (AGENTS.md "An Absence Is Only Meaningful
After A Presence Has Been Waited For").

## The privacy page

The Who can see it section gains the child's paragraph in the same release,
and the date moves.

## What not to do

- Do not make a child invisible in the record or on the ladders. Their games
  are games; the rating and XP rules are the same for everyone.
- Do not read `ageBand` anywhere but through the functions above.
