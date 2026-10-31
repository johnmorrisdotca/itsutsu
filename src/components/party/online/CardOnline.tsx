"use client";

import { useState } from "react";

import { AskIfAway } from "@/components/game/AskIfAway";
import { namesInALine } from "@/components/game/winNews";
import { ResultMark } from "@/components/game/ResultMark";
import { RESULT_MARKS } from "@/components/game/resultMark.constants";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { CardHand } from "@/components/cards/CardHand";
import type { CardSpot } from "@/components/cards/cards.types";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import type { CardGameKind } from "@/lib/cardGames/cardGames.constants";
import type { CardId } from "@/lib/cardGames/cardGames.types";
import { cardOfId } from "@/lib/cardGames/cards";
import { playerNumberName } from "@/lib/gomoku/seatWords";

import { CARD_ADAPTERS, seatName } from "../cards/cardAdapters";
import { HAND_CARD_PX } from "../cards/cardTable.constants";
import { CardScores } from "../cards/CardScores";
import { CardSeats } from "../cards/CardSeats";
import { CardTableSurface } from "../cards/CardTableParts";
import { cardTableWords, onlineWords } from "../partyWords";
import type { OnlineBoardProps } from "./online.types";

/** A choice made on one turn, forgotten when the game moves on. */
type Held<T> = { at: string; value: T };

/**
 * A FAMILY CARD GAME AT A TABLE ON SEVERAL DEVICES, one component for all eleven:
 * everybody else along the top, the table in the middle, and the reader's own hand
 * along the foot, always face up, since nobody else is looking at this screen. What
 * each game does with a tap is its adapter (`cardAdapters.ts`), the one the table on
 * one device uses, and the rules decide every move again on the server.
 *
 * THE CARDS HERE ARE ONLY WHAT THIS SEAT WAS SENT (`onlineCards.ts`): its own hand, and
 * everybody else's as backs. So nothing on this page could draw another person's hand
 * if it tried. A computer's seat is played by a browser at the table (`useComputerTurn`).
 */
export function CardOnline({ kind, game, appearance, canMove, onMove, mySeat }: OnlineBoardProps<unknown, unknown> & { kind: CardGameKind }) {
  const say = useSpeaker();
  const CARD_TABLE_COPY = cardTableWords(say.locale);
  const ONLINE_COPY = onlineWords(say.locale);
  const adapter = CARD_ADAPTERS[kind];
  const rules = adapter.rules;
  const { players, computers } = rules.seats(game);
  const names = players.map((_, seat) => seatName(players, computers, seat, say));
  const name = (seat: number) => names[seat] ?? playerNumberName(say, seat + 1);
  const over = rules.over(game);
  const toPlay = over ? null : rules.toPlay(game);
  const open = adapter.open === true;
  const viewer = open ? null : mySeat;
  const myTurn = canMove && !over && toPlay === mySeat;
  const hand = open ? [] : adapter.hand(game, mySeat);
  const counts = players.map((_, seat) => adapter.hand(game, seat).length);
  // Where the game stands, for a choice to be forgotten when it moves on: this seat's turn, and how many cards are still out.
  const at = `${toPlay}:${counts.join(",")}:${hand.join("")}`;
  const [held, setHeld] = useState<Held<CardId[]>>({ at: "", value: [] });
  const [aimed, setAimed] = useState<Held<number | null>>({ at: "", value: null });
  const chosen = held.at === at ? held.value : [];
  const target = aimed.at === at ? aimed.value : null;
  const send = (move: unknown | null) => {
    if (move !== null && myTurn) onMove(move);
  };
  const press = (spot: CardSpot) => {
    const card = hand[spot.index];
    if (!myTurn || card === undefined) return;
    const most = adapter.chooses(game);
    setHeld({ at, value: chosen.includes(card) ? chosen.filter((one) => one !== card) : most === 1 ? [card] : [...chosen, card].slice(-most) });
  };
  const actions = myTurn ? adapter.actions(game, chosen, target, name, say) : [];
  const stuck = actions.find((action) => action.strong === true && action.move === null);
  const others = open ? [] : players.map((_, seat) => seat).filter((seat) => seat !== mySeat);
  const winners = over ? rules.winners(game) : [];
  const ending = over && adapter.ending !== undefined ? adapter.ending(game, name, say) : null;
  const arrived = adapter.arrived === undefined ? [] : adapter.arrived(game, mySeat);
  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="cards-game" data-kind={kind} data-state={over ? "finished" : "playing"} data-to-play={toPlay ?? undefined} data-viewer={viewer ?? undefined}>
      <p className="min-h-12 text-base font-semibold" data-testid="cards-status" aria-live="polite">
        {over ? <ResultMark kind={winners.length === 0 || ending?.draw === true ? RESULT_MARKS.other : RESULT_MARKS.success} className="mr-1.5" /> : null}
        {over ? `${CARD_TABLE_COPY.over}: ${ending !== null ? ending.line : CARD_TABLE_COPY.won(namesInALine(winners.map(name), say))}` : adapter.status(game, name, say)}
      </p>
      {open ? null : (
        <CardSeats
          seats={others}
          names={names}
          computers={computers}
          counts={counts}
          standing={(seat) => adapter.standing(game, seat, say)}
          toPlay={toPlay}
          targets={myTurn && adapter.targets !== undefined ? adapter.targets(game) : []}
          target={target}
          onTarget={(seat) => setAimed({ at, value: seat })}
        />
      )}
      <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-3" data-width-reason="a card table wider than a hand of cards spreads the trick past where the eye can take it in with the hand" data-scale-board data-bare-board>
        <CardTableSurface appearance={appearance}>
          <adapter.Centre game={game} viewer={viewer} players={names} />
        </CardTableSurface>
        {open ? (
          over ? null : (
            <div className="flex flex-wrap items-center gap-2" data-testid="cards-actions" data-bare-beside>
              {actions.map((action) => (
                <button key={action.testId} type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG} min-h-11`} onClick={() => send(action.move)} data-testid={action.testId}>
                  {action.label}
                </button>
              ))}
            </div>
          )
        ) : over ? null : (
          <div className="flex flex-col gap-2" data-testid="cards-hand-panel" data-seat={mySeat} data-bare-beside>
            <p className="text-sm text-muted">
              {CARD_TABLE_COPY.yourHand} · {adapter.standing(game, mySeat, say).score}
            </p>
            <CardHand id="hand" cards={hand.map(cardOfId)} chosen={chosen.map((card) => hand.indexOf(card))} hinted={arrived.map((card) => hand.indexOf(card)).filter((one) => one >= 0)} label={CARD_TABLE_COPY.yourHand} cardWidth={HAND_CARD_PX} onPress={press} />
            {actions.length === 0 ? null : (
              <div className="flex flex-wrap items-center gap-2" data-testid="cards-actions">
                {actions.map((action) => (
                  <button key={action.testId} type="button" className={`${BUTTON_BASE} ${action.strong === true ? BUTTON_STRONG : BUTTON_QUIET} min-h-11`} disabled={action.move === null} onClick={() => send(action.move)} data-testid={action.testId}>
                    {action.label}
                  </button>
                ))}
                {stuck?.why === undefined ? null : <span className="text-xs text-muted">{stuck.why}</span>}
              </div>
            )}
          </div>
        )}
      </div>
      <div data-chrome>
        <CardScores names={names} scoreWords={adapter.scoreWords(say)} standing={(seat) => adapter.standing(game, seat, say)} winners={winners} />
      </div>
      <AskIfAway watching={myTurn} detail={ONLINE_COPY.idleDetail} kept={ONLINE_COPY.idleKept} />
    </div>
  );
}
