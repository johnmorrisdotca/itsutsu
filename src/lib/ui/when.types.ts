/**
 * How much of a moment is printed: the day and the time, the day alone, or the
 * time alone. The same three for both halves of `when.ts`, so a moment drawn
 * one way on the server is replaced by the same amount of it in the browser.
 */
export type WhenStyle = "dateTime" | "date" | "time";
