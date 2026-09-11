import Link from "next/link";

import { RAISED_LINK } from "@/components/ui/ui.constants";
import { historyPath } from "@/lib/gomoku/slugs";
import type {
  GameOutcome,
  GamePoolFilter,
  GameRatedFilter,
  GameVerdictFilter,
} from "@/lib/history/gameHistory.types";
import type { ReactNode } from "react";

/**
 * A number of games, leading to those games.
 *
 * The twin of `GameName`, and the rule John has now had to state twice: "if
 * you see a W/L/T record, each number you see should be clickable". Under both
 * of them is one idea — any number that refers to games is a filter somebody
 * already ran. The page had the games in its hands to count them; printing the
 * total and dropping the query makes the reader rebuild by hand the question
 * the page has just answered.
 *
 * So a count is not a label. "7" beside Lost is the way into those seven
 * losses, and it goes to the record filtered exactly as it was counted —
 * `outcome=lost&player=…`, which is the same view a reader would have built
 * from the filter bar.
 *
 * The one honest exception is a figure this site did not play. A record kept
 * from ItsYourTurn is four numbers copied down once; there are no games here
 * behind them, and a link that cannot keep its promise is worse than a plain
 * number. Those pass `here={false}` and say why on hover.
 */
export function gamesHref(options: {
  /** Which game. Left out for every game. */
  variant?: string;
  /** Whose games, by name — an exact match, as a record counts them. */
  player?: string;
  /** How they went for that player. */
  outcome?: GameOutcome;
  /**
   * Which ladder was counting, when the number came from one of them.
   *
   * The ladder's record is rated games against people and the Computers tab's
   * is rated games against the programs, so a link from either has to say so
   * or it opens a longer list than the number it came from.
   */
  pool?: GamePoolFilter;
  rated?: GameRatedFilter;
  /** What that player said about their own play, or "judged" for either. */
  verdict?: GameVerdictFilter;
}): string {
  const base = options.variant === undefined ? "/history" : historyPath(options.variant);
  const query = new URLSearchParams();
  if (options.player !== undefined && options.player.trim() !== "") {
    query.set("player", options.player.trim());
  }
  if (options.outcome !== undefined) query.set("outcome", options.outcome);
  if (options.pool !== undefined && options.pool !== "all") query.set("pool", options.pool);
  if (options.rated !== undefined && options.rated !== "all") query.set("rated", options.rated);
  if (options.verdict !== undefined && options.verdict !== "all") query.set("verdict", options.verdict);
  const search = query.toString();
  return search === "" ? base : `${base}?${search}`;
}

export function GameCount({
  count,
  variant,
  player,
  outcome,
  pool,
  rated,
  verdict,
  here = true,
  title,
  raised = false,
  className = "",
  testId,
}: {
  /** The number as the page words it — "12", or "12 games". */
  count: ReactNode;
  variant?: string;
  player?: string;
  outcome?: GameOutcome;
  pool?: GamePoolFilter;
  rated?: GameRatedFilter;
  verdict?: GameVerdictFilter;
  /** False for a figure counted on another site, which has no game here to open. */
  here?: boolean;
  title?: string;
  /** Lift it above a stretched row link, the way `GameName` does. */
  raised?: boolean;
  className?: string;
  testId?: string;
}) {
  /*
   * Nought links nowhere on purpose. It is the one count whose games a reader
   * can already see all of, and an empty list reached by a link reads as a
   * page that has broken rather than as an answer.
   */
  if (!here || count === 0 || count === "0") {
    return (
      <span
        className={className}
        data-testid={testId}
        title={here ? title : "Counted on another site — no game here to open."}
      >
        {count}
      </span>
    );
  }
  return (
    <Link
      href={gamesHref({ variant, player, outcome, pool, rated, verdict })}
      className={`underline-offset-2 hover:underline ${raised ? RAISED_LINK : ""} ${className}`}
      title={title}
      data-testid={testId ?? "game-count"}
    >
      {count}
    </Link>
  );
}
