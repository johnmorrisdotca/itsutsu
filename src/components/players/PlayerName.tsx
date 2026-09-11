import Link from "next/link";

import { playerPath } from "@/lib/rating/playerKey";
import { shownName } from "@/lib/rating/shownName";

/**
 * A person's name, leading to their page.
 *
 * A STANDING RULE, the twin of "every game name leads to that game": wherever
 * this site prints somebody's name, that name is the way to them. It was
 * being obeyed in the record table and nowhere else, which is how a rule of
 * this kind goes — one list gets it, the next list written does not, and
 * nobody notices until they click a name and nothing happens.
 *
 * Two names have nobody behind them, and both stay plain rather than pointing
 * at a page that would not exist:
 *
 *  - A blank seat. Nobody sat there; the fallback is a description of the
 *    chair, not a person.
 *  - A name typed into a game at one screen. Two people at one keyboard type
 *    whatever they like, and inventing an identity for it would be worse than
 *    leaving it alone — the same line playerKey and memberIdForName already
 *    draw, where a name nobody holds an account under stays open.
 *
 * What it PRINTS is the first name; where it GOES is unchanged. John's
 * daughter is twelve and her full name was on every list on the site. The
 * address still carries the whole name, and that is a separate decision he has
 * flagged and not yet made — see `shownName`.
 */
export function PlayerName({
  name,
  fallback,
  linkable = true,
  whole: showWhole = false,
  className = "",
  testId = "player-name",
}: {
  name: string;
  /** What to say when the seat was empty. */
  fallback: string;
  /** False where the name belongs to nobody — an abandoned game, a hot seat. */
  linkable?: boolean;
  /**
   * Print the name in full.
   *
   * For the operator's own list and nowhere else. Administering members means
   * telling two Hanakos apart, and a page only the operator can open is not
   * where a name is on display.
   */
  whole?: boolean;
  className?: string;
  testId?: string;
}) {
  const whole = name.trim();
  if (whole === "") return <>{fallback}</>;
  const shown = showWhole ? whole : shownName(whole);
  if (!linkable) return <>{shown}</>;
  return (
    <Link
      href={playerPath(whole)}
      className={`underline-offset-2 hover:underline ${className}`.trim()}
      data-testid={testId}
    >
      {shown}
    </Link>
  );
}
