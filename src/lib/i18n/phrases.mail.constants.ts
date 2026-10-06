/**
 * mail.*: every email the site sends a person, and what a person is told when one was not sent (ENJA-12).
 *
 * An email is written in the language its reader saved (`languageFrom` on the member's preferences), English where
 * none was saved, so the subject, the body and the footer are all phrases and the same word is said the same way
 * on the stop page (`auth.stop.*`, which names the kinds of email). `{site}` is the site's name and `{address}` the
 * one contact address. An invitation to somebody with no account has no saved language to read: it is English, and
 * English and the inviter's own language together where the inviter reads another (`inviteMail.ts`).
 *
 * The one email that is not here is the request the operator receives when a visitor asks for an invite
 * (`inviteRequestOperatorMail.ts`): it is read by one person and stays English, like the Admin pages.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 */
export const PHRASES_MAIL = {
  // The footer every notice carries, and the labels in front of its links
  "mail.because": "You are getting this because you play on {site}. Questions? Write to {address}.",
  "mail.stopHow": "To stop {words}, or any email from {site}:",
  "mail.yourGames": "Your games:",
  "mail.questions": "Questions? Write to {address}.",

  // A move is waiting
  "mail.turn.subject": "It is your turn on {site}",
  "mail.turn.body": "Somebody has moved, and the board is waiting for you.",

  // A game has finished, as much as the event alone knows
  "mail.over.subject": "Your game on {site} has finished",
  "mail.over.draw": "Your game has ended in a draw.",
  "mail.over.won": "Your game has finished, and you won.",
  "mail.over.lost": "Your game has finished, and you lost.",
  "mail.over.record": "The record is with your games:",

  // A game has finished and could be read: the subject and the headline, each from the reader's side
  "mail.over.subjectWon": "You won at {game} against {opponent}",
  "mail.over.subjectLost": "{opponent} won your game of {game}",
  "mail.over.subjectDraw": "Your game of {game} with {opponent} was a draw",
  "mail.over.headWon": "You won your game of {game} against {opponent}.",
  "mail.over.headLost": "You lost your game of {game} to {opponent}.",
  "mail.over.headDraw": "Your game of {game} with {opponent} was a draw.",
  "mail.over.ratingUp": "Your rating went up {change}.",
  "mail.over.ratingDown": "Your rating went down {change}.",
  "mail.over.finalPosition": "The final position:",
  "mail.over.playAgain": "Play again:",
  // The opponent's name as a sentence says it (Japanese adds the polite ending to a name, never to a colour)
  "mail.over.person": "{name}",

  // How long it took
  "mail.length.moves": "It took {moves}.",
  "mail.length.in": "It took {moves} in {over}.",
  "mail.length.over": "It took {moves} over {over}.",
  "mail.length.underMinute": "under a minute",
  "mail.minute.one": "{count} minute",
  "mail.minute.other": "{count} minutes",
  "mail.hour.one": "{count} hour",
  "mail.hour.other": "{count} hours",
  "mail.day.one": "{count} day",
  "mail.day.other": "{count} days",

  // The invitation a member sends a friend
  "mail.invite.subject": "{who} has invited you to play on {site}",
  "mail.invite.lead": "{who} has invited you to {site}, a site for turn-based board games — five in a row, Othello, Pente and more — played at your own pace.",
  "mail.invite.valid": "Your invitation lets one person in and is good for {days} days:",
  "mail.invite.why": "You are getting this because {who} typed your address into {site} to send it. {site} has not saved your address, and will not write to you again unless somebody sends you another invitation.",
  "mail.invite.named": "{name}",
  "mail.invite.aFriend": "A friend",

  // What a person is told when an email they asked for was not sent
  "mail.refusal.notProduction": "Email is not switched on here, so nothing was sent.",
  "mail.refusal.noKey": "Email is not switched on here yet, so nothing was sent.",
  "mail.refusal.memberDayCap": "You have sent as many emails as one person may in a day ({limit}), so this one was not sent. Try again tomorrow.",
  "mail.refusal.siteDayCap": "The site has sent all the email it allows itself today, so this one was not sent. Try again tomorrow.",
  "mail.refusal.requestRepeatCap": "A request for this address, or from where you are, has already been sent today. Please wait for an answer.",
  "mail.refusal.requestDayCap": "Today's invite requests have all been sent. Please write to {address} instead, and say who you are.",
  "mail.refusal.siteMonthCap": "The site has sent all the email it allows itself this month, so this one was not sent.",
  "mail.refusal.countUnavailable": "The email could not be sent just now, so nothing was sent.",
  "mail.refusal.transportError": "The email could not be confirmed as sent. It may not arrive.",
  "mail.refusal.noticesOff": "Notices about games are not switched on yet, so nothing was sent.",
  "mail.refusal.noAddress": "There is no address to write to, so nothing was sent.",
  "mail.refusal.noStopLink": "Not sent: every email says how to stop getting it, and this one could not be given that link.",
  "mail.refusal.toAChild": "Not sent: the address belongs to a member under 13, and the site never emails a child.",

  // What a visitor is told when the invite request on the join page cannot be read
  "mail.request.badAddress": "Please give an email address we can answer you at.",
  "mail.request.nameLong": "Please keep your name under {limit} characters.",
  "mail.request.aboutLong": "Please keep it under {limit} characters.",
  "mail.request.links": "Please leave links out — a sentence about who you are is plenty.",
} as const;
