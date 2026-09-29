"use client";

import { useState } from "react";

import type { KumimojiLanguage, KumimojiLength } from "@/lib/puzzles/kumimoji/kumimoji.types";
import { partyLength } from "@/lib/puzzles/kumimoji/party";
import type { PuzzleAsked } from "@/lib/puzzles/puzzleAddress";

/**
 * KUMIMOJI'S SET-UP CHOICES, held for the set-up screen (`PuzzleSetUp`): the
 * language, the game's length, one set or two, and how many players. What is
 * played is worked out from what was chosen, the way a level a size cannot be
 * made at falls back to one it can: a length whose bag cannot deal this many
 * hands and a round of draws plays as the shortest that can (`partyLength`),
 * and comes back when there are fewer players again.
 */
export function useKumimojiChoice(asked: PuzzleAsked | undefined, size: number, kumimoji: boolean) {
  const [language, setLanguage] = useState<KumimojiLanguage>(asked?.language ?? "english");
  const [chosenLength, setGameLength] = useState<KumimojiLength>(asked?.gameLength ?? "short");
  const [doubleSet, setDoubleSet] = useState(asked?.doubleSet ?? false);
  const [chosenPlayers, setPlayers] = useState(asked?.players ?? 1);
  // Another puzzle chosen on the same screen plays alone, whatever was chosen for a Kumimoji.
  const players = kumimoji ? chosenPlayers : 1;
  const double = doubleSet && language === "english";
  const gameLength = partyLength(players, size, chosenLength, double);
  return { language, setLanguage, gameLength, setGameLength, doubleSet, setDoubleSet, players, setPlayers };
}
