"use client";

import { useState } from "react";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import type { MahjongBonusRule } from "@/lib/puzzles/mahjong/mahjong.types";
import { MAHJONG_TABLE } from "@/lib/puzzles/mahjong/table";
import type { PuzzleAsked } from "@/lib/puzzles/puzzleAddress";

import { MahjongFreeToggle } from "./MahjongFreeToggle";
import { MAHJONG_COPY } from "./mahjong.constants";

/** Mahjong's own choices, held by the set-up (`PuzzleSetUp`): how many play, and how the flowers and seasons match. */
export function useMahjongChoice(asked: PuzzleAsked | undefined) {
  const [players, setPlayers] = useState(asked?.players ?? 1);
  const [bonus, setBonus] = useState<MahjongBonusRule>(asked?.bonus ?? "group");
  return { players, setPlayers, bonus, setBonus };
}

const PLAYER_WORDS: Record<number, string> = { 1: "Solitaire", 2: "Two", 3: "Three", 4: "Four" };
const PLAYER_KANJI: Record<number, string> = { 1: "一人", 2: "二人", 3: "三人", 4: "四人" };

/**
 * MAHJONG'S OWN SET-UP CHOICES, under the options: how many play — the
 * solitaire, or two to four taking turns at one device (`MahjongTableGame`) —
 * how the flowers and seasons match, and whether the free tiles are lit
 * (Hint is the set-up's own, below them). Each a row of chips, and each line under its chips keeps the room its
 * longest wording takes, so the screen never changes height as they change.
 */
export function MahjongSetUpOptions({
  players,
  setPlayers,
  bonus,
  setBonus,
}: ReturnType<typeof useMahjongChoice>) {
  return (
    <>
      <div className="grid grid-cols-4 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label="Players" data-testid="mahjong-players">
        {Array.from({ length: MAHJONG_TABLE.most }, (_, at) => at + 1).map((each) => (
          <button
            key={each}
            type="button"
            role="radio"
            aria-checked={players === each}
            className={`${PICK_WORD_CHIP} ${players === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => setPlayers(each)}
            data-testid={`mahjong-players-${each}`}
          >
            {PLAYER_WORDS[each]} <span className="font-mincho opacity-70">{PLAYER_KANJI[each]}</span>
          </button>
        ))}
      </div>
      <p className="min-h-12 text-xs text-muted" data-testid="mahjong-players-blurb">
        {players === 1 ? "Alone, against the clock: clear the whole layout." : `${PLAYER_WORDS[players]} take turns on one layout, a pair a turn, passing one device round; dragons and winds score most, and any seat can be a computer.`}
      </p>
      <div className="grid grid-cols-2 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label="Flowers and seasons" data-testid="mahjong-bonus">
        {(["group", "same"] as const).map((each) => (
          <button
            key={each}
            type="button"
            role="radio"
            aria-checked={bonus === each}
            className={`${PICK_WORD_CHIP} ${bonus === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => setBonus(each)}
            data-testid={`mahjong-bonus-${each}`}
          >
            {each === "group" ? MAHJONG_COPY.bonusGroup : MAHJONG_COPY.bonusSame} <span className="font-mincho opacity-70">{each === "group" ? "花季" : "同牌"}</span>
          </button>
        ))}
      </div>
      <p className="min-h-8 text-xs text-muted" data-testid="mahjong-bonus-blurb">
        {MAHJONG_COPY.bonusBlurb[bonus]}
      </p>
      <MahjongFreeToggle withBlurb />
    </>
  );
}
