"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { AskIfAway } from "@/components/game/AskIfAway";
import { PARTY_COPY } from "@/components/party/party.constants";
import { PressLabel } from "@/components/ui/PressLabel";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PLAY_BUTTON, PLAY_SURFACE, SECTION_HEADING } from "@/components/ui/ui.constants";
import { setUpPath } from "@/lib/gomoku/slugs";
import { computerPair } from "@/lib/puzzles/mahjong/computer";
import { isComputerSeat, playAtTable, readTable, seatName, startTable, tablePairs, undoAtTable } from "@/lib/puzzles/mahjong/table";
import type { MahjongSeat, MahjongTable } from "@/lib/puzzles/mahjong/table.types";
import { tilesLeft } from "@/lib/puzzles/mahjong/board";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { MahjongBoard, mahjongAspect } from "./MahjongBoard";
import { MahjongFreeToggle } from "./MahjongFreeToggle";
import { MahjongTileFace } from "./MahjongTileFace";
import { MahjongScores, MahjongTableNames } from "./MahjongTableSeats";
import { MAHJONG_COMPUTER_PAUSE_MS, MAHJONG_COPY } from "./mahjong.constants";
import { useMahjongFree } from "./mahjongFree";
import { useKeptMahjongTable } from "./mahjongTableKept";
import { TsunagiViewport } from "./TsunagiViewport";

/**
 * MAHJONG FOR A TABLE: two to four round one device, at
 * `/games/mahjong/play?…&players=N`. Each turn takes one pair from the shared
 * layout, scored to whoever took it (`table.ts`); the scores, whose turn it is
 * and the last pair taken sit over the board, and a computer's seat plays
 * itself out where everybody can watch. Everything is face up, so the device
 * passes with no cover screen.
 *
 * LOCAL ONLY: the deal is the one the address's seed makes, and the whole game
 * lives in this browser (`mahjongTableKept.ts`), kept after every pair and
 * waiting on My games until it is over. Nothing is sent to the site: no
 * points, no leaderboard, no XP.
 */
