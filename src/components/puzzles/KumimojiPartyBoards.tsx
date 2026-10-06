"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { Paired } from "@/components/i18n/Paired";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { Speaker } from "@/lib/i18n/i18n";
import type { BoardThemeTokens } from "@/components/board/board.types";
import { BUTTON_BASE, BUTTON_QUIET, PLAY_BUTTON } from "@/components/ui/ui.constants";
import { isComputer, passViewStart, stepView } from "@/lib/puzzles/kumimoji/party";
import type { PartyGame } from "@/lib/puzzles/kumimoji/party.types";
import { winnersOf } from "@/lib/puzzles/kumimoji/partyTurns";
import { tileFace } from "@/lib/puzzles/kumimoji/tileFace";

import { ComputerMark } from "./KumimojiDeskParts";
import { KumimojiTable } from "./KumimojiTable";
import { TileFace, wildStyle } from "./KumimojiTileFace";
import { dotOf, inALine as lineOf, seatName, tileSaid } from "./kumimojiWords";
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
function standingOf(game: PartyGame, at: number, say: Speaker): string {
  const word = winnersOf(game).includes(at)
    ? say.say("pkumi.board.won")
    : game.resigned.includes(at)
      ? say.say("pkumi.board.resigned")
      : game.out.includes(at)
        ? say.say("pkumi.board.wentOut")
        : game.ending === null && at === game.turn
          ? say.say("pkumi.board.toPlay")
          : null;
  return word === null ? "" : `${dotOf(say)}${word}`;
}

/** One player's crossword and hand, read-only, with their name and how many tiles each holds; `overTable` is laid over the table alone, never the hand. */
export function PartyBoard({ game, at, theme, overTable = null }: { game: PartyGame; at: number; theme: BoardThemeTokens; overTable?: ReactNode }) {
  const say = useSpeaker();
  const describe = tileSaid(say);
  const player = game.players[at]!;
  return (
    <figure
      className="flex min-w-0 flex-col gap-1.5"
      data-testid="kumimoji-party-board"
      data-player={at}
      data-won={winnersOf(game).includes(at) ? "true" : undefined}
      data-resigned={game.resigned.includes(at) ? "true" : undefined}
    >
      {/* Two lines of room whether or not the counts wrap under the name, so tables side by side start level (John, 2026-09-30). */}
      <figcaption className="flex min-h-10 min-w-0 flex-wrap content-start items-baseline justify-between gap-x-2 text-sm">
        <span className="flex min-w-0 max-w-full items-center gap-1.5">
          <span className="min-w-0 truncate font-semibold">{seatName(say, game, at)}</span>
          {isComputer(game, at) ? <ComputerMark /> : null}
        </span>
        <span className="shrink-0 text-xs text-muted tabular-nums" data-testid="kumimoji-party-board-counts">
          {say.say("pkumi.board.laid", { laid: String(player.tiles.size), hand: String(player.hand.length) })}
          {standingOf(game, at, say)}
        </span>
      </figcaption>
      <div className="relative">
        <KumimojiTable tiles={player.tiles} theme={theme} readOnly boxClass={TILE_PICTURE_BOX} />
        {overTable}
      </div>
      <div className="flex min-h-7 flex-wrap items-center gap-1" data-testid="kumimoji-party-hand" aria-label={say.say("pkumi.board.handAria", { name: seatName(say, game, at) })}>
        {player.hand.length === 0 ? (
          <span className="text-xs text-muted" data-testid="kumimoji-party-hand-empty">
            {say.say("pkumi.board.noTiles")}
          </span>
        ) : null}
        {player.hand.map((letter, place) => {
          const face = tileFace(letter);
          return (
            <span
              key={`${place}-${letter}`}
              className={`${TILE} relative`}
              style={wildStyle(face, { width: PARTY_HAND_TILE_PX, height: PARTY_HAND_TILE_PX, fontSize: tileLetterPx(PARTY_HAND_TILE_PX) })}
              data-testid="kumimoji-party-hand-tile"
              data-letter={letter}
              aria-label={describe(letter)}
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
  const say = useSpeaker();
  const [open, setOpen] = useState<number | null>(null);
  if (open !== null) {
    return (
      <div className="flex flex-col gap-3" data-testid="kumimoji-party-one" data-player={open}>
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} self-start`} onClick={() => setOpen(null)} data-testid="kumimoji-party-one-back">
          {say.say("pkumi.board.allTablesBack")}
        </button>
        <PartyBoard game={game} at={open} theme={theme} />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3" data-testid="kumimoji-party-all">
      {onClose === undefined ? null : (
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} self-start`} onClick={onClose} data-testid="kumimoji-party-all-close">
          {say.say(own === null ? "pkumi.board.back" : "pkumi.board.backToMine")}
        </button>
      )}
      <ul className={PARTY_ALL_GRID}>
        {game.players.map((_, at) => (
          <li key={at} className="min-w-0">
            <button
              type="button"
              className="w-full min-w-0 rounded-xl p-1 text-left outline-none hover:bg-moss-soft/30 focus-visible:ring-2 focus-visible:ring-moss"
              onClick={() => (at === own && onOwn !== undefined ? onOwn() : setOpen(at))}
              aria-label={at === own ? say.say("pkumi.board.backToMineAria") : say.say("pkumi.board.lookAt", { name: seatName(say, game, at) })}
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
  const say = useSpeaker();
  const name = seatName(say, game, game.turn);
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
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3`} onClick={() => step(-1)} aria-label={say.say("pkumi.board.before")} data-testid="kumimoji-party-view-prev">
          ‹
        </button>
        <span className="min-w-0 truncate text-sm text-muted" data-testid="kumimoji-party-viewing">
          {say.say("pkumi.board.viewing", { name: seatName(say, game, viewing), at: String(viewing + 1), count: String(game.players.length) })}
        </span>
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3`} onClick={() => step(1)} aria-label={say.say("pkumi.board.next")} data-testid="kumimoji-party-view-next">
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
                  {say.say("pkumi.board.wentOutLast", { names: lineOf(say, game.out.map((at) => seatName(say, game, at))), name })}
                </p>
              )}
              <p className="text-lg font-semibold" data-testid="kumimoji-party-pass">
                {say.say("pkumi.board.passTo", { name })}
              </p>
              <button type="button" className={`${PLAY_BUTTON} pointer-events-auto`} onClick={onUncover} data-testid="kumimoji-party-uncover">
                {say.say("pkumi.board.imName", { name })}
              </button>
            </div>
          }
        />
      </div>
      <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => setAll(true)} data-testid="kumimoji-party-all-open">
        <Paired en={say.say("pkumi.board.allTablesOpen")} kanji="全" kanjiClassName="opacity-70" inReadersLanguage />
      </button>
      {children}
    </div>
  );
}
