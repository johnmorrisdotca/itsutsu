"use client";

import { GameName } from "@/components/games/GameName";
import { PartyTableCard } from "@/components/party/PartyTableCard";

import { passAndPlayPath } from "@/lib/gomoku/slugs";
import { gunjinBoardOf } from "@/lib/party/gunjin/gunjin.constants";
import { gunjinOver, gunjinToPlay } from "@/lib/party/gunjin/gunjin";
import { PARTY_KINDS } from "@/lib/party/party.constants";
import { partyPlayerName } from "@/lib/party/partyNames";

import { useKeptGunjin } from "./gunjinStore";
import { gunjinBoardWords, gunjinWords, partyScreenWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * A GAME OF GUNJIN, WAITING IN MY GAMES. "Anything a person plays is kept
 * until it is finished, and waits in My games" (AGENTS.md): it is kept in
 * this browser, so it is listed from this browser, on the Pass and play tab
 * beside the other tables' games. Only while it is not finished. It names
 * whose turn it is and nothing of the board, which is nobody else's to see.
 */
export function GunjinCard() {
  const say = useSpeaker();
  const GUNJIN_COPY = gunjinWords(say.locale);
  const PARTY_COPY = partyScreenWords(say.locale);
  const [game] = useKeptGunjin();
  if (game === undefined || game === null || gunjinOver(game)) return null;
  const variant = PARTY_KINDS.gunjin;
  const to = gunjinToPlay(game);
  return (
    <PartyTableCard thumb={variant} heading={GUNJIN_COPY.card} href={passAndPlayPath(variant)} resume={PARTY_COPY.resume} dataVariant={variant}>
      <GameName variant={variant} /> · {gunjinBoardOf(game.size) === null ? "" : gunjinBoardWords(say.locale)[game.size]?.name}
      {to === null ? "" : ` · ${say.say("party.toPlay", { name: partyPlayerName(game, to, say) })}`}
    </PartyTableCard>
  );
}
