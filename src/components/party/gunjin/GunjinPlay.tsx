"use client";

import { useState } from "react";

import { TableEnding } from "@/components/play/GameEnding";
import { GAME_ENDING_COPY } from "@/components/play/gameEnding.constants";
import { AskIfAway } from "@/components/game/AskIfAway";
import { WinCoverOver, useWinMoment } from "@/components/game/WinCover";
import { resultLine, tableNews } from "@/components/game/winNews";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_STRONG, PLAY_SURFACE } from "@/components/ui/ui.constants";
import type { Appearance } from "@/components/board/board.types";
import { gunjinOver, gunjinToPlay, gunjinWinners, playGunjin, resignGunjin, startGunjin } from "@/lib/party/gunjin/gunjin";
import { GUNJIN_BOARDS } from "@/lib/party/gunjin/gunjin.constants";
import type { GunjinGame } from "@/lib/party/gunjin/gunjin.types";
import { gunjinNews, gunjinReason } from "@/lib/party/gunjin/gunjinNews";
import { gunjinFinalView } from "@/lib/party/gunjin/gunjinView";
import { partyPlayerName } from "@/lib/party/partyNames";
import { resignedBy } from "@/lib/party/resign";

import { PartyHandOver } from "../PartyHandOver";
import { TableWallpaper } from "../TableWallpaper";
import { GunjinArrange } from "./GunjinArrange";
import { GunjinBoard } from "./GunjinBoard";
import { GunjinMoving, MovesPanel } from "./GunjinMoving";
import { GunjinSide } from "./GunjinSide";
import { GUNJIN_COPY } from "./gunjin.constants";

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
  const [handedFor, setHandedFor] = useState<string | null>(null);
  const over = gunjinOver(game);
  const { match } = game;
  const seat = match.currentPlayer as 0 | 1;
  const key = turnKey(game);
  const covered = !over && (match.phase === "pass" || handedFor !== key);
  const names = [partyPlayerName(game, 0), partyPlayerName(game, 1)];
  const board = GUNJIN_BOARDS[game.size]!;
  const winners = gunjinWinners(game);
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
  const again = () => {
    const fresh = startGunjin(game.size, game.players);
    if (fresh !== null) keep(fresh);
  };

  const last = match.log.at(-1);
  const news = gunjinNews(game, names);
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
              {resigned !== null ? GAME_ENDING_COPY.resignedResult(names[resigned]!, winners.map((one) => names[one]!)) : winners.length === 0 ? "" : GUNJIN_COPY.wins(names[winners[0]!]!, gunjinReason(game))}
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
              news={moment.open ? tableNews({ names, winners, you: null, detail: resigned === null ? gunjinReason(game) : null, next: { label: GUNJIN_COPY.again, onPress: again } }) : null}
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
                {match.turn === 0 ? GUNJIN_COPY.newsFirst : news}
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
      )}

      <div className="flex flex-wrap items-center gap-2">
        <TableEnding
          prefix="gunjin"
          game={game}
          playing={!over}
          toPlay={toPlay}
          seats={2}
          nameOf={(one) => names[one] ?? `Player ${one + 1}`}
          onResign={(one) => keep(resignGunjin(game, one))}
          onNewGame={() => keep(null)}
        />
        {over ? (
          <button type="button" onClick={again} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="gunjin-again">
            {GUNJIN_COPY.again}
          </button>
        ) : null}
      </div>
      {over ? <TableWallpaper game="gunjin" result={resultLine(names, winners)} /> : null}
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
