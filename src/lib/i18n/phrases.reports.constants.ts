/**
 * reports.*: "Report a problem", the window at the foot of every page where a reader says what went wrong (ENJA-10).
 * The operator's list of what was reported is English by decision (`src/components/reports/AdminReports.tsx`).
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_REPORTS = {
  "reports.open": "Report a problem",
  "reports.title": "Report a problem",
  "reports.intro": "Tell us what went wrong and what you were doing. With it we keep the page you were on, the version, the date and a screenshot if you add one, and nothing else.",
  "reports.checking": "One moment…",
  "reports.paused": "Reporting is paused for a moment. Please try again a little later.",
  "reports.sent": "Thank you. It has reached us, with the page you were on.",
  "reports.question": "What happened?",
  "reports.placeholder": "The move I made went on the wrong point, on a phone, after I pressed Undo.",
  "reports.removeShot": "Remove the screenshot",
  "reports.addShot": "Add a screenshot",
  "reports.pasteShot": "or paste one into the box",
  "reports.shotAlt": "The screenshot that will go with the report",
  "reports.carriesPage": "Page",
  "reports.carriesVersion": "Version",
  "reports.carriesShot": "Screenshot",
  "reports.carriesDate": "Date",
  "reports.close": "Close",
  "reports.sending": "Sending…",
  "reports.send": "Send it",
  "reports.rateLimited": "That is a lot of reports at once. Try again in {minutes} minutes; your words are still here.",
  "reports.failed": "Could not send it just now. Your words are still here; try again in a moment.",
  "reports.shotNotPicture": "That is not a picture. A screenshot is a PNG, JPEG or WebP.",
  "reports.shotTooLarge": "That picture is too large to send. Try a smaller part of the screen.",
  "reports.tooShort": "Say a little more about what went wrong.",
  "reports.tooLong": "Keep it under {max} characters.",
  "reports.shotUnsendable": "That picture could not be sent. Try a smaller one, or send the report without it.",
  "reports.noReporter": "This browser could not be told apart; reload and try again.",
} as const;
