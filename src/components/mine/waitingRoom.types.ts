/**
 * What the waiting room's table says under its headings.
 *
 * - `seats`: somebody is waiting, and the rows are drawn.
 * - `nobody-waiting`: no seat is posted at all, so the room invites the first.
 * - `nothing-matches`: seats are posted, and the filter the reader chose leaves none.
 */
export type WaitingRoomSays = "seats" | "nobody-waiting" | "nothing-matches";
