import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import type { TrailStep } from "./games.types";

const STEP = "underline-offset-2 hover:underline";

/**
 * THE TRAIL ABOVE EVERY PAGE UNDER A GAME: Games / the game / … John,
 * 2026-09-25, reading "Games / Gomoji Mot" on a game's page and then
 * "Gomoji Mot / Set up" and "Gomoji Mot / Set up / Play" under it: the root
 * was lost one step down. Each page wrote its own trail, and most began at the
 * game, so the way back to the catalogue went missing on every page but two.
 *
 * So it is drawn here, once, for games and puzzles alike. It always opens with
 * Games, which is also the one way onward a stranger can follow from a page
 * that is open to them; then the game, a link unless this IS the game's page;
 * then the page's own steps, each a link but the last.
 * `gameTrail.coverage.test.ts` fails the build for a page under
 * /games/<slug>/ that does not draw one, and for a trail up to a game written
 * by hand.
 *
 * `root` is the catalogue's word, for the one page that says it in the
 * reader's language (the rules); everywhere else it is "Games".
 */
export function GameTrail({
  game,
  steps = [],
  root = "Games",
  rootTestId = "trail-games",
  as = "span",
}: {
  /** The game: its name, and where it leads — no `href` on the game's own page. */
  game: TrailStep;
  steps?: readonly TrailStep[];
  root?: ReactNode;
  rootTestId?: string;
  /** A span inside `PageTitle`'s crumb line; a paragraph where it stands alone (`GameTrailNav`). */
  as?: "p" | "span";
}) {
  const all: TrailStep[] = [game, ...steps];
  const Tag = as;
  return (
    <Tag data-testid="game-trail">
      <Link href="/games" className={STEP} data-testid={rootTestId}>
        {root}
      </Link>
      {all.map((step, i) => (
        <Fragment key={i}>
          {" / "}
          {step.href !== undefined && i < all.length - 1 ? (
            <Link href={step.href} className={STEP} data-testid={step.testId}>
              {step.label}
            </Link>
          ) : (
            <span data-testid={step.testId}>{step.label}</span>
          )}
        </Fragment>
      ))}
    </Tag>
  );
}

/**
 * The trail on a page with no title over it — a board to play on — standing
 * alone, marked as the page's furniture so Just the board leaves it out.
 */
export function GameTrailNav(props: Parameters<typeof GameTrail>[0]) {
  return (
    <nav aria-label="Where this is" data-chrome className="text-xs text-muted">
      <GameTrail as="p" {...props} />
    </nav>
  );
}
