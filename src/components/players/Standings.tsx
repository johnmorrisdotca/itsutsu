import { RecordCells, RecordHeadings } from "./PlayerRecord";
import { playerPath } from "@/lib/rating/playerKey";
import Link from "next/link";

import { TIER_DISPLAY } from "@/lib/rating/elo";
import type { RatingTier } from "@/lib/rating/elo";
import type { VariantStanding } from "@/lib/rating/variantRatings";

/** A player's name, leading to their page. */
export function PlayerLink({ name }: { name: string }) {
  return (
    <Link href={playerPath(name)} className="underline-offset-2 hover:underline">
      {name}
    </Link>
  );
}

/** A rating tier in a word and its kanji, as the ladder writes it. */
export function TierMark({ tier }: { tier: RatingTier }) {
  return (
    <>
      {TIER_DISPLAY[tier].label} <span className="font-mincho text-muted">{TIER_DISPLAY[tier].kanji}</span>
    </>
  );
}

const HEAD_CLASS = "text-left text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase";

/** One game's ladder, best first, numbered from the top. */
export function StandingsTable({ standings }: { standings: VariantStanding[] }) {
  return (
    <table className="w-full text-sm" data-testid="standings-table">
      <thead className={HEAD_CLASS}>
        <tr>
          <th className="py-1 pr-3">#</th>
          <th className="py-1 pr-3">Player</th>
          <th className="py-1 pr-3">Rating</th>
          <th className="py-1 pr-3">Tier</th>
          <RecordHeadings />
        </tr>
      </thead>
      <tbody>
        {standings.map((standing, index) => (
          <tr key={standing.key} className="border-t border-rule">
            <td className="py-1.5 pr-3 font-mono text-muted tabular-nums">{index + 1}</td>
            <td className="py-1.5 pr-3">
              <PlayerLink name={standing.name} />
            </td>
            <td className="py-1.5 pr-3 font-mono tabular-nums">{standing.rating}</td>
            <td className="py-1.5 pr-3">
              <TierMark tier={standing.tier} />
            </td>
            <RecordCells
              record={standing}
              of={{ player: standing.name, variant: standing.variant, pool: "people", rated: "yes" }}
            />
          </tr>
        ))}
      </tbody>
    </table>
  );
}
