/**
 * The privacy page, sentence by sentence.
 *
 * Every line here is a claim the site has to keep, so each was checked against
 * the code on 2026-09-24 rather than written from what a privacy page usually
 * says: the `Member` row and its relations in `prisma/schema.prisma`, the two
 * credentials in `lib/auth/members.ts` and `lib/phrase/credentials.ts`, the
 * cookies (`itsutsu_session` in `session.ts`, `lang` and `lang-chosen` in
 * `languagePreference.ts`, a seat cookie per game in `seatCookie.ts`), the
 * gate's open list in `proxy.ts`, what an invite request keeps
 * (`inviteRequest.ts`: nothing), what a report keeps (`reportDraft.ts`), the
 * operator's actions (`operatorLog.constants.ts`), the mail switch
 * (`gameEmails` in `site.constants.ts`), the kept records in `lib/legacy`, and
 * `package.json`, which carries no analytics or advertising package.
 *
 * `privacy.coverage.test.ts` reads these sentences against that code, so when
 * the site changes what it keeps or who sees it, this file changes in the same
 * pass and the date below moves. A privacy page describing a site we no
 * longer run is worse than none.
 *
 * Written in the register of the two sites this one is a tribute to, whose
 * policies are compared in `docs/plans/privacy/README.md`: short, plain, and
 * addressed to a person deciding whether to trust the site with their address,
 * or their child's. The English is the text John approved and the one the test
 * reads; the headings carry their kanji the way every heading here does.
 *
 * The one figure that is not typed here is how long a words-only account
 * lives: the page fills it from `PLAYER_SESSION_DAYS`, so the sentence cannot
 * drift from the cookie.
 *
 * THE WORDS ARE PHRASES NOW (ENJA-11). The sentences this comment calls "these"
 * live in `phrases.privacy.constants.ts` in English and, beside their literal
 * back-translation, in `ja.drafted.privacy.constants.ts` in Japanese; this file
 * keeps the order of the page, each section's anchor and the kanji beside its
 * heading, which do not change with the reader. The English is still the text
 * John approved and the one the test reads, and the Japanese page says so at its
 * head: the English version governs. A sentence here is changed in the phrase
 * file, its Japanese in the same change, and the date below moves.
 */

import type { OutlineSection } from "@/components/layout/documentOutline";

export const PRIVACY_KANJI = "プライバシー";

/** The day the page last changed, moved by whoever changes a sentence. */
export const PRIVACY_CHANGED = "2026-09-25";

export const CONTACT = "hello@itsutsu.com";

/**
 * The page, section by section: the anchor, the kanji beside the heading and the phrases that say it. Read in the
 * reader's language by `privacySections` (`privacy.sections.ts`).
 */
export const PRIVACY_OUTLINE: readonly OutlineSection[] = [
  { id: "short", kanji: "要約", heading: "privacy.short.h", paragraphs: ["privacy.short.paraA", "privacy.short.paraB"] },
  { id: "what", kanji: "保存する情報", heading: "privacy.what.h", paragraphs: ["privacy.what.paraA"], points: ["privacy.what.pointA", "privacy.what.pointB", "privacy.what.pointC", "privacy.what.pointD", "privacy.what.pointE", "privacy.what.pointF", "privacy.what.pointG", "privacy.what.pointH"] },
  { id: "not", kanji: "保存しない情報", heading: "privacy.not.h", paragraphs: ["privacy.not.paraA", "privacy.not.paraB", "privacy.not.paraC"] },
  { id: "who", kanji: "誰に見えるか", heading: "privacy.who.h", paragraphs: ["privacy.who.paraA", "privacy.who.paraB", "privacy.who.paraC", "privacy.who.paraD", "privacy.who.paraE", "privacy.who.paraF"] },
  { id: "reports", kanji: "不具合の報告", heading: "privacy.reports.h", paragraphs: ["privacy.reports.paraA"] },
  { id: "cookies", kanji: "クッキー", heading: "privacy.cookies.h", paragraphs: ["privacy.cookies.paraA", "privacy.cookies.paraB"] },
  { id: "services", kanji: "委託先", heading: "privacy.services.h", paragraphs: ["privacy.services.paraA"], points: ["privacy.services.pointA", "privacy.services.pointB", "privacy.services.pointC", "privacy.services.pointD", "privacy.services.pointE"] },
  { id: "email", kanji: "メール", heading: "privacy.email.h", paragraphs: ["privacy.email.paraA"] },
  { id: "children", kanji: "子ども", heading: "privacy.children.h", paragraphs: ["privacy.children.paraA", "privacy.children.paraB", "privacy.children.paraC"], points: ["privacy.children.pointA", "privacy.children.pointB", "privacy.children.pointC", "privacy.children.pointD", "privacy.children.pointE"] },
  { id: "keeping", kanji: "保存と削除", heading: "privacy.keeping.h", paragraphs: ["privacy.keeping.paraA", "privacy.keeping.paraB", "privacy.keeping.paraC"] },
  { id: "changes", kanji: "改定", heading: "privacy.changes.h", paragraphs: ["privacy.changes.paraA", "privacy.changes.paraB"] },
];
