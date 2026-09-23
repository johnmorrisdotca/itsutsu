/** The inbox's words; see `InboxList`. */
export const INBOX_COPY = {
  title: "Inbox",
  kanji: "受信",
  lead: "What happened in your games while you were away — kept for thirty days.",
  empty:
    "Nothing yet. When a game of yours ends, somebody asks you for a game or answers yours, somebody sits at a seat you posted, or a note comes with a move, it is here.",
  open: "See the game",
  answer: "Answer it",
  somebody: "Somebody",
  aGame: "a game",
  gameOver: {
    lead: "Your game of",
    against: "against",
    is: "is over —",
    result: (detail: string) => (detail === "won" ? "you won." : detail === "lost" ? "you lost." : "a draw."),
  },
  offer: { asked: "asked you for a game of" },
  declined: "declined your game of",
  withdrawn: "took back the game of",
  seatTaken: "took the seat you posted at",
  begun: "Your game has begun.",
  note: "wrote to you in your game of",
  unread: (count: number) => `${count} new in your inbox`,
} as const;
