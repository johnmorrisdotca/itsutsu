/** The kinds of thing the inbox tells a member; see `InboxItem` in the schema. */
export const INBOX_KINDS = {
  gameOver: "game-over",
  offer: "offer",
  offerDeclined: "offer-declined",
  offerWithdrawn: "offer-withdrawn",
  seatTaken: "seat-taken",
  note: "note",
  message: "message",
  /** A seat at a party table on several devices, given by name (`gameId` is the table's id). */
  tableInvite: "table-invite",
  /** A party table you sat at has finished or been ended; `detail` is won, shared, lost or ended. */
  tableOver: "table-over",
  /** A puzzle race's other seat, offered by name (`gameId` is the race's id, `variant` the puzzle). */
  raceOffer: "race-offer",
} as const;

export type InboxKind = (typeof INBOX_KINDS)[keyof typeof INBOX_KINDS];

/** How long an item is kept: ItsYourTurn's thirty days. */
export const INBOX_KEEP_DAYS = 30;

/** How many the page shows at once, newest first. */
export const INBOX_SHOWN = 100;
