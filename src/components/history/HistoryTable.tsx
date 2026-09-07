import Link from "next/link";

import { GAME_RESULT_DISPLAY } from "@/lib/history/gameHistory.constants";
import type { GameSummary } from "@/lib/history/gameHistory.types";
import { RULE_VARIANT_DISPLAY, SEAT_DISPLAY } from "@/lib/gomoku/gomoku.constants";

function playedOn(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function nameOr(name: string, fallback: string): string {
  return name.trim() === "" ? fallback : name;
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
        return (
          <li key={game.id}>
            <Link
              href={`/history/${game.id}`}
              className="grid grid-cols-2 items-center gap-3 rounded-xl border border-rule px-4 py-3 transition-colors hover:bg-black/[0.03] sm:grid-cols-[1fr_auto_auto_auto] dark:hover:bg-white/[0.04]"
            >
              <span className="flex flex-col">
                <span className="font-medium">
                  {nameOr(game.blackName, SEAT_DISPLAY.one.label)}
                  <span className="px-2 text-muted">vs</span>
                  {nameOr(game.whiteName, SEAT_DISPLAY.two.label)}
                </span>
                <span className="text-xs text-muted">{playedOn(game.playedAt)}</span>
              </span>

              <span className="text-sm text-muted">
                {game.size}×{game.size}
                <span className="px-2">·</span>
                {RULE_VARIANT_DISPLAY[
                  game.variant as "freestyle" | "standard"
                ]?.label ?? game.variant}
              </span>

              <span className="text-sm text-muted tabular-nums">
                {game.moveCount} moves
              </span>

              <span className="justify-self-end rounded-full border border-rule px-2.5 py-0.5 text-xs font-medium">
                {result.label}
                <span className="font-mincho ml-1.5 text-muted">{result.kanji}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
