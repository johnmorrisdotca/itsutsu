# ENJA-12. Every email in the member's own language

Board key: `every-email-in-the-member-s-own-language`.
Kind: feature. Priority normal. Needs ENJA-02.

## Why

`src/lib/mail/` (`noticeMail.ts`, `inviteMail.ts`, `gameOverSummary.ts`, the
footer and the stop link's page) is English for everyone, though
`memberLanguage` already knows what a member chose.

## Do

1. `sendMail`'s callers pass the recipient's saved language, falling back to English. The rule of one mail sender stays.
2. The subject, body and footer go into phrases. The stop link's page (`/stop/<token>`) reads the same language.
3. An invite to somebody with no account is English, unless the inviter chooses otherwise. That is a small decision: take English, and list it for review.

## Done when

`src/lib/mail` is off the pending list, and a test renders every email in both languages.

## Built (2026-10-06)

- Every email is phrases (`mail.*`, `src/lib/i18n/phrases.mail.constants.ts`; Japanese in `ja.drafted.mail.constants.ts`
  beside its back-translation, read by the reviewer agent). Game notices read the recipient's saved language through
  `AddressBook.languageOf` and fall back to English; the subject, body and footer are all in it, and the stop page
  (`/stop/<token>`) reads the language of the member the link's token names.
- What a person is told when an email was not sent (`mailRefusalText`) and what the invite form reports are phrases,
  said in the language of the request.
- `mailLanguages.coverage.test.ts` renders every email in both languages and fails for a missing phrase or an English
  sentence in a Japanese render. Nothing is sent by it.
- The email the operator receives when a visitor asks for an invite stays English, by decision (it goes to one person,
  as Admin does): `inviteRequestOperatorMail.ts`, one allowance in `EXCLUDED_PATHS` with that reason.
- Not done here, and left to ENJA-13 because it is under `src/app/api`: the words of
  `src/app/api/mail/stop/route.ts` (its refusals are JSON an API returns, and a mail program's one-click reads none
  of them).

## Decided, for review

- **An invitation to somebody with no account is English, unless the inviter's own language is Japanese, in which case
  it is both languages, English first.** The friend has no saved language to read, and the one thing known is who
  wrote to them. The subject is both too, joined with a slash, and the two halves of the body are separated by a line
  of `- - -`. The inviter's own language is the one they are using the site in when they press the button
  (`currentSpeaker` in `app/api/invites/mine/route.ts`). This replaces "English, unless the inviter chooses
  otherwise": nobody is asked, because the inviter chose by how they read the site. John may prefer English alone,
  or a choice beside the Email button; it is one line in `inviteMail.ts` either way.
- **The stop page reads the member's saved language before the browser's own** (a language chosen on that page a moment
  ago still wins). The frame around it (header, footer, picker) follows the browser, as every page does; only the
  body is the member's. Reading the frame in the member's language too would need the gate (`src/proxy.ts`) to know a
  language before the page does, which is not this ticket's to change.
- **The Japanese emails name a game by its kanji and a colour by its own word, and a person's name takes さん.** A
  game with no Japanese name of its own (Caro is "Cờ ca-rô") is named as the site names it.
- **Othello is リバーシ in the Japanese invitation**, as it is everywhere else on the site; the English still says
  Othello. A trademark choice to be confirmed by a native reader.
