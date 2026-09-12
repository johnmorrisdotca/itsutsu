"use client";

import { discCount } from "@/lib/gomoku/engine";
import { STONE_DISPLAY, WIN_REASONS } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import type { replayGame } from "@/lib/gomoku/replay";
import { TONE_CLASS } from "@/components/ui/ui.constants";

/**
 * The one line above the board that says where the game stands: your move,
 * their move, watching, or how it ended.
 *
 * Lifted out of SharedGame when that file went past the size gate. It is the
 * whole of how a result is put into words — every way a game here can end,
 * from a resignation to a full camp to a board nobody can move on — and that
 * is a job of its own, kept in one place so a new way to win has one place to
 * be described.
 */
export function TurnBanner({
  state,
  seat,
  yourTurn,
  finished,
  awaiting = false,
  offer = null,
  finishedAt = null,
}: {
  state: ReturnType<typeof replayGame>;
  seat: Stone | null;
  yourTurn: boolean;
  finished: boolean;
  /** Posted for anyone, and nobody has answered it yet. */
  awaiting?: boolean;
  /**
   * Offered to one named person who has yet to answer, and which side of it
   * this reader is on — null for an ordinary game.
   *
   * Two sentences rather than one, because the two people are waiting on
   * opposite things. The one who was asked has a decision to make; the one who
   * asked has nothing to do but wait, or take it back.
   */
  offer?: { side: "to-me" | "from-me"; who: string } | null;
  /** When the last move landed, once the game is over; shown so nobody has to go to the record for it. */
  finishedAt?: string | null;
}) {
  if (finished) {
    const won = state.winner;
    return (
      <p className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${TONE_CLASS.great}`} data-testid="turn-banner">
        {won === null
          ? "Draw. The board is full."
          : state.winBy === WIN_REASONS.resign
            ? `${STONE_DISPLAY[won].label} wins by resignation.`
            : state.winBy === null
              ? `${STONE_DISPLAY[won].label} wins. The game is over.`
            : state.winBy === WIN_REASONS.count
              ? `${STONE_DISPLAY[won].label} wins on discs, ${discCount(state.board).black} to ${discCount(state.board).white}.`
              : state.winBy === WIN_REASONS.camp
                ? `${STONE_DISPLAY[won].label} wins: the far camp is full.`
                : state.winBy === WIN_REASONS.connection
                  ? `${STONE_DISPLAY[won].label} wins: their two sides are joined.`
                : state.winBy === WIN_REASONS.blocked
                  ? `${STONE_DISPLAY[won].label} wins: the other side has no move left.`
                : `${STONE_DISPLAY[won].label} wins in ${state.moves.length} moves.`}
        {finishedAt !== null ? (
          <span className="block text-xs font-normal opacity-80" data-testid="finished-at">
            Finished {new Date(finishedAt).toLocaleString()}
          </span>
        ) : null}
      </p>
    );
  }

  /*
   * A seat posted for anyone, before anybody has answered it.
   *
   * This said "Your move — you are Black", which is true and is not what is
   * happening: John posted a seat meaning to wait, and got something that
   * read as a game already under way against an opponent who did not exist.
   * The board stays playable, because opening before your opponent arrives is
   * how the elder turn-based sites worked and is a thing somebody may want to
   * do — but it is offered rather than announced, and the sentence says what
   * the game is actually doing.
   */
  /*
   * A GAME PROPOSED TO SOMEBODY, BEFORE THEY HAVE ANSWERED.
   *
   * Before the seat tests below, and before `awaiting`, because it is the
   * strongest thing true of this board: nothing about whose turn it is means
   * anything until the question is answered. Without it a fork offer — which
   * carries moves across, so the position has a colour to move — drew "Your
   * move — you are Black" at somebody who had never agreed to play, and
   * "Waiting for White…" at the person who was still waiting to be answered.
   *
   * The board underneath stays drawn and unplayable, which is the point of
   * showing it at all: an offer is a position you look at before deciding.
   */
  if (offer !== null) {
    return (
      <p
        className={`rounded-xl border px-3 py-2.5 text-sm ${offer.side === "to-me" ? TONE_CLASS.good : TONE_CLASS.calm}`}
        data-testid="turn-banner"
        data-offer={offer.side}
      >
        {offer.side === "to-me" ? (
          <>
            <span className="font-semibold">{offer.who} has offered you this game 申込.</span>{" "}
            Look at the board, then accept or decline. Declining costs you nothing — no result, no
            rating, and nothing on your record.
          </>
        ) : (
          <>
            <span className="font-semibold">Offered to {offer.who} 申込済.</span> Nothing starts until
            they accept, and no clock is running. You can withdraw it at any time.
          </>
        )}
      </p>
    );
  }

  if (awaiting && seat !== null) {
    return (
      <p
        className={`rounded-xl border px-3 py-2.5 text-sm ${TONE_CLASS.calm}`}
        data-testid="turn-banner"
        data-awaiting="true"
      >
        <span className="font-semibold">Posted, and waiting for somebody 募集中.</span>{" "}
        Your seat link is below — send it to somebody, or leave it on the board and you will be
        told when it is taken. You may play your first move now if you would rather.
      </p>
    );
  }

  if (seat === null) {
    return (
      <p className={`rounded-xl border px-3 py-2.5 text-sm ${TONE_CLASS.calm}`}>
        You are watching. {STONE_DISPLAY[state.toPlay].label} to play.
      </p>
    );
  }

  return (
    <p
      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
        yourTurn ? TONE_CLASS.good : TONE_CLASS.calm
      }`}
      data-testid="turn-banner"
    >
      {yourTurn
        ? `Your move — you are ${STONE_DISPLAY[seat].label}.`
        : `Waiting for ${STONE_DISPLAY[state.toPlay].label}…`}
    </p>
  );
}
