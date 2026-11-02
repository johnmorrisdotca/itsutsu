"use client";

import { GoingCard } from "./GoingCard";
import { Paired } from "@/components/i18n/Paired";
import { useState } from "react";

import { loadSnapshot, type GameSnapshot } from "@/components/game/gameStorage";

import { STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { playPath } from "@/lib/gomoku/slugs";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { weave } from "@/lib/i18n/weave";
import { myGamesCopy } from "./mine.copy";
import { GameName } from "@/components/games/GameName";

import { boardWords } from "@/lib/gomoku/boardWords";

/**
 * The game on this device — the hot-seat one, kept in the browser. It has
 * no seat on the server yet, so it is read from local storage, and only
 * shown when there are stones on it. Rendered on the client only (see
 * LocalGameCardClient), so the read happens once, in the initialiser.
 */
export function LocalGameCard() {
  const say = useSpeaker();
  const MY_GAMES_COPY = myGamesCopy(say);
  const [snapshot] = useState<GameSnapshot | null>(() => loadSnapshot());
  if (snapshot === null || snapshot.moves.length === 0) return null;

  const toPlay = snapshot.moves.length % 2 === 0 ? snapshot.opener : otherThan(snapshot.opener);
  return (
    <GoingCard
      thumb={snapshot.settings.variant}
      heading={<Paired en={MY_GAMES_COPY.localGame.label} kanji={MY_GAMES_COPY.localGame.kanji} kanjiClassName="text-[0.8rem] font-normal tracking-normal" />}
      /* The board, not the game: this link is the way back to the stones, drawn as a button because it is this card's one action; it stays a link because it can be opened in a new tab and copied. */
      href={playPath(snapshot.settings.variant)}
      action={<>{MY_GAMES_COPY.continueGame} →</>}
      testId="local-game"
    >
      <span className="text-sm font-medium">
        {weave(say.say("mine.cardLocal", {
          board: boardWords(snapshot.settings.variant, snapshot.settings.size, say),
          moves: say.count("count.move", snapshot.moves.length),
          who: say.pairName(STONE_DISPLAY[toPlay].label, STONE_DISPLAY[toPlay].kanji).text,
        }), { game: <GameName variant={snapshot.settings.variant} /> })}
      </span>
    </GoingCard>
  );
}

function otherThan(stone: "black" | "white"): "black" | "white" {
  return stone === "black" ? "white" : "black";
}
