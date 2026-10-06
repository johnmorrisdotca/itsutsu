"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { ResignedResult } from "@/components/play/ResignedResult";
import { resignedBy } from "@/lib/party/resign";
import { usePartyMarbles } from "./partyMarbles";
import { ResultMark } from "@/components/game/ResultMark";
import { RESULT_MARKS } from "@/components/game/resultMark.constants";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { DOTS_STATUS, dotsPlayerName, drawsAgain } from "@/lib/party/dotsAndBoxes/dotsAndBoxes";
import type { DotsGame } from "@/lib/party/dotsAndBoxes/dotsAndBoxes.types";

import { MarbleChip } from "./MarbleChip";
import { dotsWords, marbleLabel } from "./partyWords";

/**
 * WHOSE TURN IT IS, by name, colour and letter — and, when the line just drawn
 * closed a box, that the same player draws again, which is the one rule of
 * this game a table forgets. At the end, who won, and by how many boxes: one
 * winner, or everybody level on the most sharing it.
 */
export function DotsTurnLine({ game }: { game: DotsGame }) {
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  const say = useSpeaker();
  const DOTS_COPY = dotsWords(say.locale);
  if (resignedBy(game) !== null) return <ResignedResult game={game} seats={game.players.length} nameOf={(seat) => dotsPlayerName(game, seat, say)} />;
  if (game.status === DOTS_STATUS.finished) {
    const names = game.winners.map((seat) => dotsPlayerName(game, seat, say));
    const most = DOTS_COPY.boxes(game.scores[game.winners[0]]);
    return (
      <p className={`${PANEL_CLASS} flex flex-wrap items-center gap-2 text-base font-semibold`} data-testid="dots-winner" data-winners={game.winners.join(",")} aria-live="polite">
        <ResultMark kind={RESULT_MARKS.success} />
        {game.winners.map((seat) => (
          <MarbleChip key={seat} player={seat} />
        ))}
        <span>
          {names.length === 1 ? say.say("party.dots.wins", { name: names[0], boxes: most }) : say.say("party.dots.share", { names: say.list(names), boxes: most })}
        </span>
      </p>
    );
  }
  const marble = marbles[game.toPlay];
  const again = drawsAgain(game);
  return (
    <p
      className={`${PANEL_CLASS} flex items-center gap-2 text-base`}
      data-testid="dots-turn"
      data-player={game.toPlay}
      data-again={again ? "true" : undefined}
      aria-live="polite"
    >
      <MarbleChip player={game.toPlay} />
      <span className="flex min-w-0 flex-col">
        <span>
          <span className="font-semibold" data-testid="dots-turn-name">
            {dotsPlayerName(game, game.toPlay, say)}
          </span>
          <span className="text-muted">
            {say.say("party.turnSuffix")} · {say.say("party.turnTrail", { colour: marbleLabel(marble, say.locale), letter: marble.letter })}
          </span>
        </span>
        {/* Always in its place, hidden when there is nothing to say, so the board never moves under a finger. */}
        <span
          className={`text-sm font-semibold ${again ? "" : "invisible"}`}
          data-testid={again ? "dots-extra-turn" : undefined}
          aria-hidden={again ? undefined : true}
        >
          {DOTS_COPY.closed(again ? game.lastClosed.length : 1)}
        </span>
      </span>
    </p>
  );
}
