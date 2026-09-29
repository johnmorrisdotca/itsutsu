"use client";

import { useEffect, useMemo, useState } from "react";

import { AskIfAway } from "@/components/game/AskIfAway";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import type { Point } from "@/lib/gomoku/gomoku.types";
import { BLOCKS_STATUS, againBlocksParty, blocksPiecesLeft, blocksPreviewAt, blocksStartSquares, layBlocks } from "@/lib/gomoku/party/partyBlocks";
import type { BlocksHold, BlocksPieceKey } from "@/lib/gomoku/party/partyBlocks.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { PartyBlocksBoard } from "./PartyBlocksBoard";
import { PartyBlocksSetUp } from "./PartyBlocksSetUp";
import { PartyBlocksPlayers, PartyBlocksTurnLine } from "./PartyBlocksStatus";
import { PartyBlocksTray } from "./PartyBlocksTray";
import type { PartyTableGameProps } from "./party.types";
import { PARTY_BLOCKS_COPY } from "./partyBlocks.constants";
import { useKeptBlocksParty } from "./partyBlocksStore";

/**
 * What the player to move is doing with their pieces this turn: which one
 * they hold (null: the first they have), how they have turned it, and the
 * square they last tapped or pointed at. Stored against the turn it belongs
 * to, so the next player picks the tray up fresh without an effect to reset it.
 */
type Held = { turn: string; piece: BlocksPieceKey | null; turns: number; flipped: boolean; at: Point | null };

const fresh = (turn: string): Held => ({ turn, piece: null, turns: 0, flipped: false, at: null });

/**
 * BLOCK FIVE FOR FOUR, PASSED ROUND THE TABLE.
 *
 * Nothing is hidden in this game, so whoever holds the device plays the
 * colour the turn line names and hands it on. The player chooses a piece from
 * their tray, turns or flips it (the buttons, or R and F as on Block Five's
 * own board), and taps the board: the piece is shown where it would lie —
 * slid over the tapped square to the first place the rules allow, or ringed
 * red with the reason when there is none — and a second tap on it lays it.
 * A mouse shows it under the pointer, so one click lays it.
 *
 * Every rule is asked of `lib/gomoku/party/partyBlocks.ts`; nothing here reads
 * the board to decide anything. The game is kept in this browser after every
 * piece (`partyBlocksStore.ts`), and nowhere else.
 */
export function PartyBlocksGame({ appearance, gameHref }: PartyTableGameProps) {
  const hydrated = useHydrated();
  const [game, keep] = useKeptBlocksParty();
  const [held, setHeld] = useState<Held>(() => fresh(""));
  const [confirming, setConfirming] = useState(false);
  const playing = game !== undefined && game !== null && game.status === BLOCKS_STATUS.playing;
  const turn = game === undefined || game === null ? "" : `${game.moves.length}:${game.toPlay}`;
  const current = held.turn === turn ? held : fresh(turn);

  // R turns the piece in hand and F flips it, as on Block Five's own board. Typing in a field is left alone.
  useEffect(() => {
    if (!playing) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target !== null && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "r" || key === "arrowright") setHeld((was) => turned(was, turn, 1, false));
      else if (key === "f" || key === "arrowup") setHeld((was) => turned(was, turn, 0, true));
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, turn]);

  const starts = useMemo(() => (game === undefined || game === null || !playing ? [] : blocksStartSquares(game, game.toPlay)), [game, playing]);

  // Not read yet: the server has no browser to ask, so it keeps the room the game will take and says nothing.
  if (game === undefined) {
    return <section className="min-h-[28rem]" data-testid="party-blocks" {...readyMark(false)} aria-busy="true" />;
  }
  if (game === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="party-blocks" data-state="set-up">
        <PartyBlocksSetUp appearance={appearance} onStart={(started) => keep(started)} ready={readyMark(hydrated)} />
      </section>
    );
  }

  const left = blocksPiecesLeft(game, game.toPlay);
  const piece = current.piece !== null && left.includes(current.piece) ? current.piece : (left[0] ?? null);
  const hold: BlocksHold | null = piece === null ? null : { piece, turns: current.turns, flipped: current.flipped };
  const preview = playing && hold !== null && current.at !== null ? blocksPreviewAt(game, hold, current.at) : null;

  const onSquare = (point: Point) => {
    const onIt = preview !== null && preview.cells.some((cell) => cell.row === point.row && cell.col === point.col);
    if (hold !== null && preview !== null && preview.refusal === null && onIt) {
      const next = layBlocks(game, hold.piece, preview.cells);
      if (next !== null) keep(next);
      return;
    }
    setHeld({ ...current, at: point });
  };

  return (
    <section
      className="grid gap-6 lg:grid-cols-[minmax(0,40rem)_minmax(0,1fr)] lg:items-start"
      data-testid="party-blocks"
      data-state={game.status}
      data-moves={game.moves.length}
      {...readyMark(hydrated)}
    >
      <div className="flex min-w-0 flex-col gap-3">
        <PartyBlocksTurnLine game={game} />
        <PartyBlocksBoard
          game={game}
          appearance={appearance}
          preview={preview}
          starts={starts}
          onSquare={onSquare}
          onAim={(point) => setHeld({ ...current, at: point })}
        />
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        {playing && hold !== null ? (
          <PartyBlocksTray
            game={game}
            hold={hold}
            onHold={(chosen) => setHeld({ ...current, piece: chosen, turns: 0, flipped: false })}
            onRotate={() => setHeld(turned(current, turn, 1, false))}
            onFlip={() => setHeld(turned(current, turn, 0, true))}
            refusal={preview?.refusal == null ? null : PARTY_BLOCKS_COPY.refusals[preview.refusal]}
          />
        ) : null}
        <PartyBlocksPlayers game={game} />
        <div className="flex flex-wrap gap-2">
          {playing ? null : (
            <button type="button" onClick={() => keep(againBlocksParty(game))} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="blocks-again">
              {PARTY_BLOCKS_COPY.again}
            </button>
          )}
          {confirming ? (
            <span className="flex flex-wrap items-center gap-2 text-sm" data-testid="blocks-confirm-new">
              <span>{PARTY_BLOCKS_COPY.confirmNew}</span>
              <button
                type="button"
                onClick={() => {
                  keep(null);
                  setConfirming(false);
                }}
                className={`${BUTTON_BASE} ${BUTTON_STRONG}`}
                data-testid="blocks-new-yes"
              >
                {PARTY_BLOCKS_COPY.confirmYes}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`}>
                {PARTY_BLOCKS_COPY.confirmNo}
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => (playing ? setConfirming(true) : keep(null))}
              className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
              data-testid="blocks-new"
            >
              {PARTY_BLOCKS_COPY.newGame}
            </button>
          )}
        </div>
        <p className="text-sm">
          <Link href={gameHref} className="underline underline-offset-4">
            {PARTY_BLOCKS_COPY.about} →
          </Link>
        </p>
      </aside>
      {/* "ARE YOU STILL THERE?", as every board a person plays on asks: nothing is timed here, so the game simply waits, kept. */}
      <AskIfAway watching={playing} detail={PARTY_BLOCKS_COPY.idleDetail} kept={PARTY_BLOCKS_COPY.idleKept} />
    </section>
  );
}

/** The held piece a quarter turn further round, or mirrored — for this turn, fresh if what was held belongs to an earlier one. */
function turned(was: Held, turn: string, turns: number, flip: boolean): Held {
  const now = was.turn === turn ? was : fresh(turn);
  return { ...now, turns: (now.turns + turns) % 4, flipped: flip ? !now.flipped : now.flipped };
}
