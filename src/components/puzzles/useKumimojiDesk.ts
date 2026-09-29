"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";

import { handSpelling, wordsInHand } from "@/lib/puzzles/kumimoji/help";
import { placeOf, squareAt, type GridVerdict } from "@/lib/puzzles/kumimoji/grid";
import { assignHandTile, assignTableTile, liftAll, liftToHand, mayTrade, moveOnTable, placeFromHand, sortHand, swapWithHand, trade, type TilePlay } from "@/lib/puzzles/kumimoji/play";
import type { TileWords } from "@/lib/puzzles/kumimoji/tileWords";
import type { Turn } from "@/lib/puzzles/kumimoji/kumimoji.types";
import { arrowStep, nextTurn } from "@/lib/puzzles/kumimoji/turn";

import type { TableHandle } from "./KumimojiTable";
import type { TrayPresses } from "./KumimojiTray";
import { DOUBLE_TAP_MS, SORT_KEY } from "./kumimoji.constants";
import { useTileDrag, type DragSource, type DropTarget } from "./useTileDrag";

type Chosen = { from: "hand"; at: number } | { from: "table"; square: string } | null;
type Cursor = { square: string; across: boolean } | null;

/**
 * THE DESK: everything a Kumimoji player does with one hand and one table —
 * tap a tile, then a square; or drag it; or choose a square and type, which
 * lays the letters across or down from there; sort, trade, send tiles back,
 * and Help. The solo game (`KumimojiSolve`) and each seat of a pass-and-play
 * game (`KumimojiPartyTurn`) play through this one hook, so the two can never
 * come to play differently.
 *
 * What is chosen, the typing square, the Help cycle and how the table is
 * turned are the desk's own and never kept: a pass-and-play seat is a new
 * desk every turn, so nothing of one player's view reaches the next.
 *
 * `apply` makes a move on the game; every move goes through `move`, which
 * forgets what was chosen. Draw is the caller's, since the solo game draws for
 * one and pass and play for everybody. The two refs are the caller's too —
 * the play's own box and the table's handle — so what this returns holds no
 * ref and can be read while rendering.
 */
