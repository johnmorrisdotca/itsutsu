import { Paired } from "@/components/i18n/Paired";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Applause } from "@/components/history/Applause";
import { GameReplay } from "@/components/history/GameReplay";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PlayerName } from "@/components/players/PlayerName";
import { SEAT_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { historyPath, matchPath } from "@/lib/gomoku/slugs";
import { fetchGameDetail } from "@/lib/history/gameHistory";
import { GAME_RESULT_DISPLAY } from "@/lib/history/gameHistory.constants";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { HideGameButton } from "@/components/history/HideGameButton";
import { SelfVerdict, type Verdict } from "@/components/history/SelfVerdict";
import { seatCookieName } from "@/lib/history/seatCookie";
import { resolveSeat } from "@/lib/history/seats";
import { cookies } from "next/headers";
import { currentMemberId, currentSession } from "@/lib/auth/currentSession";
import { Conversation } from "@/components/history/Conversation";
import { fetchApplause, type ApplauseTally } from "@/lib/history/applause";
import { ignoredEmails } from "@/lib/social/ignores";
import { appearanceFor } from "@/lib/auth/members";
import { appearanceFrom } from "@/components/board/appearance";
import type { Appearance } from "@/components/board/board.types";
import { ratingRefusal } from "@/lib/rating/rateable";
import { RATING_REFUSAL_DISPLAY, type RatingRefusal } from "@/lib/rating/rateable.constants";
import { prisma } from "@/lib/prisma";
import { GameName } from "@/components/games/GameName";

/**
 * A match that has been filed: the replay, at the address the match has always
 * had — /games/<slug>/match/<id>, and with a move number on the end,
 * /games/<slug>/match/<id>/12, the position after the twelfth stone. The
 * scrubber keeps the address on the position it shows, so the bar can be
 * copied to send someone exactly this moment of the game.
 *
 * Rendered by `MatchPage` rather than routed to. It used to be a second
 * address under /history that the live board redirected to the moment a game
 * ended — so it checked the slug and the status for itself and sent a reader
 * back if either was wrong. Both are now settled by the caller before this is
 * reached, and the status check in particular MUST NOT come back: redirecting
 * to the match's address from inside the match's address is a loop.
 */
export async function FiledMatchPage({ id, move }: { id: string; move?: number }) {
  // The whole conversation, not the last thirty of it. This is the page it is
  // kept on, and a record that quietly begins in the middle is not a record.
  const game = await fetchGameDetail(id, { whole: true });
  if (game === null) notFound();
  if (move !== undefined && (!Number.isInteger(move) || move < 0 || move > game.moveCount)) {
    notFound();
  }

  /*
   * A rematch is the same game again — same board, same rules, same clock,
   * same opponent — asked for by naming the game rather than by addressing
   * its other player. That is the whole difference: an address is what a
   * computer player does not have, and a game against one is where wanting
   * another immediately is the ordinary case rather than the rare one.
   */
  const [me, myId, members, applause] = await Promise.all([
    currentSession(),
    currentMemberId(),
    prisma.game.findUnique({
      where: { id },
      select: { blackMemberId: true, whiteMemberId: true, hiddenByBlack: true, hiddenByWhite: true, blackVerdict: true, whiteVerdict: true },
    }),
    currentSession().then((session) => fetchApplause(id, session?.email ?? null)),
  ]);
  const mine = me?.email ?? null;
  /*
   * By the member's id, not by their address.
   *
   * A seat has carried the opaque id since seats stopped being held by an
   * address, and this page went on comparing it against the signed-in email.
   * Both are strings so it compiled, and it can never be true: nobody was
   * recognised as having played their own game. No rematch was offered, the
   * hidden flag read as false whatever the player had set, and the seat
   * resolver was handed an address where it wanted an id.
   */
  const myColour =
    myId === null || members === null
      ? null
      : members.blackMemberId === myId
        ? "black"
        : members.whiteMemberId === myId
          ? "white"
          : null;
  const hidden = myColour === "black" ? members?.hiddenByBlack ?? false : myColour === "white" ? members?.hiddenByWhite ?? false : false;
  const otherId =
    myColour === null || members === null
      ? null
      : myColour === "black"
        ? members.whiteMemberId
        : members.blackMemberId;

  /*
   * The two seats' addresses, for the two things that are addressed rather
   * than identified: a challenge is sent to somebody's email, and the ignore
   * list is still kept by address. One read serves both.
   */
  const seatIds = [members?.blackMemberId, members?.whiteMemberId].filter((one) => one !== null && one !== undefined);
  const seatRows =
    seatIds.length === 0
      ? []
      : await prisma.member.findMany({ where: { id: { in: seatIds } }, select: { id: true, email: true } });
  const addressOf = (memberId: string | null | undefined) =>
    memberId === null || memberId === undefined
      ? null
      : seatRows.find((row) => row.id === memberId)?.email ?? null;
  /*
   * Which colour this reader would play next time, or null if there is no
   * next time to offer — they did not play, or nobody was sitting opposite.
   * Named on the button, because the colour changes.
   */
  const againIn = otherId === null ? null : myColour === "black" ? "white" : myColour === "white" ? "black" : null;

  /*
   * Ignoring somebody stopped at the final stone: their messages were hidden
   * in the game and printed in the record. A colour whose player this reader
   * has ignored is left out of the conversation below.
   */
  const ignored = mine === null ? new Set<string>() : await ignoredEmails(mine);
  const silenced = new Set<string>();
  for (const [stone, memberId] of [
    ["black", members?.blackMemberId],
    ["white", members?.whiteMemberId],
  ] as const) {
    const address = addressOf(memberId);
    if (address !== null && ignored.has(address)) silenced.add(stone);
  }

  /*
   * Why this game moved no rating, when it moved none.
   *
   * Only for a game that was played to a result: an abandoned one was never
   * going to count, and saying so on every unfinished board would be noise
   * over the top of an answer nobody was waiting for. A game somebody played
   * out to the end and then could not find in their figures is the silence
   * this fills.
   */
  /*
   * THE NAMES AS PLAYED, not the names to show. `ratingRefusal` asks whether one
   * person held both seats, and the ladder is keyed by the name a game was played
   * under — so this has to read what the row says, not what the screen says. The
   * two are the same word until somebody renames, and `recordResult` decides the
   * real thing off the raw row: reading the resolved names here would let this
   * page explain a refusal the database never made.
   */
  const refusal =
    game.rated && game.result !== "abandoned" ? ratingRefusal(game.playedAs.black, game.playedAs.white) : null;

  /*
   * The reader's own board, on the page they will spend the longest looking
   * at one. The record drew the default and nothing else, so somebody who had
   * chosen a board played on it and then went back through the game on a
   * board they had never asked for.
   */
  const appearance = appearanceFrom(await appearanceFor(mine));

  // A seat held by cookie counts too: a game played from a scanned link, or at one screen.
  const claim = await resolveSeat(id, (await cookies()).get(seatCookieName(id))?.value, myId);
  const seatColour = myColour ?? claim?.seat ?? null;
  const verdict = (seatColour === "black" ? members?.blackVerdict : seatColour === "white" ? members?.whiteVerdict : null) as Verdict;

  return (
    <FiledMatch
      game={game}
      move={move ?? game.moveCount}
      againIn={againIn}
      seated={myColour !== null}
      hidden={hidden}
      verdict={seatColour === null ? undefined : verdict}
      applause={applause}
      signedIn={mine !== null}
      silenced={silenced}
      refusal={refusal}
      appearance={appearance}
    />
  );
}

function FiledMatch({
  game,
  move,
  againIn,
  seated,
  hidden,
  verdict,
  applause,
  signedIn,
  silenced,
  refusal,
  appearance,
}: {
  game: GameDetail;
  move: number;
  /** The colour this reader takes in a rematch, or null when there is none to offer. */
  againIn: "black" | "white" | null;
  seated: boolean;
  hidden: boolean;
  /** Colours whose player this reader has ignored. */
  silenced: ReadonlySet<string>;
  /** Why the ladder did not move for this game, when it did not. */
  refusal: RatingRefusal | null;
  /** How this reader likes a board dressed. */
  appearance: Appearance;
  /** The viewer's own read on their play, when they held a seat; undefined for a reader. */
  verdict?: Verdict;
  applause: ApplauseTally;
  signedIn: boolean;
}) {
  const result = GAME_RESULT_DISPLAY[game.result];
  /*
   * A name here is the way to the person. An abandoned game has no result to
   * anybody's credit and its names may be nobody's, so those stay plain — the
   * same line the record table draws.
   */
  const named = game.result !== "abandoned";

  return (
    <Page width="wide" gap="gap-6">
      <SiteHeader />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">
            <PlayerName name={game.blackName} memberId={game.blackMemberId} fallback={SEAT_DISPLAY.one.label} linkable={named} />
            <span className="px-1 text-muted">vs</span>
            <PlayerName name={game.whiteName} memberId={game.whiteMemberId} fallback={SEAT_DISPLAY.two.label} linkable={named} />
          </h1>
          <p className="text-sm text-muted">
            Started {new Date(game.playedAt).toLocaleString()}
            {game.lastMoveAt !== null ? ` · finished ${new Date(game.lastMoveAt).toLocaleString()}` : ""} ·{" "}
            {game.size}×{game.size} ·{" "}
            <GameName variant={game.variant} />{" "}
            · <Paired en={result.label} kanji={result.kanji} kanjiClassName="" />
            {!game.rated ? <span className="ml-2 rounded-full border border-rule px-2 py-0.5 text-xs">Friendly · unrated</span> : null}
          </p>
        </div>
        <span className="flex items-center gap-3">
          {/*
            Offered by the game rather than by an address, which is what makes
            it work against a computer player — those have no address, and a
            game against one is the case where wanting another straight away is
            the normal thing rather than the rare one.

            The colour is on the button because it changes. Black moves first
            and that is worth something, so a rematch swaps; a swap nobody
            mentions is the kind of thing somebody notices three moves in.
          */}
          {againIn !== null ? (
            <ChallengeButton
              rematch={game.id}
              label={`Play again as ${againIn === "black" ? "Black 黒" : "White 白"}`}
              strong
            />
          ) : null}
          <ChallengeButton from={{ id: game.id, move }} label={`Play from move ${move} 分岐`} />
          {seated ? <HideGameButton id={game.id} hidden={hidden} /> : null}
          <Link href={historyPath(game.variant)} className="text-sm underline underline-offset-4">
            Back to the record
          </Link>
        </span>
      </div>

      {/*
        Above everything the game itself offers, because it answers a question
        the page otherwise leaves a player to answer alone: they played this
        out, and it is not in their figures.
      */}
      {refusal !== null ? (
        <p
          className="rounded-lg border border-ochre/60 bg-ochre-soft px-3 py-2 text-sm text-ink"
          data-testid="record-unrated"
        >
          <span className="font-semibold">{RATING_REFUSAL_DISPLAY[refusal].filed}</span>{" "}
          <span className="font-mincho">{RATING_REFUSAL_DISPLAY[refusal].kanji}</span>
          {". "}
          {RATING_REFUSAL_DISPLAY[refusal].sentence}
        </p>
      ) : null}

      {verdict !== undefined ? <SelfVerdict id={game.id} initial={verdict} /> : null}

      {/* Anybody may say the game was worth playing, not only the two who played it. */}
      <Applause gameId={game.id} initial={applause} signedIn={signedIn} />

      <GameReplay
        game={game}
        initialIndex={move}
        basePath={matchPath(game.variant, game.id)}
        appearance={appearance}
      />

      {/*
        Under the board rather than beside it, and after the replay, because
        it is read against the moves: each remark links to the position it was
        made at, and the replay above is what it moves.
      */}
      <Conversation
        game={game}
        basePath={matchPath(game.variant, game.id)}
        hidden={silenced}
      />
  </Page>
  );
}
