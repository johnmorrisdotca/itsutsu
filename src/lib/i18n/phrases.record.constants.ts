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
  /*
   * The chips that say a record was narrowed to a span of time. `{when}` is a
   * month ("September 2026") or a week, already written in the reader's
   * language by the calendar table, so only the frame around it is a phrase.
   */
  "record.finishedIn": "Finished in {when}",
  "record.weekOf": "the week of {date}",
} as const;
