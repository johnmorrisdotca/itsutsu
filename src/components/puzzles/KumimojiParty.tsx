"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { setUpPath } from "@/lib/gomoku/slugs";
import { generatePuzzle } from "@/lib/puzzles/generate";
import { startParty } from "@/lib/puzzles/kumimoji/party";
import type { PartySettings } from "@/lib/puzzles/kumimoji/party.types";
import { holdsItsBag, isPartyFor } from "@/lib/puzzles/kumimoji/partyKept";
import { tileWords } from "@/lib/puzzles/kumimoji/tileWords";
import type { KumimojiLanguage } from "@/lib/puzzles/kumimoji/kumimoji.types";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { freshSeed } from "@/lib/puzzles/random";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { tableTheme } from "./KumimojiTable";
import { KumimojiPartyPass } from "./KumimojiPartyBoards";
import { KumimojiPartyFinish, KumimojiPartyNames, KumimojiPartyOrder, partyAddress } from "./KumimojiPartyScreens";
import { KumimojiPartyTurn } from "./KumimojiPartyTurn";
import { keepParty, rememberNames, useKeptParty, useRememberedNames } from "./kumimojiPartyKept";

/**
 * KUMIMOJI PASS AND PLAY: two to eight people round one device, at
 * `/games/kumimoji/play?…&players=N`. John, 2026-09-28: "after you finish your
 * move, you say you're done and in the screen, the screen will cover until the
 * next person comes… Then they say they're there and then they click on it
 * and then they can see their tiles and they play the game and then it
 * rotates… for now just local play is fine."
 *
 * Screen by screen: who is playing (names, `KumimojiPartyNames`); the pass
 * screen naming the player to pass to, over a table anybody may swipe through
 * (`KumimojiPartyPass`); that player's own desk, ended with Done
 * (`KumimojiPartyTurn`); the pass screen again for the next; and at the end
 * every player's crossword (`KumimojiPartyFinish`). Nothing is secret — every
 * table and hand is face up, as at a real table — and All tables shows them
 * side by side from the pass screen or any turn (`KumimojiPartyAll`).
 *
 * LOCAL ONLY. The bag is the one the address's seed makes, as the solo game's
 * is, and the whole game lives in this browser (`kumimojiPartyKept.ts`):
 * nothing is handed to the server, no points, no leaderboard, no XP. A reload
 * opens it on the pass screen of the player whose turn it was, never on their
 * desk, since whoever holds the device after a reload may not be that player.
 */
export function KumimojiParty({
  puzzle,
  players,
  hints = false,
  appearance = DEFAULT_APPEARANCE,
  language = puzzle.language ?? "english",
}: {
  puzzle: Puzzle;
  /** Two to eight, from the address. */
  players: number;
  hints?: boolean;
  appearance?: Appearance;
  language?: KumimojiLanguage;
}) {
  const hydrated = useHydrated();
  const router = useRouter();
  const words = useMemo(() => tileWords(language), [language]);
  const theme = tableTheme(appearance);
  const settings: PartySettings = useMemo(
    () => ({ size: puzzle.size, level: puzzle.level, seed: puzzle.seed, gameLength: puzzle.gameLength ?? "short", language, doubleSet: puzzle.doubleSet ?? false, diagonals: puzzle.diagonals ?? false, hints }),
    [puzzle, language, hints],
  );
  const stored = useKeptParty();
  const remembered = useRememberedNames();
  /* A kept game whose tiles did not all come out of its own bag is not opened: the names screen begins a fresh one. */
  const kept = useMemo(() => (stored !== null && holdsItsBag(stored, words.familyKey) ? stored : null), [stored, words]);
  const game = kept !== null && isPartyFor(kept, settings, players) ? kept : null;
  /* Which turn has been uncovered, by its number: a new turn is covered until its player says they are there. */
  const [uncovered, setUncovered] = useState<number | null>(null);

  const begin = (names: string[]) => {
    rememberNames(names);
    keepParty(startParty(settings, puzzle.givens, names));
  };
  const again = () => {
    if (game === null) return;
    const s = game.settings;
    const next = { ...s, seed: freshSeed() };
    const made = generatePuzzle("kumimoji", s.size, s.level, next.seed, { gameLength: s.gameLength, language: s.language, doubleSet: s.doubleSet, diagonals: s.diagonals });
    const fresh = startParty(next, made.givens, game.players.map((player) => player.name));
    keepParty(fresh);
    router.push(partyAddress(fresh));
  };

  return (
    <section className="flex flex-col gap-3" data-testid="kumimoji-party" data-players={players} {...readyMark(hydrated)}>
      {game === null ? (
        <KumimojiPartyNames count={players} remembered={remembered} replacing={kept !== null && kept.ending === null ? kept : null} onBegin={begin} />
      ) : game.ending !== null ? (
        <KumimojiPartyFinish game={game} theme={theme} onAgain={again} />
      ) : uncovered === game.turns ? (
        <KumimojiPartyTurn key={game.turns} game={game} words={words} theme={theme} onHide={() => setUncovered(null)} />
      ) : (
        <KumimojiPartyPass key={game.turns} game={game} theme={theme} onUncover={() => setUncovered(game.turns)}>
          <KumimojiPartyOrder
            game={game}
            onEnd={() => {
              keepParty(null);
              router.push(setUpPath("kumimoji"));
            }}
          />
        </KumimojiPartyPass>
      )}
    </section>
  );
}
