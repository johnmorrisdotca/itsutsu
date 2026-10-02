import { PlayButton } from "@/components/games/PlayButton";
import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";
import { GAME_ENDING_COPY } from "@/components/play/gameEnding.constants";
import Link from "@/components/ui/Link";
import { currentMemberId } from "@/lib/auth/currentSession";
import { gameCopyOf } from "@/lib/catalogue/gameKeys";
import { matchPath, setUpPath } from "@/lib/gomoku/slugs";
import { goingAt } from "@/lib/history/goingAt";

/**
 * THE BIG BUTTON UNDER A GAME'S PICTURE: Play, or Continue where the member
 * already has a game of it going, with a New game under it that says the one
 * in progress stays where it is (`GameInProgressOffer`, the same for every
 * game, as a puzzle's door has it).
 *
 * John, 2026-10-02: every game with one in progress offers Continue and New
 * game, not a lone Play. A game between members is kept on the server and
 * waits in My games, so New game is a plain link to the set-up screen, and the
 * others the member has at this game are named in a quiet line that leads to
 * My games. Read at request time in its own Suspense section with the plain
 * Play as its fallback, so the page's shell stays prerendered and a stranger,
 * or a member with nothing going, costs no more than one session read and
 * sees Play exactly as before. A signed-in view costs `goingAt`'s one read.
 */
export async function GamePlayOrContinue({ variant }: { variant: string }) {
  const memberId = await currentMemberId();
  const going = memberId === null ? null : await goingAt(memberId, variant);
  if (going === null) return <PlayButton href={setUpPath(variant)} />;
  const label = gameCopyOf(variant)?.label ?? variant;
  return (
    <>
      <GameInProgressOffer
        href={matchPath(variant, going.id)}
        going
        newGame={{ keeps: setUpPath(variant) }}
        testId="game-offer"
        mainTestId="game-resume"
      />
      {going.others > 0 ? (
        <p className="text-center text-xs text-muted" data-testid="game-others" data-count={going.others}>
          <Link href="/play" className="underline underline-offset-4">
            {GAME_ENDING_COPY.othersGoing(going.others, going.more, label)}
          </Link>
        </p>
      ) : null}
    </>
  );
}
