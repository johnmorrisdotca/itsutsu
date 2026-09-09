import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Applause } from "@/components/history/Applause";
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
import { HideGameButton } from "@/components/history/HideGameButton";
import { SelfVerdict, type Verdict } from "@/components/history/SelfVerdict";
import { seatCookieName } from "@/lib/history/seatCookie";
import { resolveSeat } from "@/lib/history/seats";
import { cookies } from "next/headers";
import { currentSession } from "@/lib/auth/currentSession";
import { fetchApplause, type ApplauseTally } from "@/lib/history/applause";
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
  const [me, members, applause] = await Promise.all([
    currentSession(),
    prisma.game.findUnique({
      where: { id },
      select: { blackMemberId: true, whiteMemberId: true, hiddenByBlack: true, hiddenByWhite: true, blackVerdict: true, whiteVerdict: true },
    }),
    currentSession().then((session) => fetchApplause(id, session?.email ?? null)),
  ]);
  const mine = me?.email ?? null;
  const myColour =
    mine === null || members === null ? null : members.blackMemberId === mine ? "black" : members.whiteMemberId === mine ? "white" : null;
  const hidden = myColour === "black" ? members?.hiddenByBlack ?? false : myColour === "white" ? members?.hiddenByWhite ?? false : false;
  const other =
    mine === null || members === null
      ? null
      : members.blackMemberId === mine
        ? members.whiteMemberId
        : members.whiteMemberId === mine
          ? members.blackMemberId
          : null;

  // A seat held by cookie counts too: a game played from a scanned link, or at one screen.
  const claim = await resolveSeat(id, (await cookies()).get(seatCookieName(id))?.value, mine);
  const seatColour = myColour ?? claim?.seat ?? null;
  const verdict = (seatColour === "black" ? members?.blackVerdict : seatColour === "white" ? members?.whiteVerdict : null) as Verdict;

  return (
    <FiledMatch
      game={game}
      move={move ?? game.moveCount}
      rematch={other}
      seated={myColour !== null}
      hidden={hidden}
      verdict={seatColour === null ? undefined : verdict}
      applause={applause}
      signedIn={mine !== null}
    />
  );
}

function FiledMatch({
  game,
  move,
  rematch,
  seated,
  hidden,
  verdict,
  applause,
  signedIn,
}: {
  game: GameDetail;
  move: number;
  rematch: string | null;
  seated: boolean;
  hidden: boolean;
  /** The viewer's own read on their play, when they held a seat; undefined for a reader. */
  verdict?: Verdict;
  applause: ApplauseTally;
  signedIn: boolean;
}) {
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
            {!game.rated ? <span className="ml-2 rounded-full border border-rule px-2 py-0.5 text-xs">Friendly · unrated</span> : null}
          </p>
        </div>
        <span className="flex items-center gap-3">
          {rematch !== null ? (
            <ChallengeButton email={rematch} variant={game.variant} label="Rematch 再戦" strong />
          ) : null}
          <ChallengeButton from={{ id: game.id, move }} label={`Play from move ${move} 分岐`} />
          {seated ? <HideGameButton id={game.id} hidden={hidden} /> : null}
          <Link href={recordPath(game.variant)} className="text-sm underline underline-offset-4">
            Back to the record
          </Link>
        </span>
      </div>

      {verdict !== undefined ? <SelfVerdict id={game.id} initial={verdict} /> : null}

      {/* Anybody may say the game was worth playing, not only the two who played it. */}
      <Applause gameId={game.id} initial={applause} signedIn={signedIn} />

      <GameReplay
        game={game}
        initialIndex={move}
        basePath={recordPath(game.variant, game.id)}
      />
  </Page>
  );
}
