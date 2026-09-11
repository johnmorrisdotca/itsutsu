import { Paired } from "@/components/i18n/Paired";
import { RecordCells, RecordHeadings } from "./PlayerRecord";
import { playerPath } from "@/lib/rating/playerKey";
import Link from "next/link";

import { TIER_DISPLAY } from "@/lib/rating/elo";
import type { RatingTier } from "@/lib/rating/elo";
import type { VariantStanding } from "@/lib/rating/variantRatings";
import type { ReactNode } from "react";
import { shownName } from "@/lib/rating/shownName";

/** A player's name, leading to their page. */
export function PlayerLink({ name }: { name: string }) {
  return (
    <Link href={playerPath(name)} className="underline-offset-2 hover:underline">
      {shownName(name)}
    </Link>
  );
}

/** A rating tier in a word and its kanji, as the ladder writes it. */
export function TierMark({ tier }: { tier: RatingTier }) {
  return (
    <>
      <Paired en={TIER_DISPLAY[tier].label} kanji={TIER_DISPLAY[tier].kanji} kanjiClassName="text-muted" />
    </>
  );
}

const HEAD_CLASS = "text-left text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase";

/** One game's ladder, best first, numbered from the top. */
export function StandingsTable({
  standings,
  pool = "people",
  actions,
  actionsLabel = "",
  testId = "standings-table",
}: {
  standings: VariantStanding[];
  /**
   * Which ladder these figures came from, so the counts lead to the games
   * behind THEM and not to a wider set.
   *
   * A rating's record is the rated games of one pool and nothing else. A link
   * that quietly dropped the pool would answer a different question from the
   * number it sits under — the same fault as a figure that reads the wrong
   * half of a row, one level down.
   */
  pool?: "people" | "computer";
  /**
   * What the reader may do about each of these people.
   *
   * A column rather than a second table, because "every opponent you are
   * shown offers what you would want to do about them" is about the list a
   * reader is actually looking at — and a ladder is a list of opponents
   * wearing a ranking. A game's own page shows this; /champions does not,
   * which is a decision that page can make for itself rather than a second
   * component to keep in step with this one.
   *
   * Absent by default, so a page that has no reader to act on the answer
   * pays for no column at all.
   */
  actions?: (standing: VariantStanding) => ReactNode;
  actionsLabel?: string;
  testId?: string;
}) {
  return (
    <table className="w-full text-sm" data-testid={testId}>
      <thead className={HEAD_CLASS}>
        <tr>
          <th className="py-1 pr-3">#</th>
          <th className="py-1 pr-3">Player</th>
          <th className="py-1 pr-3">Rating</th>
          <th className="py-1 pr-3">Tier</th>
          <RecordHeadings trailing={actions === undefined ? undefined : <th className="py-1 pr-3">{actionsLabel}</th>} />
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
              of={{ player: standing.name, variant: standing.variant, pool, rated: "yes" }}
              trailing={actions === undefined ? undefined : <td className="py-1.5 pr-3">{actions(standing)}</td>}
            />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * The same ladder as a SIDE-VIEW: rank, player, rating, and nothing else.
 *
 * Not the full table squeezed into a narrow column — a reduced form of it,
 * which is how a leaderboard beside a page works everywhere and what John
 * asked for when the first attempt reached for a wider column instead:
 * "it should be a side-view so not the real view you see in a full page
 * obviously... less columns". The record columns, the tier and whatever else
 * belongs to the whole ladder live at /games/<game>/standings, where there is
 * room to read them.
 *
 * THE EMPTY TABLE IS THE POINT, not the case to look past. John: "empty tables
 * are fine! show the table. Show nothing has been played yet... and that's a
 * change to have a link saying - be the first to play!" So the headings are
 * drawn whether or not there is a row under them — a reader learns the shape
 * of what this site keeps before there is any data to fill it, and a game
 * nobody has touched becomes an invitation rather than an apology. See Show
 * The Data, Not The Way To It in AGENTS.md.
 *
 * `invitation` is a node rather than a string because what it says depends on
 * who is reading: somebody who can play is offered the board, and a stranger
 * has to be told that the door is a door before being sent to it.
 */
export function LadderSideView({
  standings,
  emptyNote,
  invitation,
  testId = "ladder-side-view",
}: {
  standings: VariantStanding[];
  /** What no rows MEANS here, in a sentence, under the headings. */
  emptyNote: string;
  /** The way in, for a ladder with nothing on it yet. */
  invitation?: ReactNode;
  testId?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <table className="w-full text-sm" data-testid={testId}>
        <thead className={HEAD_CLASS}>
          <tr>
            <th className="py-1 pr-2">#</th>
            <th className="py-1 pr-2">Player</th>
            <th className="py-1 text-right">Rating</th>
          </tr>
        </thead>
        <tbody>
          {standings.length === 0 ? (
            <tr className="border-t border-rule">
              <td colSpan={3} className="py-2 text-sm text-muted" data-testid="ladder-side-view-empty">
                {emptyNote}
              </td>
            </tr>
          ) : (
            standings.map((standing, index) => (
              <tr key={standing.key} className="border-t border-rule">
                <td className="py-1.5 pr-2 font-mono text-muted tabular-nums">{index + 1}</td>
                <td className="min-w-0 truncate py-1.5 pr-2">
                  <PlayerLink name={standing.name} />
                </td>
                <td className="py-1.5 text-right font-mono tabular-nums">{standing.rating}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {invitation}
    </div>
  );
}
