"use client";

import { Paired } from "@/components/i18n/Paired";
import Link from "@/components/ui/Link";
import { useState } from "react";

import { loadSnapshot, type GameSnapshot } from "@/components/game/gameStorage";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { playPath } from "@/lib/gomoku/slugs";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { weave } from "@/lib/i18n/weave";
import { myGamesCopy } from "./mine.copy";
import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
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
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="local-game">
      <GameThumb variant={snapshot.settings.variant} size="small" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
          <Paired en={MY_GAMES_COPY.localGame.label} kanji={MY_GAMES_COPY.localGame.kanji} kanjiClassName="text-[0.8rem] font-normal tracking-normal" />
        </span>
        <span className="text-sm font-medium">
          {weave(say.say("mine.cardLocal", {
            board: boardWords(snapshot.settings.variant, snapshot.settings.size, say),
            moves: say.count("count.move", snapshot.moves.length),
            who: say.pairName(STONE_DISPLAY[toPlay].label, STONE_DISPLAY[toPlay].kanji).text,
          }), { game: <GameName variant={snapshot.settings.variant} /> })}
        </span>
      </div>
      {/*
        The board, not the game: this link is the way back to the stones. It
        is drawn as a button because it is this card's one ACTION — the thing
        you do about the game on this device — and it sat here as an
        underlined word beside rows whose actions are all buttons. It stays a
        link because it goes somewhere: it can be opened in a new tab and
        copied, which a button cannot.
      */}
      <Link href={playPath(snapshot.settings.variant)} className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`}>
        {MY_GAMES_COPY.continueGame} →
      </Link>
    </div>
  );
}

function otherThan(stone: "black" | "white"): "black" | "white" {
  return stone === "black" ? "white" : "black";
}
