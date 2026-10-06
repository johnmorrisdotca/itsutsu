/**
 * record.*: the replay's download.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_RECORD = {
  /*
   * The replay's download. SGF stays as the letters in every language: it is
   * the name of the format, and the name a reader will find it under in any
   * program that opens one.
   */
  "record.downloadSgf": "Download as SGF",
  /** The same for the draughts family, whose file is PDN (Portable Draughts Notation). */
  "record.downloadPdn": "Download as PDN",
} as const;
