import Link from "next/link";
import { notFound } from "next/navigation";

import { GameReplay } from "@/components/history/GameReplay";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { fetchGameDetail } from "@/lib/history/gameHistory";
import { GAME_RESULT_DISPLAY } from "@/lib/history/gameHistory.constants";
import { SEAT_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { variantLabel } from "@/lib/gomoku/variants.constants";

export default async function GameDetailPage({
  params,
}: PageProps<"/history/[id]">) {
  const { id } = await params;
  const game = await fetchGameDetail(id);
  if (game === null) notFound();

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

        <GameReplay game={game} />
      </main>
    </div>
  );
}
