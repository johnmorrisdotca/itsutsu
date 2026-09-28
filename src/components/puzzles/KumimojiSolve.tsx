"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { FeltPatches } from "@/components/board/FeltPatches";
import type { Appearance } from "@/components/board/board.types";
import { useFeltChoice } from "@/components/board/useFeltChoice";
import { kumimojiPoints } from "@/lib/puzzles/kumimoji/check";
import { handSpelling, wordsInHand } from "@/lib/puzzles/kumimoji/help";
import { POINTS_A_HELP } from "@/lib/puzzles/puzzlePoints";
import { encodeGrid, judgeGrid, placeOf, squareAt } from "@/lib/puzzles/kumimoji/grid";
import {
  assignHandTile,
  assignTableTile,
  deal,
  decodeTileProgress,
  draw,
  encodeTileProgress,
  isFinished,
  liftAll,
  liftToHand,
  mayDraw,
  mayTrade,
  moveOnTable,
  placeFromHand,
  sortHand,
  swapWithHand,
  tilesLeft,
  trade,
  type TilePlay,
} from "@/lib/puzzles/kumimoji/play";
import { tileWords } from "@/lib/puzzles/kumimoji/tileWords";
import type { KumimojiLanguage } from "@/lib/puzzles/kumimoji/kumimoji.types";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { KumimojiTable, TABLE_BOARDS, tableTheme, type TableHandle } from "./KumimojiTable";
import { WordStylePicker } from "./WordStylePicker";
import { KumimojiTray } from "./KumimojiTray";
import { DOUBLE_TAP_MS, SORT_KEY, HAND_TILE_PX, TILE, TRAY_ROOM, tileLetterPx } from "./kumimoji.constants";
import { type ResumedRun, SolveDone, SolveHeader, SolvePaused, type SolveRace, useSolve } from "./solveShared";
import { useTileDrag, type DragSource, type DropTarget } from "./useTileDrag";

