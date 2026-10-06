"use client";

import { GAME_ENDING_COPY } from "@/components/play/gameEnding.constants";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS } from "@/components/ui/ui.constants";
import { GUNJIN_REASONS } from "@/lib/party/gunjin/gunjin.constants";
import { gunjinDrawOfferedBy, gunjinDrawOfferedTo } from "@/lib/party/gunjin/gunjin";
import type { GunjinGame } from "@/lib/party/gunjin/gunjin.types";
import { gunjinWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";


/**
 * OFFERING A DRAW, and answering one: the two things beside Resign that end a
 * game of Gunjin without a capture (the package's `offerDraw`, `acceptDraw`
 * and `declineDraw`). The side to move offers, after a question; the other
 * side answers on its own turn, once the board is its own to see again
 * (`GunjinDrawAnswer`), and a move of its own is a refusal too.
 *
 * The press is offered only where the engine would take it: while the game is
 * being played (never arranging, never on the cover between turns) and with no
 * offer of the other side's waiting to be answered first.
 */
export function GunjinDrawOffer({ game, names, onOffer }: { game: GunjinGame; names: readonly string[]; onOffer: () => void }) {
  const say = useSpeaker();
  const GUNJIN_COPY = gunjinWords(say.locale);
  const { match } = game;
  if (match.phase !== "play" || gunjinDrawOfferedTo(game) !== null) return null;
  const seat = match.currentPlayer;
  return (
    <ConfirmButton
      label={GUNJIN_COPY.offerDraw}
      question={GUNJIN_COPY.offerDrawAsk(names[seat]!, names[1 - seat]!)}
      confirm={GUNJIN_COPY.offerDrawYes}
      cancel={GAME_ENDING_COPY.keepPlaying}
      onConfirm={onOffer}
      className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
      testId="gunjin-draw-offer"
    />
  );
}

/**
 * THE ANSWER TO A DRAW that was offered, for the side it was offered to, on
 * its own turn: accept it and the game ends level; decline it, and the turn
 * is the side's again. Nothing for anybody else, and nothing while the offer
 * is on its way (the device is on the cover).
 */
export function GunjinDrawAnswer({ game, names, onAccept, onDecline }: { game: GunjinGame; names: readonly string[]; onAccept: () => void; onDecline: () => void }) {
  const say = useSpeaker();
  const GUNJIN_COPY = gunjinWords(say.locale);
  const to = gunjinDrawOfferedTo(game);
  const by = gunjinDrawOfferedBy(game);
  if (to === null || by === null) return null;
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="gunjin-draw-answer">
      <p className="text-sm font-semibold">{GUNJIN_COPY.drawAsk(names[by]!)}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG}`} onClick={onAccept} data-testid="gunjin-draw-accept">
          {GUNJIN_COPY.drawAccept}
        </button>
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={onDecline} data-testid="gunjin-draw-decline">
          {GUNJIN_COPY.drawDecline}
        </button>
      </div>
    </div>
  );
}

/** What the side that offered a draw is told while it waits at its own device: the answer is the other side's. */
export function GunjinDrawWaiting({ game, names, seat }: { game: GunjinGame; names: readonly string[]; seat: number }) {
  const say = useSpeaker();
  const GUNJIN_COPY = gunjinWords(say.locale);
  if (game.match.phase !== "play" || gunjinDrawOfferedBy(game) !== seat) return null;
  return (
    <p className="text-sm font-semibold" data-testid="gunjin-draw-waiting" aria-live="polite">
      {GUNJIN_COPY.drawWaiting(names[1 - seat]!)}
    </p>
  );
}

/**
 * HOW A FINISHED GAME ENDED, in one line, from the engine's own result: who
 * resigned and who won, that it was drawn and why, or who won and why. For a
 * table on two devices, whose cover is for a winner alone and which has no
 * resignation mark of its own (a draw is no winner, and says nothing else).
 */
export function GunjinResult({ game, names }: { game: GunjinGame; names: readonly string[] }) {
  const say = useSpeaker();
  const GUNJIN_COPY = gunjinWords(say.locale);
  const result = game.match.result;
  if (game.match.phase !== "finished" || result === undefined) return null;
  const winner = result.winner;
  const reason = GUNJIN_REASONS[result.reason] ?? result.reason;
  const line =
    winner === null || winner === undefined
      ? GUNJIN_COPY.drawn(reason)
      : result.reason === "resigned"
        ? GAME_ENDING_COPY.resignedResult(names[1 - winner]!, [names[winner]!])
        : GUNJIN_COPY.wins(names[winner]!, reason);
  return (
    <p className="text-sm font-semibold" data-testid="gunjin-result" data-drawn={winner === null ? "true" : undefined} aria-live="polite">
      {line}
    </p>
  );
}
