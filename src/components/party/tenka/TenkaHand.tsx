import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { TENKA_MOVES, TENKA_PHASES } from "@/lib/party/tenka/tenka.constants";
import type { TenkaCardKind, TenkaGame, TenkaMove } from "@/lib/party/tenka/tenka.types";
import { mustTrade } from "@/lib/party/tenka/tenka";
import { cardKind, cardTerritory, setsIn, tradeValue } from "@/lib/party/tenka/tenkaCards";
import { tenkaMapOf } from "@/lib/party/tenka/tenkaMap";

import { TENKA_COPY } from "./tenka.constants";
import { DressedBackClient, DressedCardClient } from "./TenkaDressedClient";

const KIND_WORDS: Record<TenkaCardKind, string> = { land: "Land", sea: "Sea", air: "Air", wild: "Wild" };

/** The cards left in the deck, said as the package says it ("Deck: 41"). Here rather than in `tenka.constants.ts`, whose every change asks for the party pictures again. */
const deckWords = (left: number) => `Deck: ${left}`;

/**
 * THE CARDS IN THE HAND OF THE PLAYER TO MOVE (or, at a table on several
 * devices, the reader's own), each with its kind and the
 * territory it shows, and every set they make with what it trades for now —
 * shown only once the device has been passed to them (`handed`), and only
 * while trading could matter: at the start of their turn.
 */
export function TenkaHand({
  game,
  handed,
  onMove,
  seat = game.toPlay,
  mayTrade = true,
}: {
  game: TenkaGame;
  handed: boolean;
  onMove: (move: TenkaMove) => void;
  /** Whose cards: the player to move's round one device, the reader's own at a table on several (`TenkaOnline`). */
  seat?: number;
  /** Whether the sets may be traded from here now: not while a press is on its way, nor on somebody else's turn. */
  mayTrade?: boolean;
}) {
  const hand = game.hands[seat] ?? [];
  const trading = mayTrade && seat === game.toPlay && game.phase === TENKA_PHASES.reinforce;
  const sets = trading ? setsIn(hand, tenkaMapOf(game)) : [];
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="tenka-hand" data-cards={handed ? hand.length : undefined}>
      <h2 className={SECTION_TITLE}>
        {TENKA_COPY.hand} <span className="font-mincho normal-case tracking-normal">手札</span>
      </h2>
      {!handed ? (
        <p className="text-sm text-muted">{TENKA_COPY.cards(hand.length)}, shown once the device is passed on.</p>
      ) : hand.length === 0 ? (
        <p className="text-sm text-muted">{TENKA_COPY.noCards}</p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-1.5">
            {hand.map((card) => {
              const territory = cardTerritory(card, tenkaMapOf(game));
              const kind = cardKind(card, tenkaMapOf(game));
              const name = territory !== null ? tenkaMapOf(game).territories[territory].name : KIND_WORDS.wild;
              const label = `${KIND_WORDS[kind]}: ${name}`;
              return (
                <li key={card} className="flex shrink-0" data-testid="tenka-card" data-kind={kind} data-card={card} data-territory={territory ?? undefined}>
                  <span className="flex" role="img" aria-label={label}>
                    <DressedCardClient card={card} territory={territory} kind={kind} map={game.map ?? "world"} name={name} label={label} />
                  </span>
                </li>
              );
            })}
            <li className="flex shrink-0 flex-col items-center gap-0.5 text-xs text-muted" data-testid="tenka-deck" data-left={game.deck.length}>
              <span className="flex" role="img" aria-label={deckWords(game.deck.length)}>
                <DressedBackClient label={deckWords(game.deck.length)} />
              </span>
              <span aria-hidden="true">{deckWords(game.deck.length)}</span>
            </li>
          </ul>
          {sets.map((cards) => (
            <button
              key={cards.join("-")}
              type="button"
              className={`${BUTTON_BASE} ${mustTrade(game) ? BUTTON_STRONG : BUTTON_QUIET} justify-start`}
              onClick={() => onMove({ kind: TENKA_MOVES.trade, cards })}
              data-testid="tenka-trade"
            >
              {TENKA_COPY.trade(tradeValue(game.trades))}: {cards.map((card) => KIND_WORDS[cardKind(card, tenkaMapOf(game))]).join(", ")}
            </button>
          ))}
        </>
      )}
    </section>
  );
}
