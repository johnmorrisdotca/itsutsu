import { RecordCells, RecordHeadings, RecordLine } from "@/components/players/PlayerRecord";
import Link from "next/link";

import { EMPTY_VERDICTS, fetchVerdictTally } from "@/lib/history/verdicts";
import { GameName } from "@/components/games/GameName";
import { RATING_POOLS } from "@/lib/rating/pools";
import { gamesPlayed, ratingShown } from "@/lib/rating/shownRecord";
import { TIER_DISPLAY } from "@/lib/rating/elo";
import { currentMemberId } from "@/lib/auth/currentSession";
import { fetchPlayer } from "@/lib/rating/players";
import { fetchVariantStandings } from "@/lib/rating/variantRatings";
import { playerPath } from "@/lib/rating/playerKey";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

/**
 * What a member's name has earned: overall, then game by game, then the one
 * figure only they can see.
 *
 * Fetches its own rows. This is four queries — the player, the standings, the
 * member id and their own reads on their own games — and the page ran all
 * four on every visit, including the visits that were somebody changing their
 * time zone.
 */
export async function MyRecord({ name }: { name: string }) {
  const mineId = await currentMemberId();
  const [profile, standings, tally] = await Promise.all([
    name === "" ? Promise.resolve(null) : fetchPlayer(name),
    name === "" ? Promise.resolve([]) : fetchVariantStandings(name),
    mineId === null ? Promise.resolve(EMPTY_VERDICTS) : fetchVerdictTally(mineId),
  ]);
  // The same rule the members directory follows, from the same module, so the
  // two cannot answer differently about the same person.
  const shown = ratingShown(profile);

  // No heading of its own: the tab above says "Record 戦績", and a heading a
  // line under it said the same word and the same kanji again.
  return (
    <div className="flex flex-col gap-3" data-testid="my-record">
      {profile === null ? (
        <p className="text-sm text-muted">
          No rated games yet. Rated games are shared games between two members: challenge someone from the{" "}
          <Link href="/players" className="underline underline-offset-4">players</Link> page.
        </p>
      ) : (
        <p className="text-sm">
          {/*
            Both pools, on the page somebody opens to see their own record.
            It showed the ladder columns alone, so a member whose games had all
            been against the computer players read "– Unrated · No games yet"
            about themselves while their own profile page showed five games and
            a rating. That is this morning's directory bug, on the one page
            where a person is looking for THEIR OWN figures.

            The rating is not summed and never will be — it is the ladder
            rating, or failing that the computer one, marked. The counts are
            both pools, and they link to all their rated games rather than to
            one pool's, because that is the number they are under.
          */}
          Overall:{" "}
          <span className="font-mono tabular-nums" data-testid="my-rating">
            {shown === null ? "–" : shown.rating}
            {shown?.pool === RATING_POOLS.computer ? (
              <span
                className="ml-1 font-mincho text-[0.68rem] font-normal opacity-70"
                title="Earned against the computer players, which are rated in a pool of their own."
                data-testid="my-rating-computer"
              >
                機械
              </span>
            ) : null}
          </span>{" "}
          <span className="text-muted">
            {TIER_DISPLAY[shown?.tier ?? "unrated"].label} ·{" "}
            <RecordLine record={gamesPlayed(profile)} of={{ player: name, rated: "yes" }} />
          </span>
        </p>
      )}
      {standings.length > 0 ? (
        <table className="w-full text-sm" data-testid="me-standings">
          <thead className="text-left text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
            <tr>
              <th className="py-1 pr-3">Game</th>
              <th className="py-1 pr-3">Rating</th>
              <RecordHeadings />
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => (
              <tr key={row.variant} className="border-t border-rule">
                {/* The standing rule: a game's name leads to that game. */}
                <td className="py-1 pr-3">
                  <GameName variant={row.variant as RuleVariant} />
                </td>
                <td className="py-1 pr-3 font-mono tabular-nums">{row.tier === "unrated" ? "–" : row.rating}</td>
                <RecordCells
                  record={row}
                  of={{ player: name, variant: row.variant, pool: "people", rated: "yes" }}
                />
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {tally.answered > 0 ? (
        <p className="text-xs text-muted" data-testid="verdict-tally">
          Your own read: you thought you played well in {tally.up} of the {tally.answered} games you judged
          {tally.upWins > 0 || tally.downWins > 0
            ? `, and won ${tally.upWins} of the ${tally.up} you felt good about and ${tally.downWins} of the ${tally.down} you did not`
            : ""}
          . Only you see this.
        </p>
      ) : null}
      {name !== "" ? (
        <p className="text-xs">
          <Link href={playerPath(name)} className="underline underline-offset-4">
            Your public page
          </Link>{" "}
          · <Link href="/games" className="underline underline-offset-4">Your games</Link>
        </p>
      ) : null}
    </div>
  );
}
