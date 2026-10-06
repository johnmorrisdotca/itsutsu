/**
 * inbox.*: the inbox, one line of what happened while a member was away (ENJA-10). A line is one whole sentence with
 * `{who}` and `{game}` where the other player's name and the game's name are drawn, since the reader's language
 * decides where they fall (`weave`).
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_INBOX = {
  "inbox.title": "Inbox",
  "inbox.lead": "What happened in your games while you were away — kept for thirty days.",
  "inbox.empty": "Nothing yet. When a game of yours ends, somebody asks you for a game or a race or answers yours, somebody sits at a seat you posted, a note comes with a move, or somebody writes to you, it is here.",
  "inbox.unread": "{count} new in your inbox",
  "inbox.open": "See the game",
  "inbox.answer": "Answer it",
  "inbox.reply": "Reply",
  "inbox.somebody": "Somebody",
  "inbox.aGame": "a game",
  "inbox.gameWon": "Your game of {game} against {who} is over — you won.",
  "inbox.gameLost": "Your game of {game} against {who} is over — you lost.",
  "inbox.gameDrawn": "Your game of {game} against {who} is over — a draw.",
  "inbox.offerAsked": "{who} asked you for a game of {game}.",
  "inbox.offerMatch": "{who} asked you for a game of {game} — a match of {count} games.",
  "inbox.offerDetail": "{who} asked you for a game of {game} — {detail}.",
  "inbox.declined": "{who} declined your game of {game}.",
  "inbox.withdrawn": "{who} took back the game of {game}.",
  "inbox.seatTaken": "{who} took the seat you posted at {game}. Your game has begun.",
  "inbox.tableInvite": "{who} gave you a seat at a table on several devices, playing {game}.",
  "inbox.raceOffer": "{who} asked you to race at {game}.",
  "inbox.tableWon": "Your table of {game} is over — you won.",
  "inbox.tableShared": "Your table of {game} is over — you shared the win.",
  "inbox.tableLost": "Your table of {game} is over — somebody else won.",
  "inbox.tableEnded": "Your table of {game} is over — it was ended, and nobody won.",
  "inbox.message": "{who} sent you a message: “{text}”",
  "inbox.note": "{who} wrote to you in your game of {game}: “{text}”",
} as const;
