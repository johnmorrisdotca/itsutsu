"use client";

import { useState } from "react";

import { Paired } from "@/components/i18n/Paired";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import type { MahjongBonusRule } from "@johnmorrisdotca/jarajara";
import { AWASE_TABLE } from "@johnmorrisdotca/jarajara/table";
import type { PuzzleAsked } from "@/lib/puzzles/puzzleAddress";

import { MahjongFreeToggle } from "./MahjongFreeToggle";
import { mahjongCopy } from "./cardWords";

/** Mahjong's own choices, held by the set-up (`PuzzleSetUp`): how many play, and how the flowers and seasons match. */
export function useMahjongChoice(asked: PuzzleAsked | undefined) {
  const [players, setPlayers] = useState(asked?.players ?? 1);
  const [bonus, setBonus] = useState<MahjongBonusRule>(asked?.bonus ?? "group");
  return { players, setPlayers, bonus, setBonus };
}

const PLAYER_WORDS: Record<number, PhraseKey> = { 1: "pcard.mj.playerOne", 2: "pcard.mj.playerTwo", 3: "pcard.mj.playerThree", 4: "pcard.mj.playerFour" };
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
  const say = useSpeaker();
  const MAHJONG_COPY = mahjongCopy(say.locale);
  return (
    <>
      <div className="grid grid-cols-4 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label={say.say("pcard.mj.playersAria")} data-testid="mahjong-players">
        {Array.from({ length: AWASE_TABLE.most }, (_, at) => at + 1).map((each) => (
          <button
            key={each}
            type="button"
            role="radio"
            aria-checked={players === each}
            className={`${PICK_WORD_CHIP} ${players === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => setPlayers(each)}
            data-testid={`mahjong-players-${each}`}
          >
            <Paired en={say.say(PLAYER_WORDS[each]!)} kanji={PLAYER_KANJI[each]!} kanjiClassName="opacity-70" inReadersLanguage />
          </button>
        ))}
      </div>
      <p className="min-h-12 text-xs text-muted" data-testid="mahjong-players-blurb">
        {players === 1 ? say.say("pcard.mj.alone") : say.count("pcard.mj.party", players, { who: say.say(PLAYER_WORDS[players]!) })}
      </p>
      <div className="grid grid-cols-2 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label={say.say("pcard.mj.bonusAria")} data-testid="mahjong-bonus">
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
            <Paired en={each === "group" ? MAHJONG_COPY.bonusGroup : MAHJONG_COPY.bonusSame} kanji={each === "group" ? "花季" : "同牌"} kanjiClassName="opacity-70" inReadersLanguage />
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
