"use client";

import Link from "@/components/ui/Link";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { STAT_CHIP, STAT_LINK } from "@/components/games/games.constants";
import { levelsOf } from "@/lib/houseki/houseki.constants";
import type { HousekiKind } from "@/lib/houseki/houseki.types";
import { setUpPath } from "@/lib/gomoku/slugs";

/**
 * The line under a Houseki game where a game shows its played-figures.
 *
 * A Houseki game is played alone and kept in the browser it is played in, so
 * there is no record of games, no last match and no top player to show here
 * (its points are on its own page, one query where it is read, never one per
 * card). This says what it is instead, and offers the way in: a member to the
 * set-up, a stranger to the door. `raised` above the card's stretched face, like
 * every other link on a card.
 */
export function HousekiLine({ kind, signedIn }: { kind: HousekiKind; signedIn: boolean }) {
  const say = useSpeaker();
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs" data-testid="houseki-line" data-variant={kind}>
      <span className={`${STAT_CHIP} text-muted`}>{say.say("houseki.line.summary", { levels: say.number(levelsOf(kind)) })}</span>
      {signedIn ? (
        <Link href={setUpPath(kind)} className={STAT_LINK} data-testid="houseki-line-play">
          {say.say("catalogue.play")}
        </Link>
      ) : (
        <Link href="/join" className={STAT_LINK} data-testid="houseki-line-join">
          {say.say("houseki.line.join")}
        </Link>
      )}
    </div>
  );
}