export function MahjongTableGame({ puzzle, players, appearance = DEFAULT_APPEARANCE }: { puzzle: Puzzle; players: number; appearance?: Appearance }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [kept, keep] = useKeptMahjongTable();
  const showFree = useMahjongFree();
  const [chosen, setChosen] = useState<number | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  /* The kept game is this one when it is this deal at this many seats; any other is offered on the names screen. */
  const table = kept !== undefined && kept !== null && kept.seed === puzzle.seed && kept.size === puzzle.size && kept.level === puzzle.level && kept.seats.length === players ? kept : null;
  const state = useMemo(() => (table === null ? null : readTable(table)), [table]);
  const pairs = useMemo(() => (table === null || state === null ? [] : tablePairs(table, state)), [table, state]);
  const computerTurn = table !== null && state !== null && !state.over && isComputerSeat(table, state.turn);

  /* A computer's turn plays itself, a moment after the last move so a watcher sees each pair go. */
  useEffect(() => {
    if (!computerTurn || table === null || state === null) return;
    const timer = window.setTimeout(() => {
      const pair = computerPair(table, state);
      if (pair === null) return;
      const next = playAtTable(table, pair[0], pair[1], state);
      if (next !== null) keep(next.table);
    }, MAHJONG_COMPUTER_PAUSE_MS);
    return () => window.clearTimeout(timer);
  }, [computerTurn, table, state, keep]);

  if (kept === undefined) {
    return <section className="min-h-40" data-testid="mahjong-table" data-ready="false" />;
  }
  if (table === null || state === null) {
    return (
      <section className={`${PLAY_SURFACE} flex flex-col gap-4`} data-testid="mahjong-table" data-stage="names" {...readyMark(hydrated)}>
        <h2 className={SECTION_HEADING}>
          Players <span className="font-mincho text-sm font-normal opacity-70">席</span>
        </h2>
        <p className="text-sm text-muted">{MAHJONG_COPY.tableLead}</p>
        <MahjongTableNames
          players={players}
          replacing={kept !== null && readTable(kept)?.over === false ? kept : null}
          onBegin={(seats: MahjongSeat[]) => keep(startTable(puzzle, seats))}
        />
      </section>
    );
  }

  const human = !state.over && !computerTurn;
  const take = (a: number, b: number): boolean => {
    const next = playAtTable(table, a, b, state);
    if (next === null) return false;
    keep(next.table);
    setChosen(null);
    setSaid(null);
    return true;
  };
  const tap = (slot: number) => {
    if (!human) return;
    if (chosen === null || chosen === slot) {
      setChosen(chosen === slot ? null : slot);
      setSaid(chosen === slot ? null : MAHJONG_COPY.chosen);
      return;
    }
    if (!take(chosen, slot)) {
      setChosen(slot);
      setSaid(MAHJONG_COPY.noMatch);
    }
  };
  const double = (slot: number) => {
    if (!human) return;
    const match = pairs.find(([a, b]) => a === slot || b === slot);
    if (match === undefined || !take(match[0], match[1])) setSaid(MAHJONG_COPY.noMatch);
  };
  /* Undo gives back the pairs since the last person's, theirs included: a computer's would only be taken again. */
  const lastPerson = state.taken.map((each) => each.seat).findLastIndex((seat) => !isComputerSeat(table, seat));
  const undo = () => {
    let back: MahjongTable | null = table;
    for (let count = table.takes.length; count > lastPerson && back !== null; count -= 1) back = undoAtTable(back);
    if (back !== null) keep(back);
    setChosen(null);
  };
  const last = state.taken[state.taken.length - 1];
  const again = () => {
    keep(null);
    router.push(setUpPath("mahjong"));
  };
  return (
    <section
      className={`${PLAY_SURFACE} flex flex-col gap-3`}
      data-testid="mahjong-table"
      data-stage={state.over ? "over" : "playing"}
      data-turn={state.turn}
      data-pairs={pairs.map(([a, b]) => `${a}-${b}`).join(" ")}
      data-left={tilesLeft(state.cells)}
      {...readyMark(hydrated)}
    >
      <AskIfAway watching={!state.over} detail={PARTY_COPY.idleDetail} kept={PARTY_COPY.idleKept} />
      <MahjongScores table={table} state={state} />
      <p className="min-h-10 text-sm" data-testid="mahjong-table-said" aria-live="polite">
        {state.over ? (
          <strong data-testid="mahjong-table-winner">{winnersLine(table, state.winners)}</strong>
        ) : (
          <>
            <strong>{seatName(table.seats, state.turn)}</strong> to take a pair{computerTurn ? "…" : "."}{" "}
          </>
        )}{" "}
        {last === undefined ? null : (
          <span className="inline-flex items-center gap-1 align-middle text-muted" data-testid="mahjong-table-last">
            {seatName(table.seats, last.seat)} took <MahjongTileFace code={last.codes[0]} className="h-6" />
            <MahjongTileFace code={last.codes[1]} className="h-6" /> +{last.points}
            {last.again && !state.over ? ", and goes again" : ""}
          </span>
        )}
        {state.shuffledAfter !== null && state.shuffledAfter === state.taken.length && !state.over ? <span className="text-muted"> {MAHJONG_COPY.shuffled}</span> : null}
        {said !== null && human ? <span className="text-muted"> {said}</span> : null}
      </p>
      <TsunagiViewport size={table.size} name="mahjong" zoomFrom={15} aspect={mahjongAspect(table.size)}>
        <MahjongBoard
          size={table.size}
          cells={state.cells}
          theme={BOARD_THEMES[appearance.boardTheme]}
          chosen={human ? chosen : null}
          showFree={showFree}
          readOnly={!human}
          onTap={tap}
          onPair={(a, b) => human && !take(a, b) && setSaid(MAHJONG_COPY.noMatch)}
          onDouble={double}
          onBlocked={() => setSaid(MAHJONG_COPY.blocked)}
        />
      </TsunagiViewport>
      {state.over ? (
        <button type="button" className={PLAY_BUTTON} onClick={again} data-testid="mahjong-table-again">
          <PressLabel words="Play again" kanji="再" />
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={undo} disabled={lastPerson < 0 || computerTurn} data-testid="mahjong-table-undo">
            Undo
          </button>
          <EndTable onEnd={() => keep(null)} />
        </div>
      )}
      <MahjongFreeToggle />
    </section>
  );
}

function winnersLine(table: MahjongTable, winners: readonly number[]): string {
  const names = winners.map((at) => seatName(table.seats, at));
  if (names.length === 1) return `${names[0]} wins.`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} share the win.`;
}

/** Ending the game for everybody, asked twice: it is forgotten, and the names screen comes back. */
function EndTable({ onEnd }: { onEnd: () => void }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" className="ml-auto text-sm text-muted underline underline-offset-2" onClick={() => setAsking(true)} data-testid="mahjong-table-end">
        End this game
      </button>
    );
  }
  return (
    <span className="ml-auto flex flex-wrap items-center gap-2 text-sm">
      End it for everybody? It is not kept.
      <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG}`} onClick={onEnd} data-testid="mahjong-table-end-yes">
        Yes, end it
      </button>
      <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => setAsking(false)}>
        Keep playing
      </button>
    </span>
  );
}
