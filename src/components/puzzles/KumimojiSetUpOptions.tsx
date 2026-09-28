"use client";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import type { KumimojiLanguage, KumimojiLength } from "@/lib/puzzles/kumimoji/kumimoji.types";
import { kumimojiTileCount, TILE_MIX_TOTAL } from "@/lib/puzzles/kumimoji/tiles.constants";

/**
 * KUMIMOJI'S OWN SET-UP CHOICES, under the puzzle's options: the language,
 * the length of the game, one set or two, and Help. Each is a row of chips,
 * as every choice on the set-up screen is, and each writes into the address
 * the set-up already builds (`puzzleQuery`).
 */
export function KumimojiSetUpOptions({
  size,
  language,
  setLanguage,
  gameLength,
  setGameLength,
  doubleSet,
  setDoubleSet,
  hints,
  setHints,
}: {
  size: number;
  language: KumimojiLanguage;
  setLanguage: (language: KumimojiLanguage) => void;
  gameLength: KumimojiLength;
  setGameLength: (length: KumimojiLength) => void;
  doubleSet: boolean;
  setDoubleSet: (double: boolean) => void;
  hints: boolean;
  setHints: (hints: boolean) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-1.5 pt-1" role="radiogroup" aria-label="Language" data-testid="kumimoji-language">
        {(["english", "japanese"] as const).map((each) => (
          <button
            key={each}
            type="button"
            role="radio"
            aria-checked={language === each}
            className={`${PICK_WORD_CHIP} ${language === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => {
              setLanguage(each);
              if (each === "japanese") setDoubleSet(false);
            }}
            data-testid={`kumimoji-language-${each}`}
          >
            {each === "english" ? "English" : "Japanese · ひらがな"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5 pt-1" role="radiogroup" aria-label="Game length" data-testid="kumimoji-length">
        {(["short", "medium", "full"] as const).map((each) => (
          <button
            key={each}
            type="button"
            role="radio"
            aria-checked={gameLength === each}
            className={`${PICK_WORD_CHIP} ${gameLength === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => setGameLength(each)}
            data-testid={`kumimoji-length-${each}`}
          >
            {each === "short" ? "Short" : each === "medium" ? "Medium" : "Full"} · {kumimojiTileCount(size, each, TILE_MIX_TOTAL, doubleSet && language === "english")}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Tile set" data-testid="kumimoji-double">
        {[false, true].map((each) => (
          <button
            key={String(each)}
            type="button"
            role="radio"
            aria-checked={doubleSet === each}
            className={`${PICK_WORD_CHIP} ${doubleSet === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => language === "english" && setDoubleSet(each)}
            disabled={each && language === "japanese"}
            data-testid={`kumimoji-double-${each ? "on" : "off"}`}
          >
            {each ? "Double" : "One set"} · {kumimojiTileCount(size, gameLength, TILE_MIX_TOTAL, each && language === "english")}
          </button>
        ))}
      </div>
      {/*
        HELP, chosen here or not at all (John, 2026-09-28: "can only be
        turned on as an option before you start the game"): the puzzles'
        own hints switch, which a Kumimoji spends on arranging the hand
        into a word (`help.ts`).
      */}
      <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Help" data-testid="kumimoji-help-choice">
        {[false, true].map((each) => (
          <button
            key={String(each)}
            type="button"
            role="radio"
            aria-checked={hints === each}
            className={`${PICK_WORD_CHIP} ${hints === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => setHints(each)}
            data-testid={`kumimoji-help-${each ? "on" : "off"}`}
          >
            {each ? "Help" : "No help"} <span className="font-mincho opacity-70">{each ? "助け有" : "助け無"}</span>
          </button>
        ))}
      </div>
    </>
  );
}
