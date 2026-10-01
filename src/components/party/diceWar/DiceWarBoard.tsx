"use client";

import type { DiceWarGame } from "@johnmorrisdotca/korokoro";

import { diceWarSeatName } from "@/lib/party/diceWar/diceWar.constants";
import { lastThrow } from "@/lib/party/diceWar/diceWarThrow";

import { MarbleChip } from "../MarbleChip";
import { DICE_WAR_COPY, dieWidth } from "./diceWar.constants";
import { DiceWarDie } from "./DiceWarDie";

/**
 * THE TABLE OF A THROW, one row a player: their marble and name, the dice they
 * threw and what those add up to, and their points. The last throw is what is
 * drawn: in a war only the players who tied roll again, and the others show
 * that they are out of it. A player who took the throw is ringed, and the ones
 * tied for it are ringed another way, so war is never told by colour alone: a
 * word says it too.
 *
 * Every row keeps one height whatever it shows (dice, empty places for dice not
 * thrown yet, or a note), so nothing moves when a throw lands. Before the first
 * throw each row has its places laid out, which is also the set-up's preview:
 * the table itself, with nothing to press.
 */
export function DiceWarBoard({ game }: { game: DiceWarGame }) {
  const throwMade = lastThrow(game);
  const width = dieWidth(game.dice);
  return (
    <ul className="flex flex-col gap-2" data-testid="dicewar-seats" data-throws={game.throws.length}>
      {game.players.map((_, seat) => {
        const roll = throwMade?.rolls.find((one) => one.seat === seat) ?? null;
        const won = throwMade !== null && throwMade.winner === seat;
        const tied = throwMade !== null && throwMade.winner === null && throwMade.tied.includes(seat);
        const name = diceWarSeatName(game.players, game.computers, seat);
        return (
          <li
            key={seat}
            className={`flex min-h-[4.25rem] items-center gap-2 rounded-lg border bg-paper px-2 py-1.5 ${won ? "border-moss ring-2 ring-moss" : tied ? "border-shu ring-2 ring-shu/70" : "border-rule"}`}
            data-testid="dicewar-seat"
            data-seat={seat}
            data-score={game.scores[seat]}
            data-won={won ? "true" : undefined}
            data-tied={tied ? "true" : undefined}
            data-total={roll?.total}
          >
            <MarbleChip player={seat} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-x-1.5 text-sm font-semibold leading-tight">
                <span className="truncate">{name}</span>
                {game.computers[seat] ? <span className="text-xs font-normal text-muted">{DICE_WAR_COPY.computer.toLowerCase()}</span> : null}
                {won ? <span className="text-xs font-semibold text-moss">+{throwMade.stake}</span> : null}
                {tied ? <span className="text-xs font-semibold text-shu">{DICE_WAR_COPY.war}</span> : null}
              </span>
              <span className="flex flex-wrap items-center gap-1" data-testid="dicewar-dice">
                {roll !== null ? (
                  <>
                    {roll.faces.map((face, at) => (
                      <DiceWarDie key={at} face={face} sides={game.sides} rollKey={game.throws.length} width={width} seat={seat} />
                    ))}
                    <span className="ml-1 text-sm font-semibold tabular-nums" data-testid="dicewar-total">
                      {DICE_WAR_COPY.total(roll.total)}
                    </span>
                  </>
                ) : throwMade === null ? (
                  Array.from({ length: game.dice }, (_, at) => <span key={at} className="inline-block rounded-md border border-dashed border-rule-strong" style={{ width, height: width }} aria-hidden="true" />)
                ) : (
                  <span className="text-xs text-muted" style={{ minHeight: width }}>
                    {DICE_WAR_COPY.notIn}
                  </span>
                )}
              </span>
            </div>
            <span className="flex flex-col items-end leading-none" aria-label={`${name}: ${game.scores[seat]} points`}>
              <span className="text-2xl font-semibold tabular-nums" data-testid="dicewar-score">
                {game.scores[seat]}
              </span>
              <span className="text-[0.65rem] tracking-[0.12em] text-muted uppercase">{DICE_WAR_COPY.scoreHeading}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
