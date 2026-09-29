import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { TENKA_MOVES, TENKA_PHASES } from "@/lib/party/tenka/tenka.constants";
import type { TenkaCardKind, TenkaGame, TenkaMove } from "@/lib/party/tenka/tenka.types";
import { mustTrade } from "@/lib/party/tenka/tenka";
import { cardKind, cardTerritory, setsIn, tradeValue } from "@/lib/party/tenka/tenkaCards";
import { TENKA_TERRITORIES } from "@/lib/party/tenka/tenkaMap";

import { TENKA_COPY } from "./tenka.constants";

/** A card's kind as a picture: a hill for land, waves for sea, wings for air, a star for a wild card. */
const KIND_PATHS: Record<TenkaCardKind, string> = {
  land: "M2 17 L9 6 L13 12 L16 9 L22 17 Z",
  sea: "M2 9 q2.5 -3 5 0 t5 0 t5 0 t5 0 M2 15 q2.5 -3 5 0 t5 0 t5 0 t5 0",
  air: "M12 3 L14 10 L22 13 L14 14 L13 20 L16 22 L8 22 L11 20 L10 14 L2 13 L10 10 Z",
  wild: "M12 2 L14.6 8.6 L21.6 9 L16.2 13.4 L18 20.2 L12 16.4 L6 20.2 L7.8 13.4 L2.4 9 L9.4 8.6 Z",
};

const KIND_WORDS: Record<TenkaCardKind, string> = { land: "Land", sea: "Sea", air: "Air", wild: "Wild" };

function KindMark({ kind }: { kind: TenkaCardKind }) {
  const filled = kind !== "sea";
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true">
      <path d={KIND_PATHS[kind]} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 1.8} strokeLinecap="round" />
    </svg>
  );
}

/**
 * THE CARDS IN THE HAND OF THE PLAYER TO MOVE, each with its kind and the
 * territory it shows, and every set they make with what it trades for now —
 * shown only once the device has been passed to them (`handed`), and only
 * while trading could matter: at the start of their turn.
 */
export function TenkaHand({ game, handed, onMove }: { game: TenkaGame; handed: boolean; onMove: (move: TenkaMove) => void }) {
  const hand = game.hands[game.toPlay];
  const trading = game.phase === TENKA_PHASES.reinforce;
  const sets = trading ? setsIn(hand) : [];
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
              const territory = cardTerritory(card);
              const kind = cardKind(card);
              return (
                <li key={card} className="flex min-w-0 items-center gap-1.5 rounded-lg border border-rule-strong bg-paper px-2 py-1 text-xs" data-testid="tenka-card" data-kind={kind}>
                  <KindMark kind={kind} />
                  <span className="font-semibold">{KIND_WORDS[kind]}</span>
                  {territory !== null ? <span className="truncate text-muted">{TENKA_TERRITORIES[territory].name}</span> : null}
                </li>
              );
            })}
          </ul>
          {sets.map((cards) => (
            <button
              key={cards.join("-")}
              type="button"
              className={`${BUTTON_BASE} ${mustTrade(game) ? BUTTON_STRONG : BUTTON_QUIET} justify-start`}
              onClick={() => onMove({ kind: TENKA_MOVES.trade, cards })}
              data-testid="tenka-trade"
            >
              {TENKA_COPY.trade(tradeValue(game.trades))}: {cards.map((card) => KIND_WORDS[cardKind(card)]).join(", ")}
            </button>
          ))}
        </>
      )}
    </section>
  );
}
