"use client";

import { useMemo, useRef, useState } from "react";

import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { setUpPath } from "@/lib/gomoku/slugs";
import { judgeGrid, runsOf } from "@/lib/puzzles/kumimoji/grid";
import type { Turn } from "@/lib/puzzles/kumimoji/kumimoji.types";
import { assignHandTile, assignTableTile, deal, draw, isFinished, liftAll, liftToHand, mayDraw, moveOnTable, placeFromHand, sortHand, swapWithHand, tilesLeft, type TilePlay } from "@/lib/puzzles/kumimoji/play";
import { TRY_IT } from "@/lib/puzzles/kumimoji/showcase";
import { tileDescription, tileFace } from "@/lib/puzzles/kumimoji/tileFace";
import { loadTileWords, type TileWords } from "@/lib/puzzles/kumimoji/tileWords";
import { nextTurn } from "@/lib/puzzles/kumimoji/turn";
import { PUZZLE_KINDS } from "@/lib/puzzles/puzzles.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { DOUBLE_TAP_MS, HAND_TILE_PX, TILE, TILE_CHOSEN, tileLetterPx } from "./kumimoji.constants";
import { TRY_IT_BOX, TRY_IT_LIST_KB } from "./kumimojiShowcase.constants";
import { KumimojiTable, tableTheme } from "./KumimojiTable";
import { TileFace, wildStyle } from "./KumimojiTileFace";

type Chosen = { from: "hand"; at: number } | { from: "table"; square: string } | null;
type List = { state: "idle" } | { state: "loading" } | { state: "ready"; words: TileWords } | { state: "failed" };

const WOOD = tableTheme({ ...DEFAULT_APPEARANCE, felt: "wood" });
const NONE: ReadonlySet<string> = new Set();

/**
 * A KUMIMOJI OF TEN TILES, ON THE FRONT DOOR, for a reader to try before
 * setting a game up. The game's own table (`KumimojiTable`: it grows, zooms,
 * pans and turns), the game's own moves (`play.ts`) and the game's own word
 * check (`judgeGrid` over the list the game loads), on a fixed bag
 * (`TRY_IT`): a hand of seven, three to draw, the last a wild.
 *
 * COST: nothing on the server, ever. The page is prerendered; the list is a
 * static file the browser fetches once, on the first tap, and says so before
 * it does (`TRY_IT_LIST_KB`). Nothing is kept, sent or timed. A reader
 * without an invite plays it exactly as a member does.
 */
