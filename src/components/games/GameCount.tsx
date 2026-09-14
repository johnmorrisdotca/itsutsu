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
  /**
   * Whose games, BY ID, which is what goes in the address when there is one.
   *
   * THE 0.133.0 RULE, AND THIS WAS THE BUILDER THAT MISSED IT. "A name shown
   * publicly must be the name the site means to show, in the links as well as
   * in the text" — `playerPath` was fixed then, and this function, the other
   * one that puts a person in a URL, went on writing `?player=<whole name>`.
   * So a member's page showed "Hanako M." and every count under it carried
   * /history?player=Hanako%20Morris in the markup: her surname on a page a
   * stranger may read, put there by the very links that exist to keep a
   * promise.
   *
   * Not a shortened name instead, for the reason `playerPath` gives: "Hanako
   * Morris" and "Hanako Mori" both shorten to "Hanako M.", so an address built
   * from the shown name is an address that can mean two people.
   *
   * The SET IS THE SAME EITHER WAY, which is what makes this a safe swap rather
   * than a narrower link. The record resolves `member=` to the name that
   * member's record is counted under and applies the ordinary name filter —
   * `nameForMember` says why at length, and a link narrowing by the id alone
   * would open a shorter list than the count it came from.
   */
  memberId?: string | null;
  /**
   * The other member, BY ID, when what was counted is the games between two
   * people — a rivalry's score. Only beside `memberId`: a pair is read by id on
   * both seats, and "against somebody" with nobody named on this side is just
   * their games, which already has an address.
   */
  against?: string | null;
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
  /*
   * The id when there is one, exactly as `playerPath` prefers it. An opaque id
   * says nothing about anybody and collides with nobody; a name in an address
   * is a more permanent, more sharable thing than a screen, and it ends up in
   * server logs. The name stays the answer for a record with NO member behind
   * it — a name typed into a game at one screen, a record kept from another
   * site — because the name is all it has.
   */
  const id = options.memberId?.trim() ?? "";
  if (id !== "") {
    query.set("member", id);
    // A pair is two different people; the same id twice is nobody's rivalry.
    const against = options.against?.trim() ?? "";
    if (against !== "" && against !== id) query.set("against", against);
  } else if (options.player !== undefined && options.player.trim() !== "") {
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
  memberId,
  against,
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
  /** Their id, which is what the address carries when there is one. See `gamesHref`. */
  memberId?: string | null;
  /** The other member of a pair, by id. See `gamesHref`. */
  against?: string | null;
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
      href={gamesHref({ variant, player, memberId, against, outcome, pool, rated, verdict })}
      className={`underline-offset-2 hover:underline ${raised ? RAISED_LINK : ""} ${className}`}
      title={title}
      data-testid={testId ?? "game-count"}
    >
      {count}
    </Link>
  );
}