export function useKumimojiDesk({
  play,
  apply,
  closed,
  words,
  help,
  root,
  table,
}: {
  root: RefObject<HTMLElement | null>;
  table: RefObject<TableHandle | null>;
  play: TilePlay;
  apply: (next: (now: TilePlay) => TilePlay) => void;
  closed: boolean;
  words: TileWords;
  help: { allowed: boolean; spend: () => void };
}) {
  const [chosen, setChosen] = useState<Chosen>(null);
  const [cursor, setCursor] = useState<Cursor>(null);
  /* How far the player has turned the table to look at it: theirs alone, kept across moves, never saved with the game. */
  const [turn, setTurn] = useState<Turn>(0);
  /* The last table tile chosen by a tap, and when: the same tile again inside `DOUBLE_TAP_MS` sends it back to the hand. */
  const lastTap = useRef<{ square: string; at: number } | null>(null);
  /* Help's words for this hand, found only when Help was chosen, and which one the next press shows. */
  const helpWords = useMemo(() => (help.allowed ? wordsInHand(play.hand, words) : []), [help.allowed, play.hand, words]);
  const helpAt = useRef(0);
  const [helpSaid, setHelpSaid] = useState<string | null>(null);

  /* Every move goes through here: it forgets what was chosen. */
  const clear = useCallback(() => {
    setChosen(null);
    setHelpSaid(null);
  }, []);
  const move = useCallback(
    (next: (now: TilePlay) => TilePlay) => {
      if (closed) return;
      apply(next);
      clear();
    },
    [closed, apply, clear],
  );

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
  const inView = () => bringTableIntoView(root.current);

  const onHandTile = (at: number) => {
    if (closed || !drag.clickWanted()) return;
    inView();
    if (chosen?.from === "table") return move((now) => swapWithHand(now, at, chosen.square));
    setChosen((now) => (now?.from === "hand" && now.at === at ? null : { from: "hand", at }));
  };
  const onHandDown = (at: number, letter: string, event: ReactPointerEvent) => {
    inView();
    drag.start({ from: "hand", at }, letter, event);
  };
  const onTableDown = (square: string, letter: string, event: ReactPointerEvent) => drag.start({ from: "table", square }, letter, event);
  const onTray = () => {
    if (chosen?.from === "table") move((now) => liftToHand(now, chosen.square));
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
      } else if (arrowStep(event.key, turn) !== null) {
        // The arrows move the cursor the way they point on the screen, however the table is turned.
        event.preventDefault();
        const from = placeOf(cursor?.square ?? squareAt(0, 0));
        const by = arrowStep(event.key, turn)!;
        setCursor({ square: cursor === null ? squareAt(from.row, from.col) : squareAt(from.row + by.row, from.col + by.col), across: cursor?.across ?? true });
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
  }, [closed, cursor, play.hand, move, words, turn]);

  const chosenAt = chosen?.from === "hand" ? chosen.at : null;
  const selectedTile = chosen?.from === "hand" ? play.hand[chosen.at] ?? null : chosen?.from === "table" ? play.tiles.get(chosen.square) ?? null : null;
  const selectedWild = selectedTile !== null && words.isWild(selectedTile);
  /* The reading chosen for the selected wild: the select's value is the wild's own code for that letter (`wildFor`). */
  const adjustSelected = (code: string) => {
    if (selectedTile === null || !words.isWild(code)) return;
    move((now) => chosen?.from === "hand" ? assignHandTile(now, chosen.at, code) : chosen?.from === "table" ? assignTableTile(now, chosen.square, code) : now);
  };
  const presses: Omit<TrayPresses, "draw"> = {
    trade: { can: chosenAt !== null && mayTrade(play), run: () => chosenAt !== null && move((now) => trade(now, chosenAt)) },
    back: { can: chosen?.from === "table", run: () => chosen?.from === "table" && move((now) => liftToHand(now, chosen.square)) },
    allBack: { can: play.tiles.size > 0, run: () => move((now) => liftAll(now)) },
    sort: { can: play.hand.length > 1, run: () => move((now) => sortHand(now)) },
    help: {
      offered: help.allowed,
      can: help.allowed && play.hand.length > 1,
      run: () => {
        if (helpWords.length === 0) return setHelpSaid("No word in this hand: trade a tile for three.");
        const word = helpWords[helpAt.current % helpWords.length]!;
        helpAt.current += 1;
        help.spend();
        move((now) => handSpelling(now, word));
        setHelpSaid(`${(words.wordOf(word) ?? word).toUpperCase()} is at the front of your hand. Press Help again for another word.`);
      },
    },
  };

  return {
    chosen,
    chosenSquare: chosen?.from === "table" ? chosen.square : null,
    chosenAt,
    cursor,
    turn,
    turnTable: () => setTurn(nextTurn),
    ghost: drag.ghost,
    move,
    clear,
    onSquare,
    onHandTile,
    onHandDown,
    onTableDown,
    onTray,
    selectedTile,
    selectedWild,
    adjustSelected,
    presses,
    helpSaid,
  };
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

/** The line under the table: what to do next, or what is wrong. `drawWord` is what the next step is called where the hand is used and a tile is left. */
export function sayState(inHand: number, left: number, verdict: GridVerdict, drawWord = "Sound. Draw the next tile."): string {
  if (verdict.tiles === 0) return "Tap a tile, then a square, or drag it onto the table. On a keyboard, choose a square and type.";
  if (verdict.notWords.length > 0) return `Not ${verdict.notWords.length === 1 ? "a word" : "words"}: ${verdict.notWords.map((word) => word.toUpperCase()).join(", ")}.`;
  if (verdict.apart.size > 0) return "Join every tile into one crossword.";
  if (verdict.tiles === 1) return "A word takes two letters or more.";
  if (inHand > 0) return `${inHand} ${inHand === 1 ? "tile" : "tiles"} to lay.`;
  if (left > 0) return drawWord;
  return "Every tile is down.";
}
