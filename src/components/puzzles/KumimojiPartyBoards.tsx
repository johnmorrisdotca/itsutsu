"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import type { BoardThemeTokens } from "@/components/board/board.types";
import { BUTTON_BASE, BUTTON_QUIET, PLAY_BUTTON } from "@/components/ui/ui.constants";
import { nameOf, passViewStart, stepView } from "@/lib/puzzles/kumimoji/party";
import type { PartyGame } from "@/lib/puzzles/kumimoji/party.types";
import { winnersOf } from "@/lib/puzzles/kumimoji/partyTurns";
import { tileDescription, tileFace } from "@/lib/puzzles/kumimoji/tileFace";

import { KumimojiTable } from "./KumimojiTable";
import { TileFace, wildStyle } from "./KumimojiTileFace";
import { PARTY_ALL_GRID, PARTY_HAND_TILE_PX, PARTY_PASS_LAYER, TILE, TILE_PICTURE_BOX, tileLetterPx } from "./kumimoji.constants";

/*
 * EVERY PLAYER'S TABLE AND HAND, TO BE LOOKED AT. John, 2026-09-28: "in [the
 * race game] there are no secrets because they are face up", and "you could
 * actually swipe and see any and all of the other players' boards… choose the
 * zoom out option to see all eight games that are ongoing". So a pass-and-play
 * game draws any player's crossword and unplayed tiles for anybody, read-only:
 * pressed by nobody, however they are shown. Only the player whose turn it
 * is, on their own desk (`KumimojiPartyTurn`), can move a tile.
 */

/** A player's standing in a word or two: won, out, resigned, whose turn. */
function standingOf(game: PartyGame, at: number): string {
  if (winnersOf(game).includes(at)) return " · won";
  if (game.resigned.includes(at)) return " · resigned";
  if (game.out.includes(at)) return " · went out";
  return game.ending === null && at === game.turn ? " · to play" : "";
}

/** One player's crossword and hand, read-only, with their name and how many tiles each holds; `overTable` is laid over the table alone, never the hand. */
export function PartyBoard({ game, at, theme, overTable = null }: { game: PartyGame; at: number; theme: BoardThemeTokens; overTable?: ReactNode }) {
  const player = game.players[at]!;
  return (
    <figure
      className="flex min-w-0 flex-col gap-1.5"
      data-testid="kumimoji-party-board"
      data-player={at}
      data-won={winnersOf(game).includes(at) ? "true" : undefined}
      data-resigned={game.resigned.includes(at) ? "true" : undefined}
    >
      <figcaption className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-2 text-sm">
        <span className="min-w-0 max-w-full truncate font-semibold">{nameOf(game, at)}</span>
        <span className="shrink-0 text-xs text-muted tabular-nums" data-testid="kumimoji-party-board-counts">
          {player.tiles.size} laid · {player.hand.length} in hand
          {standingOf(game, at)}
        </span>
      </figcaption>
      <div className="relative">
        <KumimojiTable tiles={player.tiles} theme={theme} readOnly boxClass={TILE_PICTURE_BOX} />
        {overTable}
      </div>
      <div className="flex min-h-7 flex-wrap gap-1" data-testid="kumimoji-party-hand" aria-label={`${nameOf(game, at)}'s hand`}>
        {player.hand.map((letter, place) => {
          const face = tileFace(letter);
          return (
            <span
              key={`${place}-${letter}`}
              className={`${TILE} relative`}
              style={wildStyle(face, { width: PARTY_HAND_TILE_PX, height: PARTY_HAND_TILE_PX, fontSize: tileLetterPx(PARTY_HAND_TILE_PX) })}
              data-testid="kumimoji-party-hand-tile"
              data-letter={letter}
              aria-label={tileDescription(letter)}
            >
              <TileFace face={face} />
            </span>
          );
        })}
      </div>
    </figure>
  );
}

/**
 * ALL TABLES: every player's crossword and hand side by side, the zoom out
 * John asked for. A press on a table opens it: your own, on your turn, back
 * to your desk (`onOwn`); anybody else's large, read-only, with a way back.
 */
