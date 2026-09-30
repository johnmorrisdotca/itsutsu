"use client";

import type { Appearance } from "@/components/board/board.types";
import { hitotsuTop } from "@/lib/party/hitotsu/hitotsu";
import { colourWords, isWild } from "@/lib/party/hitotsu/hitotsuDeck";
import type { HitotsuGame } from "@/lib/party/hitotsu/hitotsu.types";

import { CardTableSurface, TableWords } from "../cards/CardTableParts";
import { HITOTSU_COLOUR_LOOK, HITOTSU_COPY } from "./hitotsu.constants";
import { HitotsuCardView, hitotsuCardLabel } from "./HitotsuCardView";

const cqw = (value: number) => `${value}cqw`;
/** A card on the table, in hundredths of the table's width, as the family card games lay theirs. */
const CARD = 18;
/** How the two cards under the top one lie, turned a little, so the pile reads as a pile. */
const UNDER = [
  { left: 44, top: 8, turn: -9 },
  { left: 47.5, top: 7.5, turn: 7 },
] as const;

/**
 * THE TABLE IN THE MIDDLE OF A GAME OF HITOTSU, on the reader's own wood as
 * every card table is (`CardTableSurface`): the stock face down and the pile
 * face up beside it, the colour to follow in a disc of that colour with its
 * element — a wild's called colour is only ever shown this way and on the
 * card — which way play is going, and any draw waiting to be taken. The two
 * cards played before the top one lie under it, turned, as a pile does.
 */
export function HitotsuTableTop({ game, appearance }: { game: HitotsuGame; appearance?: Appearance }) {
  const top = hitotsuTop(game);
  const look = HITOTSU_COLOUR_LOOK[game.colour];
  const under = game.discard.slice(-1 - UNDER.length, -1);
  return (
    <CardTableSurface appearance={appearance}>
      {game.stock.length === 0 ? null : (
        <span className="absolute block" style={{ left: cqw(19), top: cqw(7), width: cqw(CARD) }} data-testid="hitotsu-stock" role="img" aria-label="the stock, face down">
          <HitotsuCardView faceUp={false} />
        </span>
      )}
      <TableWords left={13} top={34} width={30}>
        {HITOTSU_COPY.stock(game.stock.length)}
      </TableWords>
      {under.map((card, at) => {
        const lie = UNDER[UNDER.length - under.length + at]!;
        return (
          <span key={card} className="absolute block" style={{ left: cqw(lie.left), top: cqw(lie.top), width: cqw(CARD), transform: `rotate(${lie.turn}deg)` }} aria-hidden="true">
            <HitotsuCardView card={card} />
          </span>
        );
      })}
      <span
        className="absolute block"
        style={{ left: cqw(45.5), top: cqw(7), width: cqw(CARD) }}
        data-testid="hitotsu-discard"
        data-card={top}
        role="img"
        aria-label={`${hitotsuCardLabel(top)} on top`}
      >
        <HitotsuCardView card={top} called={isWild(top) ? game.colour : undefined} />
      </span>
      <span
        className="absolute flex items-center justify-center rounded-full border-[0.5cqw] border-[#fffdf6] font-serif font-bold shadow-[0_1px_2px_rgba(0,0,0,0.35)] [font-size:4.4cqw]"
        style={{ left: cqw(70), top: cqw(12), width: cqw(11), height: cqw(11), background: look.fill, color: look.ink }}
        data-testid="hitotsu-colour"
        data-colour={game.colour}
        role="img"
        aria-label={HITOTSU_COPY.follow(colourWords(game.colour))}
      >
        {look.element}
      </span>
      <TableWords left={64} top={25} width={23} testId="hitotsu-direction">
        {game.direction === 1 ? "↻" : "↺"} {colourWords(game.colour)}
      </TableWords>
      {game.pending > 0 ? (
        <TableWords left={38.5} top={34} width={32} testId="hitotsu-pending">
          +{game.pending} waiting
        </TableWords>
      ) : null}
    </CardTableSurface>
  );
}
