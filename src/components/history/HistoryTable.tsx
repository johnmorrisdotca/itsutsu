import { Paired } from "@/components/i18n/Paired";
import Link from "next/link";

import { GameName } from "@/components/games/GameName";
import { PlayerName } from "@/components/players/PlayerName";
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
          <li key={game.id} className="relative">
            <div className="grid grid-cols-2 items-center gap-3 rounded-xl border border-rule px-4 py-3 transition-colors hover:bg-shade sm:grid-cols-[1fr_auto_auto_auto]">
              <Link
                href={matchPath(game.variant, game.id)}
                className="absolute inset-0 rounded-xl"
                aria-label={`Replay: ${game.blackName.trim() || SEAT_DISPLAY.one.label} vs ${game.whiteName.trim() || SEAT_DISPLAY.two.label}, ${playedOn(game.playedAt)}`}
              />
              <span className="flex flex-col">
                <span className="font-medium">
                  <PlayerName name={game.blackName} fallback={SEAT_DISPLAY.one.label} linkable={linkable} className="relative z-10" testId="history-player" />
                  <span className="px-2 text-muted">vs</span>
                  <PlayerName name={game.whiteName} fallback={SEAT_DISPLAY.two.label} linkable={linkable} className="relative z-10" testId="history-player" />
                </span>
                <span className="text-xs text-muted">{playedOn(game.playedAt)}</span>
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
            </div>
          </li>
        );
      })}
    </ul>
  );
}
