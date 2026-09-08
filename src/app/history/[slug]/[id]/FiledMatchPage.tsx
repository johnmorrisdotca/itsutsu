import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { GameReplay } from "@/components/history/GameReplay";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SEAT_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { matchPath, recordPath, slugFor } from "@/lib/gomoku/slugs";
import { variantLabel } from "@/lib/gomoku/variants.constants";
import { fetchGameDetail } from "@/lib/history/gameHistory";
import { GAME_RESULT_DISPLAY } from "@/lib/history/gameHistory.constants";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { currentSession } from "@/lib/auth/currentSession";
import { prisma } from "@/lib/prisma";

/**
 * A filed game, at /history/<slug>/<id>: the replay, and with a move number on
 * the end, /history/<slug>/<id>/12, the position after the twelfth stone. The scrubber
 * keeps the address on the position it shows, so the bar can be copied to
 * send someone exactly this moment of the game.
 */
export async function FiledMatchPage({ slug, id, move }: { slug: string; id: string; move?: number }) {
  const game = await fetchGameDetail(id);
  if (game === null || slugFor(game.variant) !== slug) notFound();
  if (move !== undefined && (!Number.isInteger(move) || move < 0 || move > game.moveCount)) {
    notFound();
  }
  // Still being played: it is not in the record yet.
  if (game.status === "active") redirect(matchPath(game.variant, game.id, move));

  /*
   * A rematch is a challenge to the other seat's account, offered to whoever
   * held a seat here and is signed in. Colours swap: the challenger takes black.
   */
  const [me, members] = await Promise.all([
    currentSession(),
    prisma.game.findUnique({ where: { id }, select: { blackMember: true, whiteMember: true } }),
  ]);
  const mine = me?.email ?? null;
  const other =
    mine === null || members === null
      ? null
      : members.blackMember === mine
        ? members.whiteMember
        : members.whiteMember === mine
          ? members.blackMember
          : null;

  return <FiledMatch game={game} move={move ?? game.moveCount} rematch={other} />;
}

function FiledMatch({ game, move, rematch }: { game: GameDetail; move: number; rematch: string | null }) {
  const result = GAME_RESULT_DISPLAY[game.result];
  const black = game.blackName.trim() || SEAT_DISPLAY.one.label;
  const white = game.whiteName.trim() || SEAT_DISPLAY.two.label;

  return (
    <Page width="wide" gap="gap-6">
      <SiteHeader />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">
            {black} <span className="px-1 text-muted">vs</span> {white}
          </h1>
          <p className="text-sm text-muted">
            Started {new Date(game.playedAt).toLocaleString()}
            {game.lastMoveAt !== null ? ` · finished ${new Date(game.lastMoveAt).toLocaleString()}` : ""} ·{" "}
            {game.size}×{game.size} ·{" "}
            {variantLabel(game.variant)}{" "}
            · {result.label} <span className="font-mincho">{result.kanji}</span>
          </p>
        </div>
        <span className="flex items-center gap-3">
          {rematch !== null ? (
            <ChallengeButton email={rematch} variant={game.variant} label="Rematch 再戦" strong />
          ) : null}
          <ChallengeButton from={{ id: game.id, move }} label={`Play from move ${move} 分岐`} />
          <Link href={recordPath(game.variant)} className="text-sm underline underline-offset-4">
            Back to the record
          </Link>
        </span>
      </div>

      <GameReplay
        game={game}
        initialIndex={move}
        basePath={recordPath(game.variant, game.id)}
      />
  </Page>
  );
}
