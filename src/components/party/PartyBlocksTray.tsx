"use client";

import { usePartyMarbles } from "./partyMarbles";
import { GAME_COPY } from "@/components/game/game.constants";
import { PieceGlyph } from "@/components/game/PieceTray";
import { Button, SectionTitle } from "@/components/ui/Controls";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { BLOCKS_PIECES } from "@/lib/gomoku/party/partyBlocks.constants";
import { blocksPiecesLeft, blocksPieceSize, heldCells } from "@/lib/gomoku/party/partyBlocks";


import type { PartyBlocksTrayProps } from "./party.types";
import { PARTY_BLOCKS_COPY } from "./partyBlocks.constants";

/**
 * THE PIECES OF THE PLAYER TO MOVE, as Block Five's own tray holds its one:
 * the piece in hand drawn large, as they have turned it, with the same Rotate
 * and Flip (and the same R and F keys, `PartyBlocksGame`) — and, because each
 * player here chooses which of their own pieces to lay, every piece they have
 * not laid yet, drawn small in their colour, to pick from. Twenty-one fit a
 * phone in three rows of seven.
 */
export function PartyBlocksTray({ game, hold, onHold, onRotate, onFlip, refusal }: PartyBlocksTrayProps) {
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  const marble = marbles[game.toPlay];
  const paint = (label: string) => ({ fill: marble.fill, label });
  const left = blocksPiecesLeft(game, game.toPlay);

  return (
    <section className={`${PANEL_CLASS} flex min-w-0 flex-col gap-3`} data-testid="blocks-tray" data-player={game.toPlay}>
      <SectionTitle kanji={PARTY_BLOCKS_COPY.trayKanji}>{PARTY_BLOCKS_COPY.tray}</SectionTitle>
      <div className="flex min-h-[6.5rem] items-center gap-4">
        <div className="flex w-[6.5rem] shrink-0 justify-center" data-testid="blocks-in-hand" data-piece={hold.piece} data-turns={hold.turns} data-flipped={hold.flipped ? "true" : "false"}>
          <PieceGlyph cells={heldCells(hold)} scale={1} paint={paint(`${marble.label} piece in hand, ${blocksPieceSize(hold.piece)} squares`)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onRotate} data-testid="blocks-rotate">
            {GAME_COPY.rotatePiece.label}
          </Button>
          <Button onClick={onFlip} data-testid="blocks-flip">
            {GAME_COPY.flipPiece.label}
          </Button>
          <span className="w-full text-[0.7rem] text-muted">{PARTY_BLOCKS_COPY.keys}</span>
        </div>
      </div>
      <p className={`min-h-[2.5rem] text-xs ${refusal === null ? "text-muted" : "text-shu"}`} data-testid="blocks-hint" aria-live="polite">
        {refusal ?? PARTY_BLOCKS_COPY.how}
      </p>
      <ul className="grid grid-cols-7 gap-1" aria-label={PARTY_BLOCKS_COPY.tray}>
        {left.map((piece) => (
          <li key={piece} className="min-w-0">
            <button
              type="button"
              onClick={() => onHold(piece)}
              aria-pressed={piece === hold.piece}
              aria-label={`${blocksPieceSize(piece)}-square piece`}
              data-testid="blocks-piece"
              data-piece={piece}
              className={`flex aspect-square w-full min-h-11 items-center justify-center rounded-md border ${
                piece === hold.piece ? "border-ink bg-rule/60" : "border-rule-strong bg-ivory hover:bg-rule/40"
              }`}
            >
              <PieceGlyph cells={BLOCKS_PIECES[piece]} scale={0.34} paint={paint("")} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
