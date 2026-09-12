import { Paired } from "@/components/i18n/Paired";
import Link from "next/link";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { PlayerName } from "@/components/players/PlayerName";
import { CardArrow } from "@/components/ui/CardArrow";
import { RAISED_LINK, STRETCHED_ROW } from "@/components/ui/ui.constants";
import { matchPath } from "@/lib/gomoku/slugs";

import { GAME_RESULT_DISPLAY } from "@/lib/history/gameHistory.constants";
import type { GameSummary } from "@/lib/history/gameHistory.types";
import { SEAT_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
function playedOn(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** One row per game. The whole row is the link into the replay. */
export function HistoryTable({ items }: { items: GameSummary[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-rule px-4 py-10 text-center text-sm text-muted">
        No games match these filters yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2" data-testid="history-list">
      {items.map((game) => {
        const result = GAME_RESULT_DISPLAY[game.result];
        // An abandoned game earns nobody a record, so its names lead nowhere.
        const linkable = game.result !== "abandoned";
        return (
          // The row is the link into the replay, stretched over the card; a name inside it is its own link, above it.
          <li key={game.id} className="relative" data-testid="history-row">
            {/*
              The row has always been the link; the arrow is what says so, and
              it is the same sign every card on the site that opens now wears.
              Absolutely placed because the grid has no column to spare for it
              on a phone, with the row padded so the result never sits under it.
              The shade under the pointer follows the ROW'S link only — see
              `card-hover` in globals.css — so hovering a name no longer lights
              a row it would not open.
            */}
            <div className={`${STRETCHED_ROW} grid grid-cols-2 items-center gap-3 rounded-xl border border-rule px-4 py-3 pr-12 sm:grid-cols-[1fr_auto_auto_auto]`}>
              <Link
                href={matchPath(game.variant, game.id)}
                data-card-link=""
                className="absolute inset-0 rounded-xl"
                aria-label={`Replay: ${game.blackName.trim() || SEAT_DISPLAY.one.label} vs ${game.whiteName.trim() || SEAT_DISPLAY.two.label}, ${playedOn(game.playedAt)}`}
              />
              <span className="flex items-center gap-3">
                {/* The board, in the cell the names share, so the grid keeps its four columns. */}
                <GameThumb variant={game.variant} />
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium">
                    <PlayerName name={game.blackName} memberId={game.blackMemberId} fallback={SEAT_DISPLAY.one.label} linkable={linkable} className={RAISED_LINK} testId="history-player" />
                    <span className="px-2 text-muted">vs</span>
                    <PlayerName name={game.whiteName} memberId={game.whiteMemberId} fallback={SEAT_DISPLAY.two.label} linkable={linkable} className={RAISED_LINK} testId="history-player" />
                  </span>
                  <span className="text-xs text-muted">{playedOn(game.playedAt)}</span>
                </span>
              </span>

              <span className="text-sm text-muted">
                {game.size}×{game.size}
                <span className="px-2">·</span>
                <GameName variant={game.variant as RuleVariant} raised />
              </span>

              <span className="text-sm text-muted tabular-nums">
                {game.moveCount} moves
              </span>

              <span className="justify-self-end rounded-full border border-rule px-2.5 py-0.5 text-xs font-medium">
                <Paired en={result.label} kanji={result.kanji} kanjiClassName="ml-1.5 text-muted" />
              </span>
              <CardArrow className="absolute top-1/2 right-3 -translate-y-1/2" />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
