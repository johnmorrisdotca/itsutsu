/**
 * privacy.*: the Privacy page, sentence by sentence (ENJA-11).
 *
 * Every line is a claim the site has to keep, so each is held to the code it describes by
 * `src/app/privacy/privacy.coverage.test.ts`, which reads these English sentences. The section order, the ids and
 * the kanji beside each heading are `privacy.constants.ts`; the words are here. `{contact}` is the site's one
 * address, `{wordsAccount}` the sentence about a words-only account with the lifetime the cookie really has, so the
 * figure is never typed into a sentence.
 *
 * Legal text and text about children and consent: the Japanese is read by the reviewer agent and is also listed on
 * the review sheet for a native reader, which John decides when a person has read.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 */
export const PHRASES_PRIVACY = {
  "privacy.title": "Privacy",
  "privacy.subtitle": "What {site} keeps about you, who can see it, and how to have it removed.",
  "privacy.lastChanged": "Last changed {date}",
  "privacy.governing": "This page is also offered in your language for reference. The English version is the one that governs, and where the two differ the English prevails.",
  "privacy.wordsAccount": "An account with words and no Google address lives in one browser for {days} days unless you link Google, and then it goes.",

  "privacy.short.h": "The short version",
  "privacy.short.paraA": "{site} keeps what it needs to run a games site: who you are when you sign in, the games you play and how they went, what you choose to tell other players about yourself, and the messages you send them. It does not sell any of it, show you advertising, or follow you around other sites.",
  "privacy.short.paraB": "Reading is open and playing needs an invite. A stranger can read the games and their rules, the About and Learn pages, the thanks page and this one, and sees nothing about any member. Your name, your record and your standing are shown only to people who are signed in.",
  "privacy.what.h": "What we keep",
  "privacy.what.paraA": "An account here signs in one of two ways, and we keep only what each needs:",
  "privacy.what.pointA": "How you sign in. With Google, we receive your email address, your name and your picture; we keep the address to recognise you next time, and the name and picture as the start of a profile you can change. With four words instead, we keep the words only as a hash, the way a password is kept: they cannot be read back, and nobody at the site can tell you what they were. {wordsAccount}",
  "privacy.what.pointB": "How you got in: the invite code you used, when you joined, and when you were last here.",
  "privacy.what.pointC": "Your profile, every part of it optional and yours to change on your own page: the name you play under, your city and country, your time zone, a few words about yourself, the days you do not play and when you are away, how you like a board to look, how a new game starts for you, and whether you are listed as here and mailed when it is your move.",
  "privacy.what.pointD": "Your games: every move of every game you play, when it was made, who sat on either side, and the result. Your rating, your record, your streaks, your experience points and your level are worked out from those games, and so are the applause, the reactions and the notes left on them. A finished game stays at its own address; hiding it from your own list removes it from nowhere else.",
  "privacy.what.pointE": "Your puzzles: each puzzle you finish, which one it was, how long it took and when, and any race you sat in — who the other person was and both clocks. The puzzle itself is made in your browser and nothing of an unfinished one is sent anywhere.",
  "privacy.what.pointF": "What you say to people: direct messages to another member, and the buddy and ignore lists you keep.",
  "privacy.what.pointG": "Your age band: under 13, 13 to 17, or 18 or over, and nothing more exact than that. For a member under 13, who consented to the account: the name a parent or guardian gave, whether they are the parent or a guardian, and when.",
  "privacy.what.pointH": "Records from other sites: a few players' records from ItsYourTurn and GoldToken, copied by hand from those sites with the date they were read, so that the people this site is a tribute to are remembered here. They name the player, the site, the games and the results, and nothing more private than that site showed. If one of them is yours and you want it changed or taken down, write to us.",
  "privacy.not.h": "What we do not keep",
  "privacy.not.paraA": "We never ask for your street address, your phone number or a payment card. There is nothing here to pay for.",
  "privacy.not.paraB": "When you ask for an invitation from the join page, your name, your address and what you wrote reach us as one email, and the site saves none of it. It keeps only a scrambled count, so that too many requests from one place can be told apart from a person. When a member invites you by email, your address goes into that one message and is not kept.",
  "privacy.not.paraC": "The site keeps no log of the pages you visit and runs no analytics. The company that hosts it keeps ordinary request logs, the network address, the page and the time, for a short while, as every host does, and we read them only to find a fault.",
  "privacy.who.h": "Who can see it",
  "privacy.who.paraA": "Strangers, with no invite: the games and their rules, the About, Learn and thanks pages, and this page. Nothing about a member reaches them, except the thanks page, which names the beta testers who asked to be thanked in public.",
  "privacy.who.paraB": "Members: your name and the level beside it, your record, your ratings and where you stand, and the games you have played, because every game here is a page any member can open, while it is played and after, with its moves and the reactions on it. If you filled them in, your city, country, time zone and the words about yourself, and, if you allow it, whether you are here now. Your email address is shown to nobody: not your opponent, not on your page, nowhere.",
  "privacy.who.paraC": "The members who keep you as a buddy: on their feed, the games you start and finish, the experience you earn a day at a time, the levels you reach, and how many puzzles of each kind you solved on a day. A game you hid from your own list is not followed into their feed. The feed's Everyone tab shows only finished games in which every player is a bot or has said they are 18 or over, so nothing about a member under 18, or one who has not said, is ever on it.",
  "privacy.who.paraD": "The person you write to: a direct message is shown to them and to you. Nothing on the site shows it to anyone else, and the operator does not read messages except when one is reported.",
  "privacy.who.paraE": "Another site, if the operator gives it a token: an embedded view shows a game or a player's summary, read-only, as a member would see it, and nothing more.",
  "privacy.who.paraF": "The operator, who runs the site: your email address, your invite code, when you were here, and the problems you report. The operator can shut an account, restore it, rename it, set new words for a member who has lost theirs or open the picker so they can choose, attach a record kept under a name nobody had an account for to the member it belongs to, set a member's age band and record a parent's consent for a family by hand, and remove an account when it is asked for. Every such act is logged with who did it, to whom, when and what changed, never the words themselves and never a parent's name. Nobody at the site can sign in as you: there is no such door.",
  "privacy.reports.h": "When you report a problem",
  "privacy.reports.paraA": "Anybody can report a problem from the foot of any page. We keep what you wrote, the page you were on without anything after the question mark, because that part can hold a private link, the version of the site, the date, a screenshot if you add one, and your name on this site if you are signed in. Reports are kept on Sumilabu, the board this site's work is planned on, and read by the people who fix things.",
  "privacy.cookies.h": "Cookies",
  "privacy.cookies.paraA": "The site sets cookies only to run: one that keeps you signed in, one that remembers your language and a short-lived one that notes you just changed it, and one for each game you took a seat at from a link without signing in, so the browser holding the link keeps its seat. While you sign in with Google, the sign-in library sets its own short-lived cookies for that step. There are no advertising or analytics cookies, and nothing from a third party.",
  "privacy.cookies.paraB": "Your browser also keeps a few things for this site in its own storage, which stay on your device: a practice game you left part way through, your private notes on a game, which way round you turned a board, whether you chose Just the board, the result cards you have closed, and the choices on a set-up screen while you make them. One of them leaves your device: if you report a problem, the browser keeps a random id for itself and sends it with each report, so several reports from one browser can be told apart from many people. It is not your name, your address or your account. Clearing this site's data in your browser removes all of them.",
  "privacy.services.h": "Who else handles it",
  "privacy.services.paraA": "A few services keep the site running, and each sees only what it needs to:",
  "privacy.services.pointA": "Google, to sign you in, if you choose to.",
  "privacy.services.pointB": "Vercel, which hosts the site, and Neon, which stores its database, both in the United States.",
  "privacy.services.pointC": "Resend, which delivers the few emails the site sends.",
  "privacy.services.pointD": "Sumilabu, our own board, which holds the problems you report.",
  "privacy.services.pointE": "No advertising network, no analytics service, no tracking pixel.",
  "privacy.email.h": "Email",
  "privacy.email.paraA": "The site itself sends email only when something asks for it: an invitation a member sends to a friend, and notes about your own games (a game that has finished, or your move) while the site has game emails switched on, of the kinds you choose on your page. Every one says how to stop getting it, without signing in. When you ask for an invite or report a problem, any answer comes from a person, to the address you gave. Your address is never sold or given out.",
  "privacy.children.h": "Children",
  "privacy.children.paraA": "Some of the people who play here are children, in families that play together, and the site is built with that in mind: nothing about a member reaches a stranger, a member's page is behind the invite, and there is no advertising.",
  "privacy.children.paraB": "The site asks your age band when you join, before anything else: under 13, 13 to 17, or 18 or over. Nothing more exact is asked or kept. A member under 13 needs a parent's or guardian's consent to keep an account here: on the same page, the parent or guardian gives their name and says whether they are the parent or a guardian, and we keep that with the date. Without it, the account cannot go on. Members who joined before the question existed are asked on their next visit to their own page, and the operator can record the answer for a family by hand.",
  "privacy.children.paraC": "A parent or guardian can read what we hold about their child, and remove the child's account, from the child's own page (Profile), or write to {contact} and the operator does it for them.",
  "privacy.children.pointA": "A member under 13 keeps no city, country or line about themselves: anything already written is cleared when the band is set, and none can be added. Their local time is never shown to anybody.",
  "privacy.children.pointB": "Only the people on the child's own buddy list, people the child chose, can write to them or offer them a game. Everybody else is told why and is not offered the box.",
  "privacy.children.pointC": "A member under 13 is never listed as here now, and when they were last on the site is not shown, whatever the switch says.",
  "privacy.children.pointD": "The site never sends an email to a member under 13, and does not send an invitation by email on their behalf.",
  "privacy.children.pointE": "Otherwise a child plays like anybody else: their games, record, rating, experience and level are shown as everyone's are, because their games are games.",
  "privacy.keeping.h": "Keeping and removing",
  "privacy.keeping.paraA": "We keep your account and everything in it for as long as the account exists, and finished games for as long as the site does, because a game belongs to both people who played it.",
  "privacy.keeping.paraB": "To remove your account, open your own page, choose Profile, and use Remove this account at the bottom; or write to {contact} and the operator removes it for you. Your profile, your messages, your lists, your experience points and your puzzle solves go, and so does any game still waiting for you, which is resigned or called off first. Your finished games stay in the record, because each belongs to the other player too, with your account taken off them: you choose whether your name stays on them or is taken off as well.",
  "privacy.keeping.paraC": "What we hold about you is listed on the same page, under Your data, in plain words and in counts. There is nothing we hold that this page does not describe.",
  "privacy.changes.h": "Changes",
  "privacy.changes.paraA": "When the site changes what it keeps or who sees it, this page changes in the same release and the date at the top moves. A test reads this page against the code, so the two cannot quietly drift apart.",
  "privacy.changes.paraB": "Questions go to {contact}.",
} as const;
