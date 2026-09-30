/**
 * The site's colours, handed to Korokoro's tray. Each is one of the site's own
 * tokens (globals.css), which already has a light and a dark value, so the
 * tray turns with the page. The felt keeps the package's own green.
 */
export const DICE_THEME = {
  "--kk-surface": "var(--ivory)",
  "--kk-ink": "var(--ink)",
  "--kk-muted": "var(--muted)",
  "--kk-rule": "var(--rule)",
  "--kk-accent": "var(--shu)",
  "--kk-good": "var(--moss)",
  "--kk-bad": "var(--shu)",
  "--kk-pip-one": "var(--shu)",
} as const;
