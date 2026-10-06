"use client";

import { useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import type { HitotsuCard, HitotsuGame, HitotsuMove } from "@johnmorrisdotca/hitotsu";

import { HitotsuHand } from "./HitotsuHand";
import { callMatters, hitotsuPresses, movesFor, playableFor, quickMove } from "./hitotsuPresses";
import { hitotsuScreenWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/** A choice made on one move of the game, forgotten when the game moves on. */
type Held<T> = { at: number; value: T };

/**
 * ONE PLAYER'S HAND AND WHAT THEY MAY DO WITH IT, under the table: the cards,
 * lit where they go; "Hitotsu!" to call, when the next card leaves one; and
 * the presses the rules offer now. Tap a card to choose it and press, or tap
 * it again to play it where it has one way to go. At another player's turn,
 * a card that may jump in is lit, and Jump in plays it.
 *
 * The same at a table round one device and at a table on several
 * (`HitotsuOnline`): what a move does is the rules', and `onMove` sends it.
 */
export function HitotsuDesk({ game, seat, active, label, name, onMove }: { game: HitotsuGame; seat: number; active: boolean; label: string; name: (seat: number) => string; onMove: (move: HitotsuMove) => void }) {
  const say = useSpeaker();
  const HITOTSU_COPY = hitotsuScreenWords(say.locale);
  const moves = game.moves.length;
  const [held, setHeld] = useState<Held<HitotsuCard | null>>({ at: -1, value: null });
  const [calling, setCalling] = useState<Held<boolean>>({ at: -1, value: false });
  const chosen = held.at === moves ? held.value : null;
  const call = calling.at === moves && calling.value;
  const open = active && movesFor(game, seat).length > 0;
  const playable = open ? playableFor(game, seat) : [];
  const presses = open ? hitotsuPresses(game, seat, chosen, call, name, say) : [];
  const stuck = presses.find((press) => press.strong === true && press.move === null);
  const send = (move: HitotsuMove | null) => {
    if (move === null) return;
    setHeld({ at: -1, value: null });
    onMove(move);
  };
  const press = (card: HitotsuCard) => {
    if (!open) return;
    if (card === chosen) {
      const quick = quickMove(game, seat, card, call);
      if (quick !== null) return send(quick);
    }
    setHeld({ at: moves, value: card === chosen ? null : card });
  };
  const hand = game.hands[seat] ?? [];
  return (
    <div className="flex flex-col gap-2" data-testid="hitotsu-desk" data-seat={seat}>
      <p className="text-sm text-muted">
        {label} · {say.count("party.hitotsu.points", game.scores[seat] ?? 0)}
      </p>
      <HitotsuHand cards={hand} chosen={chosen} playable={playable} onPress={open ? press : undefined} label={label} />
      {open && callMatters(game, seat) ? (
        <button
          type="button"
          aria-pressed={call}
          onClick={() => setCalling({ at: moves, value: !call })}
          className={`${BUTTON_BASE} ${call ? BUTTON_STRONG : BUTTON_QUIET} min-h-11 self-start`}
          title={HITOTSU_COPY.callHelp}
          data-testid="hitotsu-call"
        >
          {call ? HITOTSU_COPY.called : HITOTSU_COPY.call}
        </button>
      ) : null}
      {presses.length === 0 ? null : (
        <div className="flex flex-wrap items-center gap-2" data-testid="hitotsu-actions">
          {presses.map((one) => (
            <button
              key={one.testId}
              type="button"
              className={`${BUTTON_BASE} ${one.strong === true ? BUTTON_STRONG : BUTTON_QUIET} min-h-11`}
              style={one.colour === undefined ? undefined : { borderColor: one.colour, boxShadow: `inset 0.4rem 0 0 ${one.colour}` }}
              disabled={one.move === null}
              onClick={() => send(one.move)}
              data-testid={one.testId}
            >
              {one.label}
            </button>
          ))}
          {stuck?.why === undefined ? null : <span className="text-xs text-muted">{stuck.why}</span>}
        </div>
      )}
    </div>
  );
}
