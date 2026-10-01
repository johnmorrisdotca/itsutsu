"use client";

import { useState } from "react";
import { ResultMark } from "@/components/game/ResultMark";
import { RESULT_MARKS } from "@/components/game/resultMark.constants";

import type { Appearance } from "@/components/board/board.types";
import { CardDragGhost } from "@/components/cards/CardDragGhost";
import { CardHand } from "@/components/cards/CardHand";
import type { CardSpot } from "@/components/cards/cards.types";
import { useCardDrag } from "@/components/cards/useCardDrag";
import { useCardSounds } from "@/components/cards/useCardSounds";
import { AskIfAway } from "@/components/game/AskIfAway";
import { WinCoverOver, useWinMoment } from "@/components/game/WinCover";
import { resultLine, tableNews } from "@/components/game/winNews";
import { TableWallpaper } from "../TableWallpaper";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, PLAY_SURFACE } from "@/components/ui/ui.constants";
import { cardOfId } from "@/lib/cardGames/cards";
import type { CardId } from "@/lib/cardGames/cardGames.types";

import { seatName } from "./cardAdapters";
import { CARD_TABLE_COPY, HAND_CARD_PX } from "./cardTable.constants";
import type { CardAdapter } from "./cardTable.types";
import { CardSeats } from "./CardSeats";
import { CardScores } from "./CardScores";
import { CardTableSurface } from "./CardTableParts";
import { freshCardSeed } from "./cardTableStores";
import { useCardComputer } from "./useCardComputer";

/** A choice made on one turn, forgotten when the game moves on: the moves made when it was made, and what it was. */
type Held<T> = { at: number; value: T };

/**
 * A FAMILY CARD GAME BEING PLAYED, round one device, with a computer in any
 * seat nobody sits in: everybody else along the top, the table in the middle,
 * and the hand of whoever holds the device along the foot.
 *
 * Every move is the rules' (`adapter.rules`): a person's choice — cards tapped
 * (they rise) and a press, a card dragged onto the table, a card tapped twice —
 * becomes a move through the game's adapter, the rules play it, and the game is
 * kept after every one (`keptInBrowser`). A computer plays its own seat after a
 * short pause (`useCardComputer`).
 *
 * HIDDEN HANDS. With one person at the table, their hand is always theirs to
 * see. With two or more, whenever a different person's turn comes the table
 * covers every hand and asks for the device to be passed on by name, and shows
 * that player's cards only once they say they have it. Every other hand is
 * drawn face down, with nothing about its cards in the page.
 */
