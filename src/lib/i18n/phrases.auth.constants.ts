/**
 * auth.*: the door a stranger meets (ENJA-10): the join page, the form to ask for an invite, the page an email's stop link
 * leads to, and the thank-you page. A sentence that holds a link or a figure is one phrase with `{names}` where those stand
 * (`weave`). The site's name is `{site}`; the invitation words are what the English calls "the words you were given" and
 * the Japanese calls 合言葉, the same everywhere on the account pages.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_AUTH = {
  // The join page
  "auth.join.title": "Join",
  "auth.join.googleFailed": "Google sign-in did not complete ({error}). Try again, or use an invite code.",
  "auth.join.terms": "Terms of play",
  "auth.join.operatorLead": "Sign in as the operator.",
  "auth.join.shutLead": "{site} is not taking new members just now. If you already have an account, sign in with Google and you are in as usual.",
  "auth.join.pendingOpen": "Welcome, {name}. Press Enter and you are in.",
  "auth.join.pendingCode": "Welcome, {name}. One more thing: the {count} words you were given. After this, Google alone lets you in.",
  "auth.join.openLead": "Sign in with Google and you are in — no code needed.",
  "auth.join.codeLead": "Sign in with Google. No account? The words you were given will let you in instead.",
  "auth.join.google": "Continue with Google",
  "auth.join.useCode": "No Google account? Use an invite code instead",
  "auth.join.orOperator": "or, with the operator token",
  "auth.join.codeLabel": "Invite code",
  "auth.join.codeHint": "Capitals, spaces or hyphens — any of them work.",
  "auth.join.email": "Email",
  "auth.join.operatorToken": "Operator token",
  "auth.join.tooMany": "Too many attempts. Wait a minute and try again.",
  "auth.join.refused": "That was not accepted.",
  "auth.join.unreachable": "Could not reach the server.",
  "auth.join.checking": "Checking…",
  "auth.join.enter": "Enter",
  "auth.join.notYou": "Not you? Use another account",

  // Asking for an invite
  "auth.ask.open": "No invite? Ask for one.",
  "auth.ask.lead": "{site} is invitation-only while it is small. Say who you are and somebody will write back.",
  "auth.ask.website": "Website",
  "auth.ask.email": "Your email",
  "auth.ask.name": "Your name",
  "auth.ask.optional": "(optional)",
  "auth.ask.about": "Who you are",
  "auth.ask.aboutHint": "Where you played before, or who sent you. No links, please.",
  "auth.ask.sending": "Sending…",
  "auth.ask.send": "Ask for an invite",
  "auth.ask.closed": "Invitations are not being asked for at the moment.",
  "auth.ask.tooMany": "That is a lot of requests from one place. Please try again in an hour.",
  "auth.ask.sent": "Sent. You will hear back at the address you gave.",

  // Where an email's "how to stop getting it" leads
  "auth.stop.title": "Stop emails",
  "auth.stop.lead": "Choose which emails from {site} you get. You do not need to sign in.",
  "auth.stop.unknown": "This link does not stop anything: it may have been copied only in part. Write to {address} and your email will be stopped by hand.",
  "auth.stop.wordsYourTurn": "emails telling you it is your turn",
  "auth.stop.wordsGameOver": "emails telling you a game of yours has finished",
  "auth.stop.youGet": "You get {words}.",
  "auth.stop.youDoNotGet": "You do not get {words}.",
  "auth.stop.stopKind": "Stop {words}",
  "auth.stop.allOn": "{site} may email you about your games.",
  "auth.stop.allOff": "{site} sends you no email at all.",
  "auth.stop.stopAll": "Stop all email from {site}",
  "auth.stop.turnOn": "Turn them back on",
  "auth.stop.signedInNote": "Signed in, the switch for all email is also in Settings. Questions? Write to {address}.",
  "auth.stop.doneAllOff": "Done: {site} will not email you again.",
  "auth.stop.doneAllOn": "Done: {site} may email you about your games again.",
  "auth.stop.doneOff": "Done: no more {words}.",
  "auth.stop.doneOn": "Done: you will get {words} again.",

  // The thank-you page
  "auth.thanks.title": "Thank you",
  "auth.thanks.lead": "{site} is free and in beta. The people below have given their own time to play it before it was finished: finding the rule that was wrong, the button that did nothing, the page that made no sense on a phone, and telling us. Every fix they lead to is theirs as much as ours. We are very grateful, and this page is where we say so.",
  "auth.thanks.testers": "Our beta testers",
  "auth.thanks.empty": "The first names will go here. If you have been testing and would like to be thanked by the name you play under, write to us and we will add you with pleasure.",
  "auth.thanks.from": "from {place}",
  "auth.thanks.since": "since {when}",
  "auth.thanks.join": "Become a beta tester",
  "auth.thanks.older": "If you played on the older sites",
  "auth.thanks.olderBody": "People have played these games for years on {sites}. If you are one of them, we would be especially glad of your help. You already know how a game between people should feel when it is kept properly, which is exactly what we are trying to get right, and you will notice what we have missed long before we do. Bring a friend you used to play there, and bring your old record too: it can be copied over and shown beside what you play here.",
  "auth.thanks.how": "To be listed, or to stop being",
  "auth.thanks.howBody": "Write to {mail} with the name you play under here and, if you like, the site you came from and what you have been looking at. Nobody is listed without asking, and anybody can be taken off by saying so.",
} as const;
