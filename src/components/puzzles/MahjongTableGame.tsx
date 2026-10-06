"use client";

import { useRouter } from "next/navigation";
import type { Speaker } from "@/lib/i18n/i18n";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { phraseWith } from "@/components/i18n/phraseWith";
import { Paired } from "@/components/i18n/Paired";
import { ResultMark } from "@/components/game/ResultMark";
import { RESULT_MARKS } from "@/components/game/resultMark.constants";
import { useEffect, useMemo, useState } from "react";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { AskIfAway } from "@/components/game/AskIfAway";
import { WinCoverOver, useWinMoment } from "@/components/game/WinCover";
import { WIN_COVER_COPY } from "@/components/game/winCover.constants";
import { tableNews } from "@/components/game/winNews";
import { TableWallpaper } from "@/components/party/TableWallpaper";
import { PARTY_COPY } from "@/components/party/party.constants";
import { PressLabel } from "@/components/ui/PressLabel";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PLAY_BUTTON, PLAY_SURFACE, SECTION_HEADING } from "@/components/ui/ui.constants";
import { setUpPath } from "@/lib/gomoku/slugs";
import { computerPair } from "@johnmorrisdotca/jarajara/table";
import { isComputerSeat, playAtTable, readTable, startTable, tablePairs, undoAtTable } from "@johnmorrisdotca/jarajara/table";
import type { AwaseSeat, AwaseTable } from "@johnmorrisdotca/jarajara/table";
import { tilesLeft } from "@johnmorrisdotca/jarajara";
import { ordinaryLevel } from "@/lib/puzzles/ordinaryLevel";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { MahjongBoard, mahjongAspect, mahjongMaxWidth } from "./MahjongBoard";
import { MahjongFreeToggle } from "./MahjongFreeToggle";
import { MahjongTileFace } from "./MahjongTileFace";
import { MahjongScores, MahjongTableNames } from "./MahjongTableSeats";
import { MAHJONG_COMPUTER_PAUSE_MS, MAHJONG_ZOOM_FROM, mahjongMostZoom } from "./mahjong.constants";
import { mahjongCopy, mahjongSeatName } from "./cardWords";
import { inALine } from "./kumimojiWords";
import { useMahjongFree } from "./mahjongFree";
import { useKeptMahjongTable } from "./mahjongTableKept";
import { TsunagiViewport } from "./TsunagiViewport";
import { PlayingNow } from "@/components/layout/PlayingNow";

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
  const say = useSpeaker();
  const MAHJONG_COPY = mahjongCopy(say.locale);
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
  // The cover over the layout when its last pair is taken here (`WinCover`); never on a finished table opened again.
  const moment = useWinMoment(table === null || state === null ? "unknown" : state.over ? "ended" : "playing");

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
          <Paired en={say.say("pcard.mj.playersAria")} kanji="席" kanjiClassName="text-sm font-normal opacity-70" inReadersLanguage />
        </h2>
        <p className="text-sm text-muted">{MAHJONG_COPY.tableLead}</p>
        <MahjongTableNames
          players={players}
          replacing={kept !== null && readTable(kept)?.over === false ? kept : null}
          onBegin={(seats: AwaseSeat[]) => keep(startTable({ ...puzzle, level: ordinaryLevel(puzzle.level) }, seats))}
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
    let back: AwaseTable | null = table;
    for (let count = table.takes.length; count > lastPerson && back !== null; count -= 1) back = undoAtTable(back);
    if (back !== null) keep(back);
    setChosen(null);
  };
  const last = state.taken[state.taken.length - 1];
  const people = table.seats.flatMap((_, at) => (isComputerSeat(table, at) ? [] : [at]));
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
          <strong data-testid="mahjong-table-winner">
            <ResultMark kind={state.winners.length === 0 ? RESULT_MARKS.other : RESULT_MARKS.success} className="mr-1" />
            {winnersLine(table, state.winners, say)}
          </strong>
        ) : (
          <>
            {phraseWith(say.say(computerTurn ? "pcard.mj.turnComputer" : "pcard.mj.turn"), { name: <strong>{mahjongSeatName(say, table.seats, state.turn)}</strong> })}{" "}
          </>
        )}{" "}
        {last === undefined ? null : (
          <span className="inline-flex items-center gap-1 align-middle text-muted" data-testid="mahjong-table-last">
            {phraseWith(say.say("pcard.mj.took", { name: mahjongSeatName(say, table.seats, last.seat), points: String(last.points) }), {
              pair: (
                <>
                  <MahjongTileFace code={last.codes[0]} className="h-6" />
                  <MahjongTileFace code={last.codes[1]} className="h-6" />
                </>
              ),
            })}
            {last.again && !state.over ? say.say("pcard.mj.again") : ""}
          </span>
        )}
        {state.shuffledAfter !== null && state.shuffledAfter === state.taken.length && !state.over ? <span className="text-muted"> {MAHJONG_COPY.shuffled}</span> : null}
        {said !== null && human ? <span className="text-muted"> {said}</span> : null}
      </p>
      {/* Quiet around the game while it is played (`PlayingNow`). */}
      <PlayingNow on={moment.playing} />
