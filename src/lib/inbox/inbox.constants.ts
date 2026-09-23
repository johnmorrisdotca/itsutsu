/** The kinds of thing the inbox tells a member; see `InboxItem` in the schema. */
export const INBOX_KINDS = {
  gameOver: "game-over",
  offer: "offer",
  offerDeclined: "offer-declined",
  offerWithdrawn: "offer-withdrawn",
  seatTaken: "seat-taken",
  note: "note",
} as const;

export type InboxKind = (typeof INBOX_KINDS)[keyof typeof INBOX_KINDS];

/** How long an item is kept: ItsYourTurn's thirty days. */
export const INBOX_KEEP_DAYS = 30;

/** How many the page shows at once, newest first. */
export const INBOX_SHOWN = 100;
