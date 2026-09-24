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
 * (`NOTICES` in `mail.constants.ts`), the kept records in `lib/legacy`, and
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
 */

import type { DocumentSection } from "@/components/layout/SectionedDocument";

export const PRIVACY_TITLE = { en: "Privacy", kanji: "プライバシー" } as const;

export const PRIVACY_SUBTITLE = "What Itsutsu keeps about you, who can see it, and how to have it removed.";

/** The day the page last changed, moved by whoever changes a sentence. */
export const PRIVACY_CHANGED = "2026-09-24";

export const CONTACT = "hello@itsutsu.com";

/** A section of this page, in the shape every site document takes — see `SectionedDocument`. */
export type PrivacySection = DocumentSection;

/** The sentence about a words-only account, with the number the cookie really has. */
export function wordsAccountSentence(days: number): string {
  return `An account with words and no Google address lives in one browser for ${days} days unless you link Google, and then it goes.`;
}

export function privacySections(days: number): readonly PrivacySection[] {
  return [
    {
      id: "short",
      heading: "The short version",
      kanji: "要約",
      paragraphs: [
        "Itsutsu keeps what it needs to run a games site: who you are when you sign in, the games you play and how they went, what you choose to tell other players about yourself, and the messages you send them. It does not sell any of it, show you advertising, or follow you around other sites.",
        "Reading is open and playing needs an invite. A stranger can read the games and their rules, the About and Learn pages, the thanks page and this one, and sees nothing about any member. Your name, your record and your standing are shown only to people who are signed in.",
      ],
    },
    {
      id: "what",
      heading: "What we keep",
      kanji: "保存する情報",
      paragraphs: ["An account here signs in one of two ways, and we keep only what each needs:"],
      points: [
        `How you sign in. With Google, we receive your email address, your name and your picture; we keep the address to recognise you next time, and the name and picture as the start of a profile you can change. With four words instead, we keep the words only as a hash, the way a password is kept: they cannot be read back, and nobody at the site can tell you what they were. ${wordsAccountSentence(days)}`,
        "How you got in: the invite code you used, when you joined, and when you were last here.",
        "Your profile, every part of it optional and yours to change on your own page: the name you play under, your city and country, your time zone, a few words about yourself, the days you do not play and when you are away, how you like a board to look, how a new game starts for you, and whether you are listed as here and mailed when it is your move.",
        "Your games: every move of every game you play, when it was made, who sat on either side, and the result. Your rating, your record, your streaks, your experience points and your level are worked out from those games, and so are the applause, the reactions and the notes left on them. A finished game stays at its own address; hiding it from your own list removes it from nowhere else.",
        "Your puzzles: each puzzle you finish, which one it was, how long it took and when, and any race you sat in — who the other person was and both clocks. The puzzle itself is made in your browser and nothing of an unfinished one is sent anywhere.",
        "What you say to people: direct messages to another member, and the buddy and ignore lists you keep.",
        "Your age band: under 13, 13 to 17, or 18 or over, and nothing more exact than that. For a member under 13, who consented to the account: the name a parent or guardian gave, whether they are the parent or a guardian, and when.",
        "Records from other sites: a few players' records from ItsYourTurn and GoldToken, copied by hand from those sites with the date they were read, so that the people this site is a tribute to are remembered here. They name the player, the site, the games and the results, and nothing more private than that site showed. If one of them is yours and you want it changed or taken down, write to us.",
      ],
    },
    {
      id: "not",
      heading: "What we do not keep",
      kanji: "保存しない情報",
      paragraphs: [
        "We never ask for your street address, your phone number or a payment card. There is nothing here to pay for.",
        "When you ask for an invitation from the join page, your name, your address and what you wrote reach us as one email, and the site saves none of it. It keeps only a scrambled count, so that too many requests from one place can be told apart from a person. When a member invites you by email, your address goes into that one message and is not kept.",
        "The site keeps no log of the pages you visit and runs no analytics. The company that hosts it keeps ordinary request logs, the network address, the page and the time, for a short while, as every host does, and we read them only to find a fault.",
      ],
    },
    {
      id: "who",
      heading: "Who can see it",
      kanji: "誰に見えるか",
      paragraphs: [
        "Strangers, with no invite: the games and their rules, the About, Learn and thanks pages, and this page. Nothing about a member reaches them, except the thanks page, which names the beta testers who asked to be thanked in public.",
        "Members: your name and the level beside it, your record, your ratings and where you stand, and the games you have played, because every game here is a page any member can open, while it is played and after, with its moves and the reactions on it. If you filled them in, your city, country, time zone and the words about yourself, and, if you allow it, whether you are here now. Your email address is shown to nobody: not your opponent, not on your page, nowhere.",
        "The person you write to: a direct message is shown to them and to you. Nothing on the site shows it to anyone else, and the operator does not read messages except when one is reported.",
        "Another site, if the operator gives it a token: an embedded view shows a game or a player's summary, read-only, as a member would see it, and nothing more.",
        "The operator, who runs the site: your email address, your invite code, when you were here, and the problems you report. The operator can shut an account, restore it, rename it, set new words for a member who has lost theirs or open the picker so they can choose, attach a record kept under a name nobody had an account for to the member it belongs to, set a member's age band and record a parent's consent for a family by hand, and remove an account when it is asked for. Every such act is logged with who did it, to whom, when and what changed, never the words themselves and never a parent's name. Nobody at the site can sign in as you: there is no such door.",
      ],
    },
    {
      id: "reports",
      heading: "When you report a problem",
      kanji: "不具合の報告",
      paragraphs: [
        "Anybody can report a problem from the foot of any page. We keep what you wrote, the page you were on without anything after the question mark, because that part can hold a private link, the version of the site, the date, a screenshot if you add one, and your name on this site if you are signed in. Reports are kept on Sumilabu, the board this site's work is planned on, and read by the people who fix things.",
      ],
    },
    {
      id: "cookies",
      heading: "Cookies",
      kanji: "クッキー",
      paragraphs: [
        "The site sets cookies only to run: one that keeps you signed in, one that remembers your language and a short-lived one that notes you just changed it, and one for each game you took a seat at from a link without signing in, so the browser holding the link keeps its seat. While you sign in with Google, the sign-in library sets its own short-lived cookies for that step. There are no advertising or analytics cookies, and nothing from a third party.",
        "Your browser also keeps a few things for this site in its own storage, which stay on your device: a practice game you left part way through, your private notes on a game, which way round you turned a board, whether you chose Just the board, the result cards you have closed, and the choices on a set-up screen while you make them. One of them leaves your device: if you report a problem, the browser keeps a random id for itself and sends it with each report, so several reports from one browser can be told apart from many people. It is not your name, your address or your account. Clearing this site's data in your browser removes all of them.",
      ],
    },
    {
      id: "services",
      heading: "Who else handles it",
      kanji: "委託先",
      paragraphs: ["A few services keep the site running, and each sees only what it needs to:"],
      points: [
        "Google, to sign you in, if you choose to.",
        "Vercel, which hosts the site, and Neon, which stores its database, both in the United States.",
        "Resend, which delivers the few emails the site sends.",
        "Sumilabu, our own board, which holds the problems you report.",
        "No advertising network, no analytics service, no tracking pixel.",
      ],
    },
    {
      id: "email",
      heading: "Email",
      kanji: "メール",
      paragraphs: [
        "The site itself sends email only when something asks for it: an invitation a member sends to a friend. A note that it is your move exists and is switched off for now; when it is switched on, the setting on your page turns it off for you. When you ask for an invite or report a problem, any answer comes from a person, to the address you gave. Your address is never sold or given out.",
      ],
    },
    {
      id: "children",
      heading: "Children",
      kanji: "子ども",
      paragraphs: [
        "Some of the people who play here are children, in families that play together, and the site is built with that in mind: nothing about a member reaches a stranger, a member's page is behind the invite, and there is no advertising.",
        "The site asks your age band when you join, before anything else: under 13, 13 to 17, or 18 or over. Nothing more exact is asked or kept. A member under 13 needs a parent's or guardian's consent to keep an account here: on the same page, the parent or guardian gives their name and says whether they are the parent or a guardian, and we keep that with the date. Without it, the account cannot go on. Members who joined before the question existed are asked on their next visit to their own page, and the operator can record the answer for a family by hand.",
        `A parent or guardian can read what we hold about their child, and remove the child's account, from the child's own page (Profile), or write to ${CONTACT} and the operator does it for them.`,
      ],
    },
    {
      id: "keeping",
      heading: "Keeping and removing",
      kanji: "保存と削除",
      paragraphs: [
        "We keep your account and everything in it for as long as the account exists, and finished games for as long as the site does, because a game belongs to both people who played it.",
        "To remove your account, open your own page, choose Profile, and use Remove this account at the bottom; or write to " + CONTACT + " and the operator removes it for you. Your profile, your messages, your lists, your experience points and your puzzle solves go, and so does any game still waiting for you, which is resigned or called off first. Your finished games stay in the record, because each belongs to the other player too, with your account taken off them: you choose whether your name stays on them or is taken off as well.",
        "What we hold about you is listed on the same page, under What Itsutsu holds about you, in plain words and in counts. There is nothing we hold that this page does not describe.",
      ],
    },
    {
      id: "changes",
      heading: "Changes",
      kanji: "改定",
      paragraphs: [
        "When the site changes what it keeps or who sees it, this page changes in the same release and the date at the top moves. A test reads this page against the code, so the two cannot quietly drift apart.",
        `Questions go to ${CONTACT}.`,
      ],
    },
  ];
}
