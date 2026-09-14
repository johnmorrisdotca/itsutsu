import { Figures } from "@/components/ui/Figures";
import { RATING_POOLS } from "@/lib/rating/pools";
import { winRateText, type RecordFigures } from "@/lib/rating/figures";

import { PlayedFigure, RecordFigure, type RecordOf } from "./PlayerRecord";
import type { ShownRating } from "./recordTable.types";

/**
 * THE HEADLINE FIGURES OF A PERSON'S PAGE: rating, played, the record, the rate.
 *
 * Split out of `src/app/players/[slug]/page.tsx` when the standing block went
 * in under it and the page crossed the 500-line gate. The gate is there to
 * catch a file doing too many jobs, and this was one of them: the page decides
 * WHO it is about and WHICH games are being counted, and this draws the row of
 * figures that answer. The reasoning about scope, kept records and the two
 * pools stays on the page, beside the decisions it explains.
 *
 * Two ratings, side by side, because there are two pools and hiding one behind
 * the other is how a number stops meaning anything. The ladder rating is what
 * somebody has earned against people; the computer one is earned against the
 * programs and never touches it, which is the whole point of keeping them
 * apart. `rating` arrives already decided by `ratingShown` — silence where
 * nothing has been earned, the computer rating marked 機械 where that is the
 * only one there is — and this draws it without deciding anything.
 *
 * Played and the record beside it count whatever the page says they count:
 * every finished game here, or every game on every site, by `of.here`.
 * Counting everywhere means counting games this site never saw, so those two
 * figures lead nowhere; counting here means every one of them is a way into
 * the games behind it.
 */
export function PlayerFigures({
  rating,
  computer,
  counted,
  of,
}: {
  /** The rating worth showing, with the pool that earned it, or null for none. */
  rating: ShownRating | null;
  /** The computer-pool rating, drawn only where there are rated games behind it. */
  computer: { rating: number; ratedGames: number } | null;
  /** The games counted, by `figuresOf` — a null rate is nobody having played. */
  counted: RecordFigures;
  /** Whose games these are, and whether they are here to be opened. */
  of: RecordOf;
}) {
  const record = { wins: counted.won, losses: counted.lost, draws: counted.drawn };
  return (
    <Figures
      testId="player-figures"
      figures={[
        {
          label: "Rating",
          value: (
            <>
              {rating === null ? "—" : rating.rating}
              {rating?.pool === RATING_POOLS.computer ? (
                <span
                  className="ml-1 font-mincho text-[0.68rem] font-normal opacity-70"
                  title="Earned against the computer players, which are rated in a pool of their own."
                  data-testid="player-rating-computer"
                >
                  機械
                </span>
              ) : null}
            </>
          ),
          testId: "player-rating",
        },
        ...(computer !== null && computer.ratedGames > 0
          ? [{ label: "Vs computer", value: computer.rating, testId: "player-computer-rating" }]
          : []),
        {
          label: "Played",
          value: <PlayedFigure record={record} of={of} />,
          testId: "player-played",
        },
        {
          label: "Won · Lost · Drawn",
          value: <RecordFigure record={record} of={of} />,
          testId: "player-record",
        },
        { label: "Win rate", value: winRateText(counted.winRate) },
      ]}
    />
  );
}
