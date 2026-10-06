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