export function CardPlay({ adapter, game, keep, appearance, gameHref, gameName, ready }: { adapter: CardAdapter<unknown, unknown>; game: unknown; keep: (game: unknown) => void; appearance: Appearance; gameHref: string; gameName: string; ready: { "data-ready": string } }) {
  const rules = adapter.rules;
  const { players, computers } = rules.seats(game);
  const names = players.map((_, seat) => seatName(players, computers, seat));
  const name = (seat: number) => names[seat] ?? `Player ${seat + 1}`;
  const over = rules.over(game);
  const toPlay = over ? null : rules.toPlay(game);
  const people = players.map((_, seat) => seat).filter((seat) => !computers[seat]);
  const moves = (game as { moves: readonly unknown[] }).moves.length;

  const [handedTo, setHandedTo] = useState<number | null>(people.length === 1 ? people[0] : null);
  const personToPlay = toPlay !== null && !computers[toPlay];
  const covered = !over && people.length > 1 && personToPlay && handedTo !== toPlay;
  // Whose hand is drawn face up: the one person at the table; else whoever the device was last handed to.
  const viewer = people.length === 1 ? people[0] : covered ? null : personToPlay ? toPlay : handedTo;
  const myTurn = !over && viewer !== null && viewer === toPlay;

  const [held, setHeld] = useState<Held<CardId[]>>({ at: -1, value: [] });
  const [aimed, setAimed] = useState<Held<number | null>>({ at: -1, value: null });
  const [confirming, setConfirming] = useState(false);
  const chosen = held.at === moves ? held.value : [];
  const target = aimed.at === moves ? aimed.value : null;
  const thinking = useCardComputer(rules, game, keep);
  // The cover over the table when the last hand is scored here (`WinCover`); a finished game opened again has none.
  const moment = useWinMoment(over ? "ended" : "playing");

  const hand = viewer === null ? [] : adapter.hand(game, viewer);
  const play = (move: unknown | null): boolean => {
    if (move === null || !myTurn) return false;
    const next = rules.play(game, move);
    if (next === null) return false;
    keep(next);
    return true;
  };
  const choose = (card: CardId) => {
    const most = adapter.chooses(game);
    const next = chosen.includes(card) ? chosen.filter((one) => one !== card) : most === 1 ? [card] : [...chosen, card].slice(-most);
    setHeld({ at: moves, value: next });
  };

  const drag = useCardDrag({
    disabled: !myTurn,
    onDrop: (from, to) => {
      const card = hand[from.index];
      if (card === undefined || to === null) return;
      const seat = to.startsWith("seat-") ? Number(to.slice(5)) : null;
      if (to !== "table" && seat === null) return;
      if (!play(adapter.quick(game, card, chosen, seat ?? target))) choose(card);
    },
  });

  const press = (spot: CardSpot) => {
    const card = hand[spot.index];
    if (!myTurn || card === undefined || !drag.clickWanted()) return;
    // A second tap on the card just chosen plays it, where it has one obvious move.
    if (chosen.includes(card) && drag.doubleTap(card)) {
      if (play(adapter.quick(game, card, chosen, target))) return;
    }
    if (!chosen.includes(card)) drag.doubleTap(card);
    choose(card);
  };

  const actions = myTurn ? adapter.actions(game, chosen, target, name) : [];
  const stuck = actions.find((action) => action.strong === true && action.move === null);
  const others = players.map((_, seat) => seat).filter((seat) => seat !== viewer);
  const counts = players.map((_, seat) => adapter.hand(game, seat).length);
  const sound = useCardSounds(counts.reduce((sum, count) => sum + count, 0));
  const arrived = viewer === null || adapter.arrived === undefined ? [] : adapter.arrived(game, viewer);
  const winners = over ? rules.winners(game) : [];
  const again = () => {
    const size = (game as { size: number }).size;
    const fresh = rules.start(size, players, undefined, freshCardSeed(), computers);
    if (fresh !== null) keep(fresh);
  };

  return (
    <section
      className={`${PLAY_SURFACE} flex flex-col gap-3`}
      data-testid="cards-game"
      data-kind={adapter.kind}
      data-state={over ? "finished" : "playing"}
      data-moves={moves}
      data-to-play={toPlay ?? undefined}
      data-viewer={viewer ?? undefined}
      data-covered={covered ? "true" : "false"}
      {...ready}
    >
      <p className="min-h-12 text-base font-semibold" data-testid="cards-status" aria-live="polite">
        {over ? <ResultMark kind={winners.length === 0 ? RESULT_MARKS.other : RESULT_MARKS.success} className="mr-1.5" /> : null}
        {over ? `${CARD_TABLE_COPY.over}: ${CARD_TABLE_COPY.won(winners.map(name).join(" and "))}` : thinking && toPlay !== null ? CARD_TABLE_COPY.thinking(name(toPlay)) : adapter.status(game, name)}
      </p>
      <CardSeats
        seats={others}
        names={names}
        computers={computers}
        counts={counts}
        standing={(seat) => adapter.standing(game, seat)}
        toPlay={toPlay}
        targets={myTurn && adapter.targets !== undefined ? adapter.targets(game) : []}
        target={target}
        onTarget={(seat) => setAimed({ at: moves, value: seat })}
      />
      <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-3" data-width-reason="a card table wider than a hand of cards spreads the trick past where the eye can take it in with the hand" data-scale-board data-bare-board data-testid="cards-board">
        <WinCoverOver
          news={
            moment.open
              ? tableNews({
                  names,
                  winners,
                  // One person among computers is "you"; several people round the device are each named.
                  you: people.length === 1 ? people[0]! : null,
                  next: { label: CARD_TABLE_COPY.again, onPress: again },
                })
              : null
          }
          onClose={moment.close}
        >
          <CardTableSurface appearance={appearance}>
            <adapter.Centre game={game} viewer={viewer} players={names} />
          </CardTableSurface>
        </WinCoverOver>
        {covered && toPlay !== null ? (
          <div className={`${PANEL_CLASS} flex flex-col items-center gap-2 text-center`} data-testid="cards-pass-device">
            <p className="text-lg font-semibold">{CARD_TABLE_COPY.passTo(name(toPlay))}</p>
            <p className="text-sm text-muted">{CARD_TABLE_COPY.passNote}</p>
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG}`} onClick={() => setHandedTo(toPlay)} data-testid="cards-ready">
              {CARD_TABLE_COPY.ready(name(toPlay))}
            </button>
          </div>
        ) : viewer === null ? null : (
          <div className="flex flex-col gap-2" data-testid="cards-hand-panel" data-seat={viewer}>
            <p className="text-sm text-muted">
              {people.length === 1 ? CARD_TABLE_COPY.yourHand : CARD_TABLE_COPY.handOf(name(viewer))} · {adapter.standing(game, viewer).score}
            </p>
            <CardHand
              id="hand"
              cards={hand.map(cardOfId)}
              chosen={chosen.map((card) => hand.indexOf(card))}
              hinted={arrived.map((card) => hand.indexOf(card)).filter((at) => at >= 0)}
              label={CARD_TABLE_COPY.yourHand}
              cardWidth={HAND_CARD_PX}
              lifted={drag.lifted}
              onPress={press}
              onLift={(spot, event) => {
                const card = hand[spot.index];
                if (!myTurn || card === undefined) return;
                drag.start(spot, [cardOfId(card)], event, 0);
              }}
            />
            {actions.length === 0 ? null : (
              <div className="flex flex-wrap items-center gap-2" data-testid="cards-actions">
                {actions.map((action) => (
                  <button
                    key={action.testId}
                    type="button"
                    className={`${BUTTON_BASE} ${action.strong === true ? BUTTON_STRONG : BUTTON_QUIET} min-h-11`}
                    disabled={action.move === null}
                    onClick={() => play(action.move)}
                    data-testid={action.testId}
                  >
                    {action.label}
                  </button>
                ))}
                {stuck?.why === undefined ? null : <span className="text-xs text-muted">{stuck.why}</span>}
              </div>
            )}
          </div>
        )}
      </div>
      <CardDragGhost ghost={drag.ghost} ghostRef={drag.ghostRef} />
      <CardScores names={names} scoreWords={adapter.scoreWords} standing={(seat) => adapter.standing(game, seat)} winners={winners} />
      <div className="flex flex-wrap items-center gap-2">
        {over ? (
          <button type="button" onClick={again} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="cards-again">
            {CARD_TABLE_COPY.again}
          </button>
        ) : null}
        <button type="button" onClick={sound.toggle} aria-pressed={sound.on} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="card-sound" data-on={sound.on ? "true" : "false"}>
          {sound.on ? CARD_TABLE_COPY.soundOn : CARD_TABLE_COPY.soundOff}
        </button>
        {confirming ? (
          <span className="flex flex-wrap items-center gap-2 text-sm" data-testid="cards-confirm-new">
            <span>{CARD_TABLE_COPY.confirmNew}</span>
            <button type="button" onClick={() => keep(null)} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="cards-new-yes">
              {CARD_TABLE_COPY.confirmYes}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`}>
              {CARD_TABLE_COPY.confirmNo}
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => (over ? keep(null) : setConfirming(true))} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="cards-new">
            {CARD_TABLE_COPY.newGame}
          </button>
        )}
      </div>
      {over ? <TableWallpaper game={adapter.kind} result={resultLine(names, winners)} /> : null}
      <p className="text-xs text-muted">{CARD_TABLE_COPY.kept}</p>
      <p className="text-sm">
        <Link href={gameHref} className="underline underline-offset-4">
          {CARD_TABLE_COPY.about(gameName)} →
        </Link>
      </p>
      <AskIfAway watching={!over} detail={CARD_TABLE_COPY.idleDetail} kept={CARD_TABLE_COPY.idleKept} />
    </section>
  );
}
