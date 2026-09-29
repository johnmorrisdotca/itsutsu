import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { DOTS_STATUS, dotsPlayerName, drawsAgain } from "@/lib/party/dotsAndBoxes/dotsAndBoxes";
import type { DotsGame } from "@/lib/party/dotsAndBoxes/dotsAndBoxes.types";

import { MarbleChip } from "./MarbleChip";
import { DOTS_COPY, PARTY_MARBLES } from "./party.constants";

/**
 * WHOSE TURN IT IS, by name, colour and letter — and, when the line just drawn
 * closed a box, that the same player draws again, which is the one rule of
 * this game a table forgets. At the end, who won, and by how many boxes: one
 * winner, or everybody level on the most sharing it.
 */
export function DotsTurnLine({ game }: { game: DotsGame }) {
  if (game.status === DOTS_STATUS.finished) {
    const names = game.winners.map((seat) => dotsPlayerName(game, seat));
    const most = DOTS_COPY.boxes(game.scores[game.winners[0]]);
    return (
      <p className={`${PANEL_CLASS} flex flex-wrap items-center gap-2 text-base font-semibold`} data-testid="dots-winner" data-winners={game.winners.join(",")} aria-live="polite">
        {game.winners.map((seat) => (
          <MarbleChip key={seat} player={seat} />
        ))}
        <span>
          {names.length === 1
            ? `${names[0]} wins, with ${most}.`
            : `${names.slice(0, -1).join(", ")} and ${names.at(-1)} share the win, with ${most} each.`}
        </span>
      </p>
    );
  }
  const marble = PARTY_MARBLES[game.toPlay];
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
            {dotsPlayerName(game, game.toPlay)}
          </span>
          <span className="text-muted">
            {"’s turn"} · {marble.label} ({marble.letter})
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
