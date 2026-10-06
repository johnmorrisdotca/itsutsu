"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { SectionTitle } from "@/components/ui/Controls";
import { forkOffered } from "@/lib/history/fork";

/**
 * ADVANCED, FOLDED, AT THE BOTTOM OF A FINISHED GAME. John, 2026-09-25: "Play
 * from Move 5 button - not sure what it does - might not work well - needs
 * some more testing and might be Advanced Options perhaps at the bottom?"
 *
 * It was a loud button under the scrubber that appeared the moment a reader
 * stepped back, saying only a move number. It is here now, folded, and says
 * what it does: a NEW game from the position on the board, against the same
 * player, each keeping their colour, set up on the set-up screen first. At
 * the end of the game, where there is no earlier position to carry, it says
 * how to get one: step back to the move to play on from.
 *
 * Only for somebody who played the game (`forkOffered`): a spectator's fork
 * would bind a new game to a player who was never asked. `e2e/fork-play.spec.ts`
 * follows it from here into the game it makes.
 */
export function ReplayAdvanced({ gameId, variant, move, last, seated }: { gameId: string; variant: string; move: number; last: number; seated: boolean }) {
  const say = useSpeaker();
  if (!seated) return null;
  const offered = forkOffered({ move, last, seated });
  return (
    <details className="group flex flex-col gap-2" data-testid="replay-advanced">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
        <SectionTitle kanji="詳細">{say.say("replay.advanced")}</SectionTitle>
        <span className="text-xs text-muted">
          <span className="group-open:hidden">{say.say("replay.show")}</span>
          <span className="hidden group-open:inline">{say.say("replay.hide")}</span>
        </span>
      </summary>
      <div className="mt-2 flex flex-col items-start gap-2">
        {offered ? (
          <>
            <p className="text-xs text-muted" data-testid="replay-advanced-says">
              {say.say("replay.forkSays", { move: String(move) })}
            </p>
            <ChallengeButton from={{ id: gameId, move }} variant={variant} label={`${say.say("replay.forkLabel", { move: String(move) })}${say.pairsWithKanji ? " 分岐" : ""}`} />
          </>
        ) : (
          <p className="text-xs text-muted" data-testid="replay-advanced-hint">
            {say.say("replay.forkHint")}
          </p>
        )}
      </div>
    </details>
  );
}
