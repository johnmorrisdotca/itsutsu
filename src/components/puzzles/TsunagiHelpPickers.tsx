"use client";

import { Paired } from "@/components/i18n/Paired";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";

import type { PhraseKey } from "@/lib/i18n/i18n.constants";

import type { TsunagiCheatsChoice, TsunagiExplosionsChoice } from "./puzzles.constants";

const EXPLOSIONS: readonly { choice: TsunagiExplosionsChoice; label: PhraseKey; kanji: string }[] = [
  { choice: "on", label: "pmaze.tsunagi.explosions.on", kanji: "爆" },
  { choice: "soft", label: "pmaze.tsunagi.explosions.soft", kanji: "弱" },
  { choice: "off", label: "pmaze.tsunagi.explosions.off", kanji: "無" },
];

const CHEATS: readonly { choice: TsunagiCheatsChoice; label: PhraseKey; kanji: string }[] = [
  { choice: "off", label: "pmaze.tsunagi.cheats.off", kanji: "正" },
  { choice: "allowed", label: "pmaze.tsunagi.cheats.allowed", kanji: "狡" },
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
  const say = useSpeaker();
  return (
    <div className="flex flex-col gap-2" data-testid="tsunagi-help">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted">{say.say("pmaze.tsunagi.explosionsLegend")}</span>
        <div className="flex gap-1.5" role="radiogroup" aria-label={say.say("pmaze.tsunagi.explosionsAria")} data-testid="tsunagi-explosions">
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
              <Paired en={say.say(each.label)} kanji={each.kanji} kanjiClassName="opacity-70" inReadersLanguage />
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-1.5" role="radiogroup" aria-label={say.say("pmaze.tsunagi.cheatingAria")} data-testid="tsunagi-cheats">
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
            <Paired en={say.say(each.label)} kanji={each.kanji} kanjiClassName="opacity-70" inReadersLanguage />
          </button>
        ))}
      </div>
      {explosions === "on" && cheats === "off" ? null : (
        <p className="text-xs text-muted" data-testid="tsunagi-help-costs">
          {say.say(costKey(explosions, cheats))}
        </p>
      )}
    </div>
  );
}

/** What a level solved with this help costs, said whole: each combination is one sentence, since the order of its parts is the reader's language's. */
function costKey(explosions: TsunagiExplosionsChoice, cheats: TsunagiCheatsChoice): PhraseKey {
  if (cheats === "allowed") return explosions === "off" ? "pmaze.tsunagi.costOffCheat" : explosions === "soft" ? "pmaze.tsunagi.costSoftCheat" : "pmaze.tsunagi.costCheat";
  return explosions === "off" ? "pmaze.tsunagi.costOff" : "pmaze.tsunagi.costSoft";
}
