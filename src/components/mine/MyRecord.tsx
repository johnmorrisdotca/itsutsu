import { RecordLine } from "@/components/players/PlayerRecord";
import { RecordTable } from "@/components/players/RecordTable";
import Link from "next/link";

import { EMPTY_VERDICTS, fetchVerdictTally } from "@/lib/history/verdicts";
import { GameCount } from "@/components/games/GameCount";
import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { RATING_POOLS } from "@/lib/rating/pools";
import { gamesPlayed, ratingShown } from "@/lib/rating/shownRecord";
import { fetchPlayerRecord } from "@/lib/history/playerRecord";
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
  const [profile, standings, tally, played] = await Promise.all([
    // By id where there is one: a rating is keyed by the name it was earned
    // under, and that key stays put when somebody renames.
    name === "" && mineId === null ? Promise.resolve(null) : fetchPlayer(name, mineId),
    name === "" && mineId === null ? Promise.resolve([]) : fetchVariantStandings(name, mineId),
    mineId === null ? Promise.resolve(EMPTY_VERDICTS) : fetchVerdictTally(mineId),
    /*
     * Every game this person finished, from the games table — 0.147.1's fix.
     * `profile` is the rating table and only holds RATED games, so the line
     * below read "No games yet" to somebody whose own public page showed
     * their games. This is the page where a person looks for THEIR OWN figures.
     */
    fetchPlayerRecord(name, mineId),
  ]);
  const here = gamesPlayed(played);
  // The same rule the members directory follows, from the same module, so the
  // two cannot answer differently about the same person.
  const shown = ratingShown(profile);

  // No heading of its own: the tab above says "Record 戦績", and a heading a
  // line under it said the same word and the same kanji again.
  return (
    <div className="flex flex-col gap-3" data-testid="my-record">
      {profile === null ? (
        <p className="text-sm text-muted">
          No games yet. Rated games are shared games between two members: challenge someone from the{" "}
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
            {/*
              The run across every rated game here, whichever pool scored it —
              the same set of games the counts on this line are counting, and
              stored on the row rather than worked out from the games.
            */}
            <RecordLine
              record={here}
              of={{ player: name }}
              /*
               * NULL rather than the rated run — a decision, not an omission.
               * This line counts every game; the stored runs are people,
               * computer and rated, none of which is that set, and the streak
               * words its scope from `of`. A rated run here would be described
               * as a run over every game, which it is not. Dash over a
               * plausible number. See the members list for the same choice.
               */
              streak={null}
            />
          </span>
        </p>
      )}
      {/*
        The same table as the members list, the ladder, the computer players
        and every per-game ladder. It had the rating second and they had it
        seventh; now there is one order and one set of headings, and this page
        chooses only which optional columns it wants.
      */}
      <RecordTable
        subject="Game"
        rows={standings.map((row) => ({
          key: `${row.variant}-${row.pool}`,
          subject: (
            <>
              {/* The standing rule: a game's name leads to that game. */}
              <GameThumb variant={row.variant} className="mr-2 inline-block size-6 align-middle" />
              <GameName variant={row.variant as RuleVariant} />
              {/*
                A game somebody has played in both pools is two lines and not
                one added together — that sum is the thing the pools exist to
                forbid. So each line says which ladder it is, and without the
                mark the two would read as one game listed twice with different
                numbers against it.

                One mark per row, beside the NAME. It was drawn twice for a
                while, once here and once on the rating.
              */}
              {row.pool === RATING_POOLS.computer ? (
                <span
                  className="ml-1 font-mincho text-[0.68rem] font-normal opacity-70"
                  title="Against the computer players, rated in a pool of their own."
                  data-testid="standing-pool-computer"
                >
                  機械
                </span>
              ) : null}
            </>
          ),
          record: row,
          of: { player: name, variant: row.variant, pool: row.pool, rated: "yes" },
          // One row is one pool of one game, so its run is that pool's run —
          // the only streak on the row that the counts beside it account for.
          streak: row.streak,
          // A rating nobody has settled yet is silence, not 1600. The pool
          // mark is on the name, so the number here needs none of its own.
          rating: row.tier === "unrated" ? null : { rating: row.rating, pool: row.pool },
          tier: row.tier,
        }))}
        columns={{ tier: true }}
        testId="me-standings"
        empty={
          <>
            No rated game of any one game yet. Rated games are shared games between two
            members, or a game against one of the{" "}
            <Link href="/players?view=computers" className="underline underline-offset-4">
              computer players
            </Link>
            .
          </>
        }
      />
      {tally.answered > 0 ? (
        <p className="text-xs text-muted" data-testid="verdict-tally">
          {/*
            Each of these leads to the games it counted. They were plain text
            until now, and the gate that guards this rule listed them as an
            exception with the honest reason: the record could not be asked
            for a verdict, so there was no page for the number to lead to. It
            can now, so there is.

            The tail is still a sentence and stays one. "Won 3 of the 7 you
            felt good about" is a count of a count — the record can say which
            games you judged well, and cannot also say which of those you won
            in the same breath, because winning is read from your side and
            already spoken for by `outcome`.
          */}
          Your own read: you thought you played well in{" "}
          <GameCount count={tally.up} player={name} verdict="up" title="The games you thought you played well" /> of
          the{" "}
          <GameCount count={tally.answered} player={name} verdict="judged" title="Every game you judged" /> games you judged
          {tally.upWins > 0 || tally.downWins > 0
            ? `, and won ${tally.upWins} of the ${tally.up} you felt good about and ${tally.downWins} of the ${tally.down} you did not`
            : ""}
          . Only you see this.
        </p>
      ) : null}
      {name !== "" ? (
        <p className="text-xs">
          <Link href={playerPath(name, mineId)} className="underline underline-offset-4">
            Your public page
          </Link>{" "}
          · <Link href="/play" className="underline underline-offset-4">Your games</Link>
        </p>
      ) : null}
    </div>
  );
}