<WinCoverOver
        news={
          moment.open
            ? tableNews({
                names: table.seats.map((_, at) => mahjongSeatName(say, table.seats, at)),
                winners: state.winners,
                // One person among computers is "you"; several people round the device are each named.
                you: people.length === 1 ? people[0]! : null,
                next: { label: WIN_COVER_COPY.playAgain, onPress: again },
              })
            : null
        }
        onClose={moment.close}
      >
        <TsunagiViewport size={table.size} name="mahjong" zoomFrom={MAHJONG_ZOOM_FROM} mostZoom={mahjongMostZoom(table.size)} aspect={mahjongAspect(table.size)} maxWidth={mahjongMaxWidth(table.size)}>
          <MahjongBoard
            size={table.size}
            cells={state.cells}
            theme={BOARD_THEMES[appearance.boardTheme]}
            chosen={human ? chosen : null}
            showFree={showFree}
            capped={table.size < MAHJONG_ZOOM_FROM}
            readOnly={!human}
            onTap={tap}
            onPair={(a, b) => human && !take(a, b) && setSaid(MAHJONG_COPY.noMatch)}
            onDouble={double}
            onBlocked={() => setSaid(MAHJONG_COPY.blocked)}
          />
        </TsunagiViewport>
      </WinCoverOver>
      {state.over ? (
        <>
          <button type="button" className={PLAY_BUTTON} onClick={again} data-testid="mahjong-table-again">
            <PressLabel words={WIN_COVER_COPY.playAgain} kanji="再" />
          </button>
          <TableWallpaper game="mahjong" result={winnersLine(table, state.winners, say)} />
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={undo} disabled={lastPerson < 0 || computerTurn} data-testid="mahjong-table-undo">
            {say.say("puzzle.press.undo")}
          </button>
          <EndTable onEnd={() => keep(null)} />
        </div>
      )}
      <MahjongFreeToggle />
    </section>
  );
}

function winnersLine(table: AwaseTable, winners: readonly number[], say: Speaker): string {
  const names = winners.map((at) => mahjongSeatName(say, table.seats, at));
  if (names.length === 1) return say.say("pcard.mj.wins", { name: names[0]! });
  return say.say("pcard.mj.share", { names: inALine(say, names) });
}

/** Ending the game for everybody, asked twice: it is forgotten, and the names screen comes back. */
function EndTable({ onEnd }: { onEnd: () => void }) {
  const say = useSpeaker();
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" className="ml-auto text-sm text-muted underline underline-offset-2" onClick={() => setAsking(true)} data-testid="mahjong-table-end">
        {say.say("pkumi.party.endGame")}
      </button>
    );
  }
  return (
    <span className="ml-auto flex flex-wrap items-center gap-2 text-sm">
      {say.say("pcard.mj.endAsk")}
      <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG}`} onClick={onEnd} data-testid="mahjong-table-end-yes">
        {say.say("pkumi.party.endYes")}
      </button>
      <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => setAsking(false)}>
        {say.say("pkumi.party.keepPlaying")}
      </button>
    </span>
  );
}
