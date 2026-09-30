/**
 * How much of a moment is printed: the day and the time, the day alone, the
 * time alone, or `full` — the weekday, the day, the month written out, the
 * year, the time and the zone's name, for a reader who asked for exactly when
 * (a release's date on /releases, touched). The same three for both halves of `when.ts`, so a moment drawn
 * one way on the server is replaced by the same amount of it in the browser.
 */
export type WhenStyle = "dateTime" | "date" | "time" | "full";
