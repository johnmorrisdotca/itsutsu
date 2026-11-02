"use client";

import { GoingCard } from "./GoingCard";
import { Paired } from "@/components/i18n/Paired";

import { GameName } from "@/components/games/GameName";

import { partyAddress } from "@/components/puzzles/KumimojiPartyScreens";
import { useKeptParty } from "@/components/puzzles/kumimojiPartyKept";
import { nameOf } from "@/lib/puzzles/kumimoji/party";

import { weave } from "@/lib/i18n/weave";
import { myGamesCopy } from "./mine.copy";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * THE PASS-AND-PLAY KUMIMOJI KEPT IN THIS BROWSER, beside the hot-seat board
 * (`LocalGameCard`). AGENTS.md: "Anything a person plays is kept until it is
 * finished, and waits in My games" — a game round one device has no seat on
 * the server, so it waits here, read from the browser, until it is finished.
 */
export function LocalPartyCard() {
  const say = useSpeaker();
  const MY_GAMES_COPY = myGamesCopy(say);
  const game = useKeptParty();
  if (game === null || game.ending !== null) return null;
  return (
    <GoingCard
      thumb="kumimoji"
      heading={<Paired en={MY_GAMES_COPY.localParty.label} kanji={MY_GAMES_COPY.localParty.kanji} kanjiClassName="text-[0.8rem] font-normal tracking-normal" />}
      href={partyAddress(game)}
      action={<>{MY_GAMES_COPY.continueGame} →</>}
      testId="local-party"
      continueTestId="local-party-continue"
    >
      <span className="text-sm font-medium">
        {weave(say.say("mine.cardParty", { players: say.count("count.player", game.players.length), who: nameOf(game, game.turn) }), { game: <GameName variant="kumimoji" /> })}
      </span>
    </GoingCard>
  );
}
