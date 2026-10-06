"use client";

import Link from "@/components/ui/Link";

import { STAT_CHIP, STAT_LINK } from "@/components/games/games.constants";
import { passAndPlayPath } from "@/lib/gomoku/slugs";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { partyPlayersWords } from "@/lib/party/partyRulesPage";
import type { PartyKind } from "@/lib/party/party.types";

/**
 * The line under a party game where a game shows its played-figures.
 *
 * A party game is played round one device and kept only in that browser, so
 * there are no games played to count, no last match and no top player — a
 * strip saying "nobody has played this yet" would be a count nobody could
 * ever make. This says what it is instead, and offers the way to the table:
 * a member straight to it, a stranger to the door. `raised` above the card's
 * stretched face, like every other link on a card.
 */
export function PartyLine({ kind, signedIn }: { kind: PartyKind; signedIn: boolean }) {
  const say = useSpeaker();
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs" data-testid="party-line" data-variant={kind}>
      <span className={`${STAT_CHIP} text-muted`}>{say.say("party.front.chip", { players: partyPlayersWords(kind, say) })}</span>
      {signedIn ? (
        <Link href={passAndPlayPath(kind)} className={STAT_LINK} data-testid="party-line-play">
          {say.say("party.play")}
        </Link>
      ) : (
        <Link href="/join" className={STAT_LINK} data-testid="party-line-join">
          {say.say("party.joinToPlay")}
        </Link>
      )}
    </div>
  );
}
