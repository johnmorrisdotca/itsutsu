"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { useEffect, useMemo, useState } from "react";

import { KumimojiPartyAll } from "@/components/puzzles/KumimojiPartyBoards";
import { KumimojiPartyFinish } from "@/components/puzzles/KumimojiPartyScreens";
import { KumimojiPartyTurn, type PartyTurnHands } from "@/components/puzzles/KumimojiPartyTurn";
import { tableTheme } from "@/components/puzzles/KumimojiTable";
import { nameOf } from "@/lib/puzzles/kumimoji/party";
import type { PartyGame } from "@/lib/puzzles/kumimoji/party.types";
import { loadTileWords, tileWords, tileWordsReady } from "@/lib/puzzles/kumimoji/tileWords";
import { KUMIMOJI_ONLINE, seatOf, type KumimojiMove } from "@/lib/party/online/onlineKumimoji";

import type { OnlineBoardProps } from "./online.types";
import type { Speaker } from "@/lib/i18n/i18n";

/**
 * KUMIMOJI AT A TABLE ON SEVERAL DEVICES: on the reader's own turn, the same
 * desk the pass-and-play turn is (`KumimojiPartyTurn`), what they lay and lift
 * staying on this device until Draw, Done or Resign sends it to the table;
 * otherwise every player's table and hand, face up — all hands are visible,
 * John's word (2026-09-29) — as the pass screen's All tables shows them.
 *
 * The words are checked here, in this browser, with the word list loaded
 * here; the server takes this page's word for them and checks only that the
 * tiles are real (`onlineKumimoji.ts`).
 */
export function KumimojiOnline({ game, appearance, canMove, onMove }: OnlineBoardProps<PartyGame, KumimojiMove>) {
  const say = useSpeaker();
  const language = game.settings.language;
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let live = true;
    void loadTileWords(language).then(() => {
      if (live) setLoaded(true);
    });
    return () => {
      live = false;
    };
  }, [language]);
  const ready = loaded || tileWordsReady(language);
  const theme = tableTheme(appearance);

  /*
   * THE TURN IN PROGRESS ON THIS DEVICE, kept against the table's position:
   * when the table moves on — this seat's own Draw answered, or anything else —
   * it starts again from the table's game.
   */
  const position = KUMIMOJI_ONLINE.moveCount(game);
  const [local, setLocal] = useState<{ position: number; game: PartyGame } | null>(null);
  const playing = local !== null && local.position === position ? local.game : game;
  const hands: PartyTurnHands = useMemo(
    () => ({
      change: (next) => setLocal({ position, game: next }),
      draw: (now, verdict) => onMove({ stages: [{ seat: seatOf(now), then: "draw", sound: verdict.sound, spells: false }] }),
      done: (now, verdict, spells) => onMove({ stages: [{ seat: seatOf(now), then: "done", sound: verdict.sound, spells }] }),
      resign: (now) => onMove({ stages: [{ seat: seatOf(now), then: "resign", sound: false, spells: false }] }),
    }),
    [position, onMove],
  );

  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="kumimoji-online" data-turn={game.turn} data-turns={game.turns} data-position={position} data-ready={ready ? "true" : "false"}>
      {!ready ? (
        <p className="min-h-[20rem] text-sm text-muted" aria-busy="true">
          {say.say("party.online.loadingWords")}
        </p>
      ) : game.ending !== null ? (
        <KumimojiPartyFinish game={game} theme={theme} />
      ) : canMove ? (
        <KumimojiPartyTurn key={position} game={playing} words={tileWords(language)} theme={theme} hands={hands} />
      ) : (
        <>
          <p className="text-base font-semibold" data-testid="kumimoji-party-whose">
            {say.say("pkumi.turn.whose", { name: nameOf(game, game.turn) })}
          </p>
          <KumimojiPartyAll game={game} theme={theme} />
        </>
      )}
    </div>
  );
}

/** A seat's standing at Kumimoji: the tiles in its hand, and on its table. */
export function kumimojiStanding(game: PartyGame, seat: number, say: Speaker): string {
  const player = game.players[seat];
  return player === undefined ? "" : say.say("party.kumimoji.standing", { hand: String(player.hand.length), laid: String(player.tiles.size) });
}
