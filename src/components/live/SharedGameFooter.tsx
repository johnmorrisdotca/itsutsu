import { ResignButton } from "@/components/mine/ResignButton";
import { GameEnding, NewGameLink } from "@/components/play/GameEnding";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { LocalTime } from "@/components/ui/LocalTime";
import { otherStone } from "@/lib/gomoku/engine";
import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import { stoneName } from "@/lib/gomoku/seatWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { weave } from "@/lib/i18n/weave";
import { setUpPath } from "@/lib/gomoku/slugs";
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
  const say = useSpeaker();
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
      {offer === null && seat !== null && state.status === GAME_STATUS.playing ? (
        <div className="flex justify-end">
          <GameEnding>
            {detail.allowResign || state.moves.length === 0 ? (
              <ResignButton
                id={detail.id}
                token={token}
                moves={state.moves.length}
                onDone={() => void mutate()}
                /*
                  No refresh of its own here: the board hands itself back the
                  moment it reads the game as over (`useMatchAddress`), and a
                  second hand-back from the button went to the address the
                  router had stopped agreeing with, and reloaded the page.
                */
                refreshAfter={false}
                /*
                  NOTHING MOVES WHILE THIS IS ASKING. A move carries a player to
                  their next waiting game a moment after it lands, and somebody
                  who plays a stone and reaches straight for Resign opened this
                  question inside that moment — then watched the board and the
                  question go together. Waved away, the held advance goes ahead;
                  answered, it is dropped, because a game that has just ended is
                  the board to be looking at.
                */
                onAsking={onAsking}
                className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
              />
            ) : null}
            {/* A game between members is kept where it is (My games), so New game asks nothing: it leaves this one going. */}
            <NewGameLink href={setUpPath(state.settings.variant)} testId="live-new-game" />
          </GameEnding>
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
          {say.say("live.mute")}
        </label>
      ) : null}
      {opponent !== null && seat !== null ? (
        <p className="text-xs text-muted" data-testid="opponent-line">
          {weave(
            say.say(opponent.country !== "" ? "live.playingAgainstFrom" : "live.playingAgainst", {
              colour: stoneName(say, seat).toLowerCase(),
              country: opponent.country,
            }),
            { name: <span className="font-medium text-ink">{shownName(opponent.name)}</span> },
          )}
          {opponent.awayUntil ? (
            <>
              {say.sentences(["", ""])}
              {weave(say.say("live.awayUntil"), { when: <LocalTime at={opponent.awayUntil} style="date" /> })}
            </>
          ) : null}
        </p>
      ) : null}
    </>
  );
}
