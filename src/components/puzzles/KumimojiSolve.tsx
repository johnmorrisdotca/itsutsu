"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { FeltPatches } from "@/components/board/FeltPatches";
import type { Appearance } from "@/components/board/board.types";
import { useFeltChoice } from "@/components/board/useFeltChoice";
import { kumimojiPoints } from "@/lib/puzzles/kumimoji/check";
import { POINTS_A_HELP } from "@/lib/puzzles/puzzlePoints";
import { encodeGrid } from "@/lib/puzzles/kumimoji/grid";
import { judgeWithWords } from "@/lib/puzzles/kumimoji/judge";
import { deal, decodeTileProgress, draw, encodeTileProgress, isFinished, mayDraw, tilesLeft, type TilePlay } from "@/lib/puzzles/kumimoji/play";
import { tileWords } from "@/lib/puzzles/kumimoji/tileWords";
import type { KumimojiLanguage } from "@/lib/puzzles/kumimoji/kumimoji.types";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { KumimojiGhost, KumimojiWildPicker } from "./KumimojiDeskParts";
import { KumimojiTable, TABLE_BOARDS, tableTheme, type TableHandle } from "./KumimojiTable";
import { WordStylePicker } from "./WordStylePicker";
import { KumimojiTray } from "./KumimojiTray";
import { TRAY_ROOM } from "./kumimoji.constants";
import { type ResumedRun, SolveDone, SolveHeader, SolvePaused, type SolveRace, useSolve } from "./solveShared";
import { sayState, useKumimojiDesk } from "./useKumimojiDesk";
import { PLAY_SURFACE, SELECTABLE } from "@/components/ui/ui.constants";

/**
 * Playing Kumimoji: lay the hand out as one crossword, draw the next tile
 * whenever the hand is used and the grid is sound, and finish when the bag is
 * empty and every tile stands in a word.
 *
 * Tap a tile, then a square; or drag it; or choose a square and type, which
 * lays the letters across or down from there. The grid is judged against the
 * word list here in the browser at every change (`judgeGrid`), and nothing is
 * asked of a server until the last tile is down — then the grid is handed in
 * once (`useSolve`), to be checked again and kept.
 */
export function KumimojiSolve({
  puzzle,
  hasAccount,
  race = null,
  resumed = null,
  appearance = DEFAULT_APPEARANCE,
  language = puzzle.language ?? "english",
  hints = false,
}: {
  puzzle: Puzzle;
  hasAccount: boolean;
  race?: SolveRace | null;
  resumed?: ResumedRun | null;
  appearance?: Appearance;
  language?: KumimojiLanguage;
  /** Whether Help was chosen on the set-up screen (`hints=1`); never in a race. */
  hints?: boolean;
}) {
  const hydrated = useHydrated();
  const { felt, chooseFelt } = useFeltChoice(appearance);
  const theme = tableTheme({ ...appearance, felt });
  const words = useMemo(() => tileWords(language), [language]);
  const [play, setPlay] = useState<TilePlay>(() => (resumed === null ? null : decodeTileProgress(resumed.progress, puzzle.givens, language)) ?? deal(puzzle.givens, puzzle.size));
  // Read by the rules it was set up with: with Diagonals, its diagonal runs of three or more too.
  const diagonals = puzzle.diagonals === true;
  const verdict = useMemo(() => judgeWithWords(play.tiles, words, { diagonals }), [play.tiles, words, diagonals]);
  const left = tilesLeft(play);

  const { elapsedMs, done, begin, finish, pausing, hinting } = useSolve(puzzle, hasAccount, race, null, { progress: encodeTileProgress(play), resumed }, hints, true);
  const closed = done !== null || pausing.paused;

  /* Every move starts the clock (`useKumimojiDesk` forgets what was chosen). */
  const apply = useCallback(
    (next: (now: TilePlay) => TilePlay) => {
      begin();
      setPlay(next);
    },
    [begin],
  );
  const root = useRef<HTMLElement>(null);
  const table = useRef<TableHandle>(null);
  const desk = useKumimojiDesk({ play, apply, closed, words, help: hinting, root, table });

  /* The last tile down on a sound grid with the bag empty: handed in, once. */
  const handedIn = useRef(false);
  useEffect(() => {
    if (handedIn.current || done !== null || !isFinished(play, verdict)) return;
    handedIn.current = true;
    void finish(encodeGrid(play.tiles), Date.now());
  }, [play, verdict, done, finish]);

  const presses = { ...desk.presses, draw: { can: mayDraw(play, verdict), run: () => desk.move((now) => draw(now)) } };

  return (
    <section ref={root} className={`${PLAY_SURFACE} flex flex-col gap-3 ${done === null ? TRAY_ROOM : ""}`} data-testid="puzzle-play" data-kind={puzzle.kind} data-seed={puzzle.seed} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      <SolvePaused pausing={pausing}>
        <KumimojiTable
          tiles={play.tiles}
          theme={theme}
          misspelt={verdict.misspelt}
          apart={verdict.apart}
          chosen={desk.chosenSquare}
          cursor={done === null ? desk.cursor : null}
          readOnly={done !== null}
          turn={desk.turn}
          onTurn={desk.turnTable}
          onSquare={desk.onSquare}
          onTileDown={desk.onTableDown}
          handle={table}
        />
      </SolvePaused>
      {done === null ? (
        <>
          <p className="min-h-5 text-sm text-muted" data-testid="kumimoji-said" data-sound={verdict.sound ? "true" : "false"} aria-live="polite">
            {desk.helpSaid ?? sayState(play.hand.length, left, verdict)}
          </p>
          {desk.selectedWild ? <KumimojiWildPicker language={language} words={words} tile={desk.selectedTile!} disabled={closed} onChoose={desk.adjustSelected} /> : null}
          <div className="flex flex-wrap items-center gap-2">
            <FeltPatches felt={felt} wood={appearance.boardTheme} onChoose={chooseFelt} />
            {/* The board under the tiles, as Gomoji's grid chooses it: Reversi's squares, or Gomoku's crossings. */}
            <WordStylePicker styles={TABLE_BOARDS} />
          </div>
          {pausing.paused ? null : (
            <KumimojiTray
              hand={play.hand}
              chosenAt={desk.chosenAt}
              left={left}
              disabled={closed}
              presses={presses}
              onHandTile={desk.onHandTile}
              onHandDown={desk.onHandDown}
              onTray={desk.onTray}
            />
          )}
        </>
      ) : (
        <>
          <p className={`${SELECTABLE} text-sm`} data-testid="kumimoji-score">
            All {puzzle.givens.length} tiles in one crossword. <strong>{Math.max(0, kumimojiPoints(puzzle.givens, done.elapsedMs) - POINTS_A_HELP * hinting.used)}</strong> points: ten a tile, and the rest for speed
            {hinting.used > 0 ? `, less ${POINTS_A_HELP} for each of ${hinting.used} ${hinting.used === 1 ? "Help" : "Helps"}` : ""}.
          </p>
          <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} />
        </>
      )}
      <KumimojiGhost ghost={desk.ghost} />
    </section>
  );
}
