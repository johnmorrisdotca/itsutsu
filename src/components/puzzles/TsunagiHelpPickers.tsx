"use client";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";

import type { TsunagiCheatsChoice, TsunagiExplosionsChoice } from "./puzzles.constants";

const EXPLOSIONS: readonly { choice: TsunagiExplosionsChoice; label: string; kanji: string }[] = [
  { choice: "on", label: "As made", kanji: "爆" },
  { choice: "soft", label: "Softer", kanji: "弱" },
  { choice: "off", label: "Off", kanji: "無" },
];

const CHEATS: readonly { choice: TsunagiCheatsChoice; label: string; kanji: string }[] = [
  { choice: "off", label: "No cheating", kanji: "正" },
  { choice: "allowed", label: "Allow cheating", kanji: "狡" },
];

/**
 * HELP, CHOSEN BEFORE A LEVEL IS STARTED: how a level's explosions are played,
 * and whether Cheat is offered. John's rows: "a set-up option to soften or
 * switch them off", and Cheat "offered only when 'Allow cheating' was chosen
 * before the game started". Each says, beside it, what a solve made with it
 * costs (`solveHelp.ts`), so nobody finds out from a solve with no points.
 */
export function TsunagiHelpPickers({
  explosions,
  onExplosions,
  cheats,
  onCheats,
}: {
  explosions: TsunagiExplosionsChoice;
  onExplosions: (next: TsunagiExplosionsChoice) => void;
  cheats: TsunagiCheatsChoice;
  onCheats: (next: TsunagiCheatsChoice) => void;
}) {
  return (
    <div className="flex flex-col gap-2" data-testid="tsunagi-help">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted">Explosions, on the levels that have them</span>
        <div className="flex gap-1.5" role="radiogroup" aria-label="Explosions" data-testid="tsunagi-explosions">
          {EXPLOSIONS.map((each) => (
            <button
              key={each.choice}
              type="button"
              role="radio"
              aria-checked={explosions === each.choice}
              className={`${PICK_WORD_CHIP} ${explosions === each.choice ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
              onClick={() => onExplosions(each.choice)}
              data-testid={`tsunagi-explosions-${each.choice}`}
            >
              {each.label} <span className="font-mincho opacity-70">{each.kanji}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-1.5" role="radiogroup" aria-label="Cheating" data-testid="tsunagi-cheats">
        {CHEATS.map((each) => (
          <button
            key={each.choice}
            type="button"
            role="radio"
            aria-checked={cheats === each.choice}
            className={`${PICK_WORD_CHIP} ${cheats === each.choice ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => onCheats(each.choice)}
            data-testid={`tsunagi-cheats-${each.choice}`}
          >
            {each.label} <span className="font-mincho opacity-70">{each.kanji}</span>
          </button>
        ))}
      </div>
      {explosions === "on" && cheats === "off" ? null : (
        <p className="text-xs text-muted" data-testid="tsunagi-help-costs">
          {cheats === "allowed" ? "Cheat draws one unfinished line. " : ""}
          A level solved with {[explosions === "on" ? null : `explosions ${explosions === "off" ? "off" : "softened"}`, cheats === "allowed" ? "Cheat" : null].filter(Boolean).join(" or ")} counts, but scores no points and is not on the fastest table
          {explosions === "off" ? "; with explosions off, it does not open the next block." : "."}
        </p>
      )}
    </div>
  );
}
