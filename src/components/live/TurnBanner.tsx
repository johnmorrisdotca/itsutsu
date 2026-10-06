"use client";

import { discCount } from "@/lib/gomoku/engine";
import { WIN_REASONS } from "@/lib/gomoku/gomoku.constants";
import { stoneName } from "@/lib/gomoku/seatWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { weave } from "@/lib/i18n/weave";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import type { replayGame } from "@/lib/gomoku/replay";
import { endedWithNoMoves } from "@/lib/gomoku/rules/forcedPass";
import { gameCopy } from "@/components/game/game.constants";
import { passedTurnWords } from "@/components/game/passedTurn";
import { LocalTime } from "@/components/ui/LocalTime";
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
  const say = useSpeaker();
  const GAME_COPY = gameCopy(say);
  if (finished) {
    const won = state.winner;
    const colour = won === null ? "" : stoneName(say, won);
    return (
      <p className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${TONE_CLASS.great}`} data-testid="turn-banner">
        {won === null
          ? endedWithNoMoves(state)
            ? GAME_COPY.drawNoMoves
            : say.say("game.drawFull")
          : state.winBy === WIN_REASONS.resign
            ? say.say("live.winsResign", { colour })
            : state.winBy === null
              ? say.say("live.winsOver", { colour })
            : state.winBy === WIN_REASONS.count
              ? say.say("live.winsDiscs", { colour, black: String(discCount(state.board).black), white: String(discCount(state.board).white) })
              : state.winBy === WIN_REASONS.camp
                ? say.say("live.winsCamp", { colour })
                : state.winBy === WIN_REASONS.connection
                  ? say.say("live.winsConnection", { colour })
                : state.winBy === WIN_REASONS.blocked
                  ? say.say("live.winsBlocked", { colour })
                : say.say("live.winsIn", { colour, moves: say.count("count.move", state.moves.length) })}
        {finishedAt !== null ? (
          <span className="block text-xs font-normal opacity-80" data-testid="finished-at">
            {weave(say.say("live.finished"), { when: <LocalTime at={finishedAt} /> })}
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
            <span className="font-semibold">
              {say.say("live.offerToMeBold", { who: offer.who })}
              {say.pairsWithKanji ? " 申込" : ""}.
            </span>{" "}
            {say.say("live.offerToMeRest")}
          </>
        ) : (
          <>
            <span className="font-semibold">
              {say.say("live.offerFromMeBold", { who: offer.who })}
              {say.pairsWithKanji ? " 申込済" : ""}.
            </span>{" "}
            {say.say("live.offerFromMeRest")}
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
        <span className="font-semibold">
          {say.say("live.awaitingBold")}
          {say.pairsWithKanji ? " 募集中" : ""}.
        </span>{" "}
        {say.say("live.awaitingRest")}
      </p>
    );
  }

  if (seat === null) {
    return (
      <p className={`rounded-xl border px-3 py-2.5 text-sm ${TONE_CLASS.calm}`}>
        {say.say("live.watching", { colour: stoneName(say, state.toPlay) })}
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
        ? say.say("live.yourMove", { colour: stoneName(say, seat) })
        : say.say("live.waitingFor", { colour: stoneName(say, state.toPlay) })}
      {/* A turn that passed itself is said on both boards, so neither player is left wondering where it went. */}
      {passedTurnWords(state, seat, say) !== null ? (
        <span className="block text-xs font-normal" data-testid="turn-passed">
          {passedTurnWords(state, seat, say)}
        </span>
      ) : null}
    </p>
  );
}
