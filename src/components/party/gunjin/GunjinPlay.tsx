"use client";

import { useState } from "react";

import { TableEnding } from "@/components/play/GameEnding";
import { gameEndingCopy } from "@/components/play/gameEnding.constants";
import { AskIfAway } from "@/components/game/AskIfAway";
import { WinCoverOver, useWinMoment } from "@/components/game/WinCover";
import { resultLine, tableNews } from "@/components/game/winNews";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_STRONG, PLAY_SURFACE } from "@/components/ui/ui.constants";
import type { Appearance } from "@/components/board/board.types";
import { gunjinDrawn, gunjinOver, gunjinToPlay, gunjinWinners, playGunjin, resignGunjin, startGunjin } from "@/lib/party/gunjin/gunjin";
import type { GunjinGame } from "@/lib/party/gunjin/gunjin.types";
import { gunjinNews, gunjinReason } from "@/lib/party/gunjin/gunjinNews";
import { gunjinFinalView } from "@/lib/party/gunjin/gunjinView";
import { playerNumberName } from "@/lib/gomoku/seatWords";
import { partyPlayerName } from "@/lib/party/partyNames";
import { resignedBy } from "@/lib/party/resign";

import { PartyHandOver } from "../PartyHandOver";
import { TableWallpaper } from "../TableWallpaper";
import { GunjinArrange } from "./GunjinArrange";
import { GunjinBoard } from "./GunjinBoard";
import { GunjinDrawAnswer, GunjinDrawOffer } from "./GunjinDraw";
import { GunjinMoving, MovesPanel } from "./GunjinMoving";
import { GunjinSide } from "./GunjinSide";
import { gunjinBoardWords, gunjinWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/** The device is handed on once for each of these: the setup's step, the turn and the side to act. A pass confirmed does not change it, so the cover stays down for it. */
const turnKey = (game: GunjinGame) => `${game.match.setupStep}:${game.match.turn}:${game.match.currentPlayer}`;

/**
 * A GAME OF GUNJIN ROUND ONE DEVICE. Hidden pieces make the device a secret to
 * keep: whenever it must change hands the table covers the board, says who it
 * goes to, and shows nothing until that person presses that it is them
 * (`PartyHandOver`); then each side arranges its pieces in turn
 * (`GunjinArrange`) and plays, seeing its own ranks and the other side as backs
 * (`gunjinSeatView`, the package's own redaction). What both may know — where a
 * piece went, what a fight took off — is said at the hand-over and under the
 * board (`gunjinNews`), and at the end every piece is shown.
 *
 * Everything a move does is the rules' (`playGunjin`): this keeps what the
 * player has chosen on the board and hands the rules the move, and keeps the
 * game after every one (`gunjinStore.ts`). A reload covers the board again,
 * whatever it was showing, and a game opened in a new tab does the same.
 */
export function GunjinPlay({ game, keep, appearance, gameHref, ready }: { game: GunjinGame; keep: (game: GunjinGame | null) => void; appearance: Appearance; gameHref: string; ready: { "data-ready": string } }) {
  const say = useSpeaker();
  const GAME_ENDING_COPY = gameEndingCopy(say);
  const GUNJIN_COPY = gunjinWords(say.locale);
  const [handedFor, setHandedFor] = useState<string | null>(null);
  const over = gunjinOver(game);
  const { match } = game;
  const seat = match.currentPlayer as 0 | 1;
  const key = turnKey(game);
  const covered = !over && (match.phase === "pass" || handedFor !== key);
  const names = [partyPlayerName(game, 0, say), partyPlayerName(game, 1, say)];
  const board = gunjinBoardWords(say.locale)[game.size]!;
  const winners = gunjinWinners(game);
  const drawn = gunjinDrawn(game);
  const resigned = resignedBy(game);
  const moment = useWinMoment(over ? "ended" : "playing");
  const toPlay = gunjinToPlay(game);

  const hand = () => {
    if (match.phase === "pass") {
      const next = playGunjin(game, { kind: "hand" });
      if (next !== null) keep(next);
    }
    setHandedFor(key);
  };
  // The side to move offers a draw, or answers the one it was offered, and the engine's own word for it is the move kept.
  const drawMove = (kind: "offer-draw" | "accept-draw" | "decline-draw") => {
    const next = playGunjin(game, { kind });
    if (next !== null) keep(next);
  };
  const again = () => {
    const fresh = startGunjin(game.size, game.players);
    if (fresh !== null) keep(fresh);
  };

  const last = match.log.at(-1);
  const news = gunjinNews(game, names, say);
  const arranging = match.phase === "setup" || (match.phase === "pass" && match.passPurpose === "setup");
  const first = match.setupStep === 0;

  return (
    <section
      className={`${PLAY_SURFACE} flex flex-col gap-3`}
      data-testid="gunjin-game"
      data-state={over ? "finished" : "playing"}
      data-phase={match.phase}
      data-moves={game.moves.length}
      data-to-play={toPlay ?? undefined}
      data-covered={covered ? "true" : "false"}
      data-size={game.size}
      {...ready}
    >
      <div className="flex min-h-12 flex-col gap-0.5">
        <p className="flex items-center gap-2 text-base font-semibold" data-testid="gunjin-status" aria-live="polite">
          {over ? (
            <>
              {GUNJIN_COPY.gameOver}:{" "}
              {resigned !== null ? GAME_ENDING_COPY.resignedResult(names[resigned]!, winners.map((one) => names[one]!)) : drawn ? GUNJIN_COPY.drawn(gunjinReason(game, say)) : winners.length === 0 ? "" : GUNJIN_COPY.wins(names[winners[0]!]!, gunjinReason(game, say))}
            </>
          ) : covered ? (
            GUNJIN_COPY.hiddenBoard
          ) : (
            <>
              <GunjinSide seat={seat} />
              {arranging ? GUNJIN_COPY.arrange(names[seat]!) : GUNJIN_COPY.turn(names[seat]!)}
            </>
          )}
        </p>
        {!covered && !arranging && !over && news !== null ? (
          <p className="text-sm text-muted" data-testid="gunjin-news">
            {news}
          </p>
        ) : null}
      </div>

      {over ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start" data-scale-desk>
          <div className="min-w-0" data-scale-board data-bare-board>
            <WinCoverOver
              news={moment.open ? tableNews({ names, winners, you: null, draw: drawn, detail: resigned === null ? gunjinReason(game, say) : null, next: { label: GUNJIN_COPY.again, onPress: again } }, say) : null}
              onClose={moment.close}
            >
              <GunjinBoard
                view={gunjinFinalView(game)!}
                appearance={appearance}
                label={GUNJIN_COPY.boardLabel(board.name)}
                last={last?.from !== undefined && last.to !== undefined ? { from: last.from, to: last.to } : null}
              />
            </WinCoverOver>
          </div>
          <aside className="flex min-w-0 flex-col gap-3">
            <MovesPanel game={game} names={names} note={GUNJIN_COPY.finalNote} />
          </aside>
        </div>
      ) : covered ? (
        // The cover is the board's place in the just-the-board modal, so the modal keeps one width from the hand-over to the board.
        <div className="min-w-0" data-scale-board data-bare-board>
          <PartyHandOver
            name={names[seat]!}
            mark={<GunjinSide seat={seat} />}
            testId="gunjin-pass"
            note={arranging ? GUNJIN_COPY.passFirstNote : GUNJIN_COPY.passStart}
            ready={arranging ? GUNJIN_COPY.passFirst(names[seat]!) : undefined}
            onReady={hand}
          >
            {!arranging ? (
              <p className="text-sm font-medium" data-testid="gunjin-pass-news">
                {match.passPurpose === "draw" && match.drawOffer !== undefined ? GUNJIN_COPY.drawOffered(names[match.drawOffer]!) : match.turn === 0 ? GUNJIN_COPY.newsFirst : news}
              </p>
            ) : null}
            {arranging && !first ? <p className="text-sm font-medium">{GUNJIN_COPY.passSetUp(names[seat]!)}</p> : null}
          </PartyHandOver>
        </div>
      ) : arranging ? (
        <GunjinArrange
          key={key}
          game={game}
          appearance={appearance}
          onFinish={(placements) => {
            const next = playGunjin(game, { kind: "setup", placements });
            if (next !== null) keep(next);
          }}
        />
      ) : (
        <>
          {/* A draw offered to this side, answered before the board: accept it, decline it, or move (which declines). */}
          <GunjinDrawAnswer game={game} names={names} onAccept={() => drawMove("accept-draw")} onDecline={() => drawMove("decline-draw")} />
          <GunjinMoving
            key={key}
            game={game}
            seat={seat}
            names={names}
            appearance={appearance}
            onMove={(from, to) => {
              const next = playGunjin(game, { kind: "move", from, to });
              if (next !== null) keep(next);
            }}
          />
        </>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <TableEnding
          prefix="gunjin"
          game={game}
          playing={!over}
          toPlay={toPlay}
          seats={2}
          nameOf={(one) => names[one] ?? playerNumberName(say, one + 1)}
          onResign={(one) => keep(resignGunjin(game, one))}
          onNewGame={() => keep(null)}
        />
        {!over && !covered ? (
          <div data-chrome>
            <GunjinDrawOffer game={game} names={names} onOffer={() => drawMove("offer-draw")} />
          </div>
        ) : null}
        {over ? (
          <button type="button" onClick={again} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="gunjin-again">
            {GUNJIN_COPY.again}
          </button>
        ) : null}
      </div>
      {over ? <TableWallpaper game="gunjin" result={resultLine(names, winners, drawn, say)} /> : null}
      <p className="text-xs text-muted" data-chrome>
        {GUNJIN_COPY.kept}
      </p>
      <p className="text-sm" data-chrome>
        <Link href={gameHref} className="underline underline-offset-4">
          {GUNJIN_COPY.about} →
        </Link>
      </p>
      <AskIfAway watching={!over} detail={GUNJIN_COPY.idleDetail} kept={GUNJIN_COPY.idleKept} />
    </section>
  );
}
