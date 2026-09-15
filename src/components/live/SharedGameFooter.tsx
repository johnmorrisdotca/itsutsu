import { ResignButton } from "@/components/mine/ResignButton";
import { LocalTime } from "@/components/ui/LocalTime";
import { otherStone } from "@/lib/gomoku/engine";
import { GAME_STATUS, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { shownName } from "@/lib/rating/shownName";

import { ReactionBar } from "./Reactions";
import { writeQuiet } from "./quiet";
import type { SharedGameFooterProps } from "./sharedGame.types";

/**
 * EVERYTHING UNDER A SHARED BOARD: giving up, a wave across it, muting the
 * other side, and who is sitting there.
 *
 * Split out of `SharedGame.tsx` when it reached the file-size gate. These four
 * are the board's conversation with the person opposite rather than the board
 * itself, and each keeps the comment that explains when it is offered.
 */
export function SharedGameFooter({
  detail,
  state,
  seat,
  token,
  offer,
  ignoring,
  quiet,
  gameId,
  opponent,
  onReact,
  onAsking,
  mutate,
}: SharedGameFooterProps) {
  return (
    <>
      {/*
        An empty board can be called off even where resigning is refused — but
        an OFFER is neither resigned nor called off. It is withdrawn, which is a
        different door on the server (`cancelGame` refuses an offer outright, so
        this would be a button that does nothing) and a different word: there is
        no game here to give up, only a question to take back. The control for
        that is in the offer panel beside the board.
      */}
      {offer === null &&
      seat !== null &&
      (detail.allowResign || state.moves.length === 0) &&
      state.status === GAME_STATUS.playing ? (
        <div className="flex justify-end">
          <ResignButton
            id={detail.id}
            token={token}
            moves={state.moves.length}
            onDone={() => void mutate()}
            /*
              No refresh of its own here: the board hands itself back the
              moment it reads the game as over (`useMatchAddress`), and a
              second hand-back from the button went to the address the router
              had stopped agreeing with, and reloaded the page.
            */
            refreshAfter={false}
            /*
              NOTHING MOVES WHILE THIS IS ASKING. A move carries a player to
              their next waiting game a moment after it lands, and somebody who
              plays a stone and reaches straight for Resign opened this question
              inside that moment — then watched the board and the question go
              together. Waved away, the held advance goes ahead; answered, it is
              dropped, because a game that has just ended is the board to be
              looking at.
            */
            onAsking={onAsking}
          />
        </div>
      ) : null}

      {/*
        Nothing to say across a board nobody has agreed to sit at. The offeree
        holds no token and could not send one anyway; the offerer would be
        waving at somebody who has not answered the question yet.
      */}
      {offer === null && seat !== null && token !== null ? (
        <ReactionBar
          lastMove={state.moves.length > 0 ? state.moves.length : null}
          disabled={false}
          onSend={onReact}
        />
      ) : null}
      {/*
        Nothing to mute by hand when they are already ignored outright. Read
        from the ignore list rather than from `silenced`, which also holds the
        result of this very checkbox — testing that would make the box vanish
        the moment it was ticked.
      */}
      {seat !== null && !ignoring.includes(otherStone(seat)) ? (
        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={quiet}
            onChange={(event) => writeQuiet(gameId, event.target.checked)}
            className="size-3.5 accent-ink"
            data-testid="mute-game"
          />
          Mute this opponent&apos;s messages in this game
        </label>
      ) : null}
      {opponent !== null && seat !== null ? (
        <p className="text-xs text-muted" data-testid="opponent-line">
          You are playing {STONE_DISPLAY[seat].label.toLowerCase()} against{" "}
          <span className="font-medium text-ink">{shownName(opponent.name)}</span>
          {opponent.country !== "" ? ` from ${opponent.country}` : ""}.
          {opponent.awayUntil ? (
            <>
              {" "}Away until <LocalTime at={opponent.awayUntil} style="date" />; their deadline waits.
            </>
          ) : null}
        </p>
      ) : null}
    </>
  );
}
