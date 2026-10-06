import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { TENKA_MOVES, TENKA_PHASES } from "@/lib/party/tenka/tenka.constants";
import type { TenkaCardKind, TenkaGame, TenkaMove } from "@/lib/party/tenka/tenka.types";
import { mustTrade } from "@/lib/party/tenka/tenka";
import { cardKind, cardTerritory, setsIn, tradeValue } from "@/lib/party/tenka/tenkaCards";
import { tenkaMapOf } from "@/lib/party/tenka/tenkaMap";

import { DressedBackClient, DressedCardClient } from "./TenkaDressedClient";
import { tenkaWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { territoryName } from "./tenkaWords";

const KIND_PHRASES = { land: "party.tenka.kindLand", sea: "party.tenka.kindSea", air: "party.tenka.kindAir", wild: "party.tenka.kindWild" } as const;

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
  const say = useSpeaker();
  const TENKA_COPY = tenkaWords(say.locale);
  const KIND_WORDS = (kind: TenkaCardKind) => say.say(KIND_PHRASES[kind]);
  const deckWords = (left: number) => say.say("party.tenka.deck", { count: String(left) });
  const hand = game.hands[seat] ?? [];
  const trading = mayTrade && seat === game.toPlay && game.phase === TENKA_PHASES.reinforce;
  const sets = trading ? setsIn(hand, tenkaMapOf(game)) : [];
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="tenka-hand" data-cards={handed ? hand.length : undefined}>
      <h2 className={SECTION_TITLE}>
        {TENKA_COPY.hand} {say.pairsWithKanji ? <span className="font-mincho normal-case tracking-normal">手札</span> : null}
      </h2>
      {!handed ? (
        <p className="text-sm text-muted">{say.say("party.tenka.handHidden", { cards: TENKA_COPY.cards(hand.length) })}</p>
      ) : hand.length === 0 ? (
        <p className="text-sm text-muted">{TENKA_COPY.noCards}</p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-1.5">
            {hand.map((card) => {
              const territory = cardTerritory(card, tenkaMapOf(game));
              const kind = cardKind(card, tenkaMapOf(game));
              const name = territory !== null ? territoryName(tenkaMapOf(game).territories[territory], say) : KIND_WORDS("wild");
              const label = say.say("party.tenka.cardLabel", { kind: KIND_WORDS(kind), name });
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
              {say.say("party.tenka.tradeKinds", { trade: TENKA_COPY.trade(tradeValue(game.trades)), kinds: cards.map((card) => KIND_WORDS(cardKind(card, tenkaMapOf(game)))).join(say.locale === "ja" ? "、" : ", ") })}
            </button>
          ))}
        </>
      )}
    </section>
  );
}