type Chosen = { from: "hand"; at: number } | { from: "table"; square: string } | null;
type Cursor = { square: string; across: boolean } | null;

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
  const [chosen, setChosen] = useState<Chosen>(null);
  const [cursor, setCursor] = useState<Cursor>(null);
  const table = useRef<TableHandle>(null);
  /* The last table tile chosen by a tap, and when: the same tile again inside `DOUBLE_TAP_MS` sends it back to the hand. */
  const lastTap = useRef<{ square: string; at: number } | null>(null);

  const verdict = useMemo(
    () => judgeGrid(
      play.tiles,
      (codes) => {
        const word = words.wordOf(codes);
        return word !== null && words.allowed.has(word);
      },
      (codes) => words.wordOf(codes) ?? codes,
    ),
    [play.tiles, words],
  );
  const left = tilesLeft(play);

  const { elapsedMs, done, begin, finish, pausing, hinting } = useSolve(puzzle, hasAccount, race, null, { progress: encodeTileProgress(play), resumed }, hints, true);
  /* Help's words for this hand, found only when Help was chosen, and which one the next press shows. */
  const helpWords = useMemo(() => (hinting.allowed ? wordsInHand(play.hand, words) : []), [hinting.allowed, play.hand, words]);
  const helpAt = useRef(0);
  const [helpSaid, setHelpSaid] = useState<string | null>(null);
  const closed = done !== null || pausing.paused;

  /* Every move goes through here: it starts the clock, and forgets what was chosen. */
  const move = useCallback(
    (next: (now: TilePlay) => TilePlay) => {
      if (closed) return;
      begin();
      setPlay(next);
      setChosen(null);
      setHelpSaid(null);
    },
    [closed, begin],
  );

  /* The last tile down on a sound grid with the bag empty: handed in, once. */
  const handedIn = useRef(false);
  useEffect(() => {
    if (handedIn.current || done !== null || !isFinished(play, verdict)) return;
    handedIn.current = true;
    void finish(encodeGrid(play.tiles), Date.now());
  }, [play, verdict, done, finish]);

  const onSquare = (square: string) => {
    if (closed) return;
    const there = play.tiles.get(square);
    if (chosen?.from === "hand") return move((now) => (there === undefined ? placeFromHand(now, chosen.at, square) : swapWithHand(now, chosen.at, square)));
    if (chosen?.from === "table") {
      if (chosen.square === square) {
        // A double tap: John, 2026-09-28, "if you double click on a tile I think that would just shoot it back to your collection".
        const twice = lastTap.current?.square === square && performance.now() - lastTap.current.at < DOUBLE_TAP_MS;
        lastTap.current = null;
        return twice ? move((now) => liftToHand(now, square)) : setChosen(null);
      }
      return move((now) => moveOnTable(now, chosen.square, square));
    }
    if (there !== undefined) {
      setChosen({ from: "table", square });
      lastTap.current = { square, at: performance.now() };
      return;
    }
    // An empty square with nothing chosen: typing starts here, across; a second tap turns it down.
    setCursor((now) => (now?.square === square ? { square, across: !now.across } : { square, across: true }));
  };

  const onDrop = (source: DragSource, target: DropTarget) => {
    if (target === null) return;
    if ("tray" in target) {
      if (source.from === "table") move((now) => liftToHand(now, source.square));
      return;
    }
    const there = play.tiles.get(target.square);
    if (source.from === "hand") move((now) => (there === undefined ? placeFromHand(now, source.at, target.square) : swapWithHand(now, source.at, target.square)));
    else move((now) => moveOnTable(now, source.square, target.square));
  };
  const drag = useTileDrag({ onDrop, nudge: (x, y) => table.current?.nudge(x, y), disabled: closed });
  const root = useRef<HTMLElement>(null);
  const inView = () => bringTableIntoView(root.current);

  const onHandTile = (at: number) => {
    if (closed || !drag.clickWanted()) return;
    inView();
    if (chosen?.from === "table") return move((now) => swapWithHand(now, at, chosen.square));
    setChosen((now) => (now?.from === "hand" && now.at === at ? null : { from: "hand", at }));
  };

  /* The desk's keyboard: a letter from the hand onto the typing square, which then steps on; Backspace takes the last one back. */
  useEffect(() => {
    if (closed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select") !== null) return;
      const step = (square: string, across: boolean, by: number) => {
        const { row, col } = placeOf(square);
        return across ? squareAt(row, col + by) : squareAt(row + by, col);
      };
      const typedTile = words.codeOf(event.key) ?? words.codeOf(event.key.toLowerCase());
      if (typedTile !== null && cursor !== null) {
        const at = play.hand.indexOf(typedTile);
        if (at === -1) return;
        event.preventDefault();
        const square = cursor.square;
        move((now) => (now.tiles.has(square) ? swapWithHand(now, at, square) : placeFromHand(now, at, square)));
        setCursor({ square: step(square, cursor.across, 1), across: cursor.across });
      } else if (event.key === "Backspace" && cursor !== null) {
        event.preventDefault();
        const back = step(cursor.square, cursor.across, -1);
        move((now) => liftToHand(now, back));
        setCursor({ square: back, across: cursor.across });
      } else if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        const from = cursor?.square ?? squareAt(0, 0);
        const across = event.key === "ArrowLeft" || event.key === "ArrowRight";
        const by = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
        setCursor({ square: cursor === null ? from : step(from, across, by), across: cursor?.across ?? true });
      } else if (event.key === "Enter" && cursor !== null) {
        event.preventDefault();
        setCursor({ square: cursor.square, across: !cursor.across });
      } else if (event.key === SORT_KEY) {
        event.preventDefault();
        move((now) => sortHand(now));
      } else if (event.key === "Escape") {
        setChosen(null);
        setCursor(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closed, cursor, play.hand, move, words]);

  const chosenAt = chosen?.from === "hand" ? chosen.at : null;
  const selectedTile = chosen?.from === "hand" ? play.hand[chosen.at] ?? null : chosen?.from === "table" ? play.tiles.get(chosen.square) ?? null : null;
  const selectedWild = selectedTile !== null && words.isWild(selectedTile);
  /* The reading chosen for the selected wild: the select's value is the wild's own code for that letter (`wildFor`). */
  const adjustSelected = (code: string) => {
    if (selectedTile === null || !words.isWild(code)) return;
    move((now) => chosen?.from === "hand" ? assignHandTile(now, chosen.at, code) : chosen?.from === "table" ? assignTableTile(now, chosen.square, code) : now);
  };
  const presses = {
    draw: { can: mayDraw(play, verdict), run: () => move((now) => draw(now)) },
    trade: { can: chosenAt !== null && mayTrade(play), run: () => chosenAt !== null && move((now) => trade(now, chosenAt)) },
    back: { can: chosen?.from === "table", run: () => chosen?.from === "table" && move((now) => liftToHand(now, chosen.square)) },
    allBack: { can: play.tiles.size > 0, run: () => move((now) => liftAll(now)) },
    sort: { can: play.hand.length > 1, run: () => move((now) => sortHand(now)) },
    help: {
      offered: hinting.allowed,
      can: hinting.allowed && play.hand.length > 1,
      run: () => {
        if (helpWords.length === 0) return setHelpSaid("No word in this hand. Trade a tile, or build it onto the table.");
        const word = helpWords[helpAt.current % helpWords.length]!;
        helpAt.current += 1;
        hinting.spend();
        move((now) => handSpelling(now, word));
        setHelpSaid(`${(words.wordOf(word) ?? word).toUpperCase()} is at the front of your hand. Press Help again for another word.`);
      },
    },
  };

  return (
    <section ref={root} className={`flex flex-col gap-3 ${done === null ? TRAY_ROOM : ""}`} data-testid="puzzle-play" data-kind={puzzle.kind} data-seed={puzzle.seed} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      <SolvePaused pausing={pausing}>
        <KumimojiTable
          tiles={play.tiles}
          theme={theme}
          misspelt={verdict.misspelt}
          apart={verdict.apart}
          chosen={chosen?.from === "table" ? chosen.square : null}
          cursor={done === null ? cursor : null}
          readOnly={done !== null}
          onSquare={onSquare}
          onTileDown={(square, letter, event) => drag.start({ from: "table", square }, letter, event)}
          handle={table}
        />
      </SolvePaused>
      {done === null ? (
        <>
          <p className="min-h-5 text-sm text-muted" data-testid="kumimoji-said" data-sound={verdict.sound ? "true" : "false"} aria-live="polite">
            {helpSaid ?? sayState(play.hand.length, left, verdict)}
          </p>
          {selectedWild ? (
            <label className="flex flex-wrap items-center gap-2 text-sm" data-testid="kumimoji-tile-adjustment">
              <span>{language === "japanese" ? "This wild tile is the kana" : "This wild tile is the letter"}</span>
              <select
                className="rounded border border-rule bg-paper px-2 py-1 text-ink"
                value={selectedWild && words.wildSound(selectedTile) === null ? "" : selectedTile}
                onChange={(event) => adjustSelected(event.target.value)}
                disabled={closed}
                data-testid="kumimoji-tile-reading"
              >
                {selectedWild && words.wildSound(selectedTile) === null ? <option value="">Choose reading</option> : null}
                {words.wildOptions.map((face) => {
                  const code = words.wildFor(face);
                  return code === null ? null : <option key={code} value={code}>{face}</option>;
                })}
              </select>
            </label>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <FeltPatches felt={felt} wood={appearance.boardTheme} onChoose={chooseFelt} />
            {/* The board under the tiles, as Gomoji's grid chooses it: Reversi's squares, or Gomoku's crossings. */}
            <WordStylePicker styles={TABLE_BOARDS} />
          </div>
          {pausing.paused ? null : (
            <KumimojiTray
              hand={play.hand}
              chosenAt={chosenAt}
              left={left}
              disabled={closed}
              presses={presses}
              onHandTile={onHandTile}
              onHandDown={(at, letter, event) => {
                inView();
                drag.start({ from: "hand", at }, letter, event);
              }}
              onTray={() => chosen?.from === "table" && move((now) => liftToHand(now, chosen.square))}
            />
          )}
        </>
      ) : (
        <>
          <p className="text-sm" data-testid="kumimoji-score">
            All {puzzle.givens.length} tiles in one crossword. <strong>{Math.max(0, kumimojiPoints(puzzle.givens, done.elapsedMs) - POINTS_A_HELP * hinting.used)}</strong> points: ten a tile, and the rest for speed
            {hinting.used > 0 ? `, less ${POINTS_A_HELP} for each of ${hinting.used} ${hinting.used === 1 ? "Help" : "Helps"}` : ""}.
          </p>
          <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} />
        </>
      )}
      {drag.ghost === null ? null : (
        <span
          className={`${TILE} pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 shadow-lg`}
          style={{ left: drag.ghost.x, top: drag.ghost.y, width: HAND_TILE_PX + 8, height: HAND_TILE_PX + 8, fontSize: tileLetterPx(HAND_TILE_PX + 8) }}
          data-testid="kumimoji-ghost"
          aria-hidden="true"
        >
          {drag.ghost.letter}
        </span>
      )}
    </section>
  );
}

/**
 * THE CLOCK, THE TABLE AND THE TRAY ON ONE SCREEN, once a tile is touched. The
 * site's header is above the play, so on arriving the table's lower half is
 * behind a phone's fixed tray, or a desk's tray is below the fold; the first
 * touch of a hand tile scrolls the page just enough to show all of the table
 * and the tray, never the clock above the top. Arriving moves nothing.
 */
function bringTableIntoView(root: HTMLElement | null) {
  if (root === null) return;
  const table = root.querySelector<HTMLElement>('[data-testid="kumimoji-table"]');
  const tray = root.querySelector<HTMLElement>('[data-testid="kumimoji-tray"]');
  if (table === null || tray === null) return;
  const gap = 8;
  const hidden =
    getComputedStyle(tray).position === "fixed"
      ? table.getBoundingClientRect().bottom - (tray.getBoundingClientRect().top - gap)
      : tray.getBoundingClientRect().bottom - (window.innerHeight - gap);
  const room = root.getBoundingClientRect().top - gap;
  const by = Math.min(hidden, room);
  if (by > 0) window.scrollBy({ top: by, behavior: "instant" });
}

/** The line under the table: what to do next, or what is wrong. */
function sayState(inHand: number, left: number, verdict: ReturnType<typeof judgeGrid>): string {
  if (verdict.tiles === 0) return "Tap a tile, then a square, or drag it onto the table. On a keyboard, choose a square and type.";
  if (verdict.notWords.length > 0) return `Not ${verdict.notWords.length === 1 ? "a word" : "words"}: ${verdict.notWords.map((word) => word.toUpperCase()).join(", ")}.`;
  if (verdict.apart.size > 0) return "Join every tile into one crossword.";
  if (verdict.tiles === 1) return "A word takes two letters or more.";
  if (inHand > 0) return `${inHand} ${inHand === 1 ? "tile" : "tiles"} to lay.`;
  if (left > 0) return "Sound. Draw the next tile.";
  return "Every tile is down.";
}