export function KumimojiTryIt() {
  const hydrated = useHydrated();
  const [play, setPlay] = useState<TilePlay>(() => deal(TRY_IT.bag, TRY_IT.hand));
  const [chosen, setChosen] = useState<Chosen>(null);
  const [turn, setTurn] = useState<Turn>(0);
  const [list, setList] = useState<List>({ state: "idle" });
  const lastTap = useRef<{ square: string; at: number } | null>(null);
  const words = list.state === "ready" ? list.words : null;

  const verdict = useMemo(
    () =>
      words === null
        ? null
        : judgeGrid(play.tiles, (codes) => {
            const word = words.wordOf(codes);
            return word !== null && words.allowed.has(word);
          }),
    [play.tiles, words],
  );
  const found = useMemo(() => {
    if (words === null) return [];
    return runsOf(play.tiles).flatMap((run) => {
      const word = words.wordOf(run.word);
      return word !== null && words.allowed.has(word) ? [word] : [];
    });
  }, [play.tiles, words]);
  const finished = verdict !== null && isFinished(play, verdict);

  /* The first tap fetches the list, once; every move after it is judged at once. */
  const wake = () => {
    if (list.state !== "idle") return;
    setList({ state: "loading" });
    loadTileWords("english").then(
      (loaded) => setList({ state: "ready", words: loaded }),
      () => setList({ state: "failed" }),
    );
  };
  const move = (next: (now: TilePlay) => TilePlay) => {
    if (finished) return;
    setPlay(next);
    setChosen(null);
  };

  const onSquare = (square: string) => {
    wake();
    if (finished) return;
    const there = play.tiles.get(square);
    if (chosen?.from === "hand") return move((now) => (there === undefined ? placeFromHand(now, chosen.at, square) : swapWithHand(now, chosen.at, square)));
    if (chosen?.from === "table") {
      if (chosen.square === square) {
        // Tapped twice, as in the game: back to the hand.
        const twice = lastTap.current?.square === square && performance.now() - lastTap.current.at < DOUBLE_TAP_MS;
        lastTap.current = null;
        return twice ? move((now) => liftToHand(now, square)) : setChosen(null);
      }
      return move((now) => moveOnTable(now, chosen.square, square));
    }
    if (there !== undefined) {
      setChosen({ from: "table", square });
      lastTap.current = { square, at: performance.now() };
    }
  };
  const onHandTile = (at: number) => {
    wake();
    if (finished) return;
    if (chosen?.from === "table") return move((now) => swapWithHand(now, at, chosen.square));
    setChosen((now) => (now?.from === "hand" && now.at === at ? null : { from: "hand", at }));
  };

  const selected = chosen?.from === "hand" ? play.hand[chosen.at] ?? null : chosen?.from === "table" ? play.tiles.get(chosen.square) ?? null : null;
  const selectedWild = selected !== null && words !== null && words.isWild(selected);
  const left = tilesLeft(play);

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="kumimoji-try" data-finished={finished ? "true" : "false"} data-list={list.state} {...readyMark(hydrated)}>
      <h2 className={SECTION_TITLE}>
        Try a hand <span className="font-mincho normal-case tracking-normal">試す</span>
      </h2>
      <p className="text-sm">
        Ten tiles: a hand of seven, and three more to draw. Lay them into one crossword, every line of two or more letters a word.
      </p>
      <KumimojiTable
        tiles={play.tiles}
        theme={WOOD}
        misspelt={verdict?.misspelt ?? NONE}
        apart={verdict?.apart ?? NONE}
        chosen={chosen?.from === "table" ? chosen.square : null}
        readOnly={finished}
        turn={turn}
        onTurn={() => setTurn(nextTurn)}
        onSquare={onSquare}
        boxClass={TRY_IT_BOX}
      />
      <p className="min-h-10 text-sm text-muted" data-testid="kumimoji-try-said" aria-live="polite">
        {said(list, play, verdict, left, finished)}
      </p>
      {found.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Words on the table" data-testid="kumimoji-try-words">
          {found.map((word, at) => (
            <li key={`${word}-${at}`} className="rounded-full bg-moss-soft px-2.5 py-0.5 text-xs font-semibold tracking-wide text-ink uppercase" data-testid="kumimoji-try-word">
              {word}
            </li>
          ))}
        </ul>
      ) : null}
      {selectedWild ? (
        <label className="flex flex-wrap items-center gap-2 text-sm" data-testid="kumimoji-try-wild">
          <span>This wild tile is the letter</span>
          <select
            className="rounded border border-rule bg-paper px-2 py-1 text-ink"
            value={words.wildSound(selected) === null ? "" : selected}
            onChange={(event) => {
              const code = event.target.value;
              if (!words.isWild(code)) return;
              move((now) => (chosen?.from === "hand" ? assignHandTile(now, chosen.at, code) : chosen?.from === "table" ? assignTableTile(now, chosen.square, code) : now));
            }}
            data-testid="kumimoji-try-reading"
          >
            {words.wildSound(selected) === null ? <option value="">Choose</option> : null}
            {words.wildOptions.map((face) => {
              const code = words.wildFor(face);
              return code === null ? null : <option key={code} value={code}>{face.toUpperCase()}</option>;
            })}
          </select>
        </label>
      ) : null}
      <div className="flex min-h-11 flex-wrap items-center gap-1.5" aria-label="Your hand" data-testid="kumimoji-try-hand">
        {play.hand.length === 0 ? (
          <span className="text-sm text-muted">{left > 0 ? "Hand used." : "Every tile is out of the bag."}</span>
        ) : (
          play.hand.map((tile, at) => (
            <button
              key={`${at}-${tile}`}
              type="button"
              disabled={finished}
              className={`${TILE} relative ${chosen?.from === "hand" && chosen.at === at ? TILE_CHOSEN : ""}`}
              style={wildStyle(tileFace(tile), { width: HAND_TILE_PX, height: HAND_TILE_PX, fontSize: tileLetterPx(HAND_TILE_PX) })}
              onClick={() => onHandTile(at)}
              aria-pressed={chosen?.from === "hand" && chosen.at === at}
              aria-label={`${tileDescription(tile)} in your hand`}
              data-testid="kumimoji-try-tile"
              data-letter={tile}
            >
              <TileFace face={tileFace(tile)} />
            </button>
          ))
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className={`${BUTTON_BASE} ${BUTTON_STRONG} px-3`}
          disabled={finished || verdict === null || !mayDraw(play, verdict)}
          onClick={() => move((now) => draw(now))}
          data-testid="kumimoji-try-draw"
        >
          Draw <span className="font-mincho opacity-70">引く</span> · {left}
        </button>
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3`} disabled={finished || play.hand.length < 2} onClick={() => move(sortHand)} data-testid="kumimoji-try-sort">
          Sort
        </button>
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3`} disabled={finished || play.tiles.size === 0} onClick={() => move(liftAll)} data-testid="kumimoji-try-all-back">
          All back
        </button>
        <button
          type="button"
          className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3`}
          onClick={() => {
            setPlay(deal(TRY_IT.bag, TRY_IT.hand));
            setChosen(null);
            setTurn(0);
          }}
          data-testid="kumimoji-try-again"
        >
          Start again
        </button>
      </div>
      <p className="text-sm">
        <Link href={setUpPath(PUZZLE_KINDS.kumimoji)} className="font-semibold underline-offset-2 hover:underline" data-testid="kumimoji-try-play">
          A real game is 40 tiles or more, against the clock →
        </Link>
      </p>
    </section>
  );
}

/** The line under the table: what the first tap will fetch, then what to do next, as the game says it. */
function said(list: List, play: TilePlay, verdict: ReturnType<typeof judgeGrid> | null, left: number, finished: boolean): string {
  if (list.state === "idle") return `Tap a tile, then a square. Your first tap fetches the game's English word list, about ${TRY_IT_LIST_KB} KB, once; nothing is sent anywhere.`;
  if (list.state === "loading") return "Fetching the word list…";
  if (list.state === "failed") return "The word list could not be fetched just now. Reload the page to try again.";
  if (verdict === null) return "";
  if (finished) return `Every tile is down in one crossword. That is a whole Kumimoji, ${play.bag.length} tiles long.`;
  if (verdict.tiles === 0) return "Tap a tile, then a square. Tap a tile on the table twice to send it back.";
  if (verdict.notWords.length > 0) return `Not ${verdict.notWords.length === 1 ? "a word" : "words"}: ${verdict.notWords.map((word) => word.toUpperCase()).join(", ")}.`;
  if (verdict.apart.size > 0) return "Join every tile into one crossword.";
  if (verdict.tiles === 1) return "A word takes two letters or more.";
  if (play.hand.length > 0) return `${play.hand.length} ${play.hand.length === 1 ? "tile" : "tiles"} to lay.`;
  if (left > 0) return left === 1 ? "Sound. Draw the last tile: it is wild, and you choose its letter." : "Sound. Draw the next tile.";
  return "Every tile is down.";
}