export function KumimojiPartyAll({ game, theme, own = null, onOwn, onClose }: { game: PartyGame; theme: BoardThemeTokens; own?: number | null; onOwn?: () => void; onClose?: () => void }) {
  const [open, setOpen] = useState<number | null>(null);
  if (open !== null) {
    return (
      <div className="flex flex-col gap-3" data-testid="kumimoji-party-one" data-player={open}>
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} self-start`} onClick={() => setOpen(null)} data-testid="kumimoji-party-one-back">
          ← All tables
        </button>
        <PartyBoard game={game} at={open} theme={theme} />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3" data-testid="kumimoji-party-all">
      {onClose === undefined ? null : (
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} self-start`} onClick={onClose} data-testid="kumimoji-party-all-close">
          {own === null ? "← Back" : "← Back to my table"}
        </button>
      )}
      <ul className={PARTY_ALL_GRID}>
        {game.players.map((_, at) => (
          <li key={at} className="min-w-0">
            <button
              type="button"
              className="w-full min-w-0 rounded-xl p-1 text-left outline-none hover:bg-moss-soft/30 focus-visible:ring-2 focus-visible:ring-moss"
              onClick={() => (at === own && onOwn !== undefined ? onOwn() : setOpen(at))}
              aria-label={at === own ? "Back to my table" : `Look at ${nameOf(game, at)}'s table`}
              data-testid="kumimoji-party-all-table"
              data-player={at}
              data-own={at === own ? "true" : undefined}
            >
              <PartyBoard game={game} at={at} theme={theme} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** How far a finger must travel sideways for a swipe, in pixels. */
const SWIPE_PX = 40;

/**
 * THE PASS SCREEN, between two turns: whose turn it is next and their press,
 * on a graded, see-through layer over a table (`PARTY_PASS_LAYER`). The table
 * behind it opens as the one just played on (`passViewStart`), and a swipe,
 * the arrows beside its name or the keyboard's own arrows step through every
 * player's (`stepView`). `children` is what sits under it: the order of play
 * and the way to end the game.
 */
export function KumimojiPartyPass({ game, theme, onUncover, children }: { game: PartyGame; theme: BoardThemeTokens; onUncover: () => void; children: ReactNode }) {
  const name = nameOf(game, game.turn);
  const [viewing, setViewing] = useState(() => passViewStart(game));
  const [all, setAll] = useState(false);
  const down = useRef<number | null>(null);
  const step = (by: number) => setViewing((now) => stepView(game, now, by));

  useEffect(() => {
    if (all) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") setViewing((now) => stepView(game, now, 1));
      else if (event.key === "ArrowLeft") setViewing((now) => stepView(game, now, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [all, game]);

  if (all) return <KumimojiPartyAll game={game} theme={theme} onClose={() => setAll(false)} />;
  return (
    <div className="flex flex-col gap-3" data-testid="kumimoji-party-pass-screen" data-viewing={viewing}>
      <div className="flex items-center justify-between gap-2">
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3`} onClick={() => step(-1)} aria-label="The table before" data-testid="kumimoji-party-view-prev">
          ‹
        </button>
        <span className="min-w-0 truncate text-sm text-muted" data-testid="kumimoji-party-viewing">
          {nameOf(game, viewing)}&rsquo;s table · {viewing + 1} of {game.players.length}
        </span>
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3`} onClick={() => step(1)} aria-label="The next table" data-testid="kumimoji-party-view-next">
          ›
        </button>
      </div>
      <div
        className="relative touch-pan-y"
        data-testid="kumimoji-party-viewer"
        onPointerDown={(event) => {
          down.current = event.clientX;
        }}
        onPointerUp={(event) => {
          const from = down.current;
          down.current = null;
          if (from === null || Math.abs(event.clientX - from) < SWIPE_PX) return;
          step(event.clientX < from ? 1 : -1);
        }}
      >
        <PartyBoard
          game={game}
          at={viewing}
          theme={theme}
          overTable={
            <div className={PARTY_PASS_LAYER} data-testid="kumimoji-party-cover" data-player={game.turn}>
              {game.lastTurns === null ? null : (
                <p className="text-sm font-semibold text-shu" data-testid="kumimoji-party-last">
                  {inALine(game.out.map((at) => nameOf(game, at)))} went out — last turn for {name}
                </p>
              )}
              <p className="text-lg font-semibold" data-testid="kumimoji-party-pass">
                Pass to {name}
              </p>
              <button type="button" className={`${PLAY_BUTTON} pointer-events-auto`} onClick={onUncover} data-testid="kumimoji-party-uncover">
                I&rsquo;m {name}
              </button>
            </div>
          }
        />
      </div>
      <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => setAll(true)} data-testid="kumimoji-party-all-open">
        All tables <span className="font-mincho opacity-70">全</span>
      </button>
      {children}
    </div>
  );
}

/** Names in a line: "Aiko", "Aiko and Ben", "Aiko, Ben and Cho". */
export function inALine(names: readonly string[]): string {
  return names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}
