/**
 * The colours the phone draws around the site when it is opened from the
 * home screen: the status bar, Android's launch screen, the gap before the
 * first page paints. They are the page's own paper, light and dark (`--paper`
 * in globals.css), so the app's frame and the page inside it are one surface.
 */
export const APP_COLOURS = {
  light: "#f7f5f1",
  dark: "#22231f",
} as const;

/**
 * Where a dismissed "add to your home screen" hint is remembered, on that
 * device only: whether a phone has the app is a fact about the phone.
 */
export const INSTALL_HINT_DISMISSED_KEY = "itsutsu.installHint.dismissed";
