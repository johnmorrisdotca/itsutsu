import type { SettingWordsProps } from "./setUp.types";

/**
 * A game's settings as one line of words, the notable ones in ink.
 *
 * One line, wrapping rather than truncating: a summary cut off at the edge of
 * the panel is a summary that stops being true halfway along, which is the one
 * thing it must not do. The notable words are drawn in ink and the ordinary ones
 * muted, so a clock or an unrated game catches the eye in a line that is
 * otherwise the same on every visit. Weight and colour together, never colour
 * alone.
 *
 * Drawn by the rules beside a board, folded (`MoreSettings`), and by the set-up
 * screen over its Continue button — one rendering, so the two lines cannot come
 * to look different for the same game.
 */
export function SettingWords({ words, testId }: SettingWordsProps) {
  return (
    <span className="flex flex-wrap items-baseline gap-x-1.5 text-xs" data-testid={testId}>
      {words.map((word, at) => (
        <span key={word.text} className="flex items-baseline gap-1.5">
          {at > 0 ? (
            <span aria-hidden="true" className="text-muted/60">
              ·
            </span>
          ) : null}
          <span
            className={word.notable ? "font-semibold text-ink" : "text-muted"}
            data-notable={word.notable ? "true" : "false"}
          >
            {word.text}
          </span>
        </span>
      ))}
    </span>
  );
}
