import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { GameReplay } from "@/components/history/GameReplay";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SEAT_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { matchPath, recordPath } from "@/lib/gomoku/slugs";
import { variantLabel } from "@/lib/gomoku/variants.constants";
import { fetchGameDetail } from "@/lib/history/gameHistory";
import { GAME_RESULT_DISPLAY } from "@/lib/history/gameHistory.constants";
import type { GameDetail } from "@/lib/history/gameHistory.types";

/**
 * A filed game, at /history/<id>: the replay, and with a move number on the
 * end, /history/<id>/12, the position after the twelfth stone. The scrubber
 * keeps the address on the position it shows, so the bar can be copied to
 * send someone exactly this moment of the game.
 */
export async function FiledMatchPage({ id, move }: { id: string; move?: number }) {
  const game = await fetchGameDetail(id);
  if (game === null) notFound();
  if (move !== undefined && (!Number.isInteger(move) || move < 0 || move > game.moveCount)) {
    notFound();
  }
  // Still being played: it is not in the record yet.
  if (game.status === "active") redirect(matchPath(game.variant, game.id, move));

  return <FiledMatch game={game} move={move ?? game.moveCount} />;
}

function FiledMatch({ game, move }: { game: GameDetail; move: number }) {
  const result = GAME_RESULT_DISPLAY[game.result];
  const black = game.blackName.trim() || SEAT_DISPLAY.one.label;
  const white = game.whiteName.trim() || SEAT_DISPLAY.two.label;

  return (
    <div className="paper flex flex-1 flex-col items-center px-4 py-8 sm:px-8">
      <main className="flex w-full max-w-6xl flex-col gap-6">
        <SiteHeader />

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">
              {black} <span className="px-1 text-muted">vs</span> {white}
            </h1>
            <p className="text-sm text-muted">
              {new Date(game.playedAt).toLocaleString()} · {game.size}×{game.size} ·{" "}
              {variantLabel(game.variant)}{" "}
              · {result.label} <span className="font-mincho">{result.kanji}</span>
            </p>
          </div>
          <Link href="/history" className="text-sm underline underline-offset-4">
            Back to the record
          </Link>
        </div>

        <GameReplay
          game={game}
          initialIndex={move}
          basePath={recordPath(game.id)}
        />
      </main>
    </div>
  );
}
