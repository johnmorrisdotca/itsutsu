import { RecordCells, RecordHeadings, RecordLine } from "@/components/players/PlayerRecord";
import Link from "next/link";

import { EMPTY_VERDICTS, fetchVerdictTally } from "@/lib/history/verdicts";
import { GameName } from "@/components/games/GameName";
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
          Overall: <span className="font-mono tabular-nums">{profile.tier === "unrated" ? "–" : profile.rating}</span>{" "}
          <span className="text-muted">
            {TIER_DISPLAY[profile.tier].label} · <RecordLine record={profile} />
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
                <RecordCells record={row} />
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
