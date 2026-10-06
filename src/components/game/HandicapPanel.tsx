"use client";

import {
  HANDICAP_RULES,
  NO_HANDICAP,
  SECOND_STONE_EXCLUSIONS,
  STONES,
  STONE_DISPLAY,
} from "@/lib/gomoku/gomoku.constants";
import { handicapCopy, secondStoneLabel } from "@/lib/gomoku/openingCopy";
import { dottedText, stoneName } from "@/lib/gomoku/seatWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { handicapOffer } from "@/lib/gomoku/handicapOffer";
import type { Handicap, Stone } from "@/lib/gomoku/gomoku.types";
import { Field, Select, Toggle } from "@/components/ui/Controls";
import { gameCopy } from "./game.constants";
import type { GamePanelProps } from "./game.types";

const NONE = "none";

/**
 * A handicap for one colour, built from the restrictions the variants impose:
 * the stronger player takes on the rules of a harder game while the other
 * plays the plain one. Changing any of it starts a new game.
 */
export function HandicapPanel({ session, actions }: GamePanelProps) {
  const say = useSpeaker();
  const GAME_COPY = gameCopy(say);
  const { settings } = session.state;
  const { handicap } = settings;
  const stone = handicap.stone;

  const update = (next: Partial<Handicap>) =>
    actions.reset({ handicap: { ...handicap, ...next } });

  return (
    <div className="flex flex-col gap-3" data-testid="handicap-panel">
      <Field label={GAME_COPY.handicap.label} hint={GAME_COPY.handicapHint}>
        <Select
          value={stone ?? NONE}
          onChange={(event) =>
            event.target.value === NONE
              ? actions.reset({ handicap: NO_HANDICAP })
              : update({ stone: event.target.value as Stone })
          }
          data-testid="handicap-stone"
        >
          <option value={NONE}>{GAME_COPY.handicapNone}</option>
          {Object.values(STONES).map((option) => (
            <option key={option} value={option}>
              {dottedText(say, stoneName(say, option), STONE_DISPLAY[option].kanji)}
            </option>
          ))}
        </Select>
      </Field>

      {stone !== null ? (
        <div className="flex flex-col gap-3 rounded-xl border border-rule p-3">
          {HANDICAP_RULES.map((rule) => {
            const copy = handicapCopy(rule, say.locale);
            const { available, imposed, note } = handicapOffer(rule, settings.variant, stone, say);
            return (
              <div key={rule} className={available ? undefined : "opacity-60"}>
                <Toggle
                  label={dottedText(say, copy.label, copy.kanji)}
                  checked={available ? handicap[rule] : imposed}
                  onChange={(next) => (available ? update({ [rule]: next }) : undefined)}
                  hint={say.sentences([say.say("live.sourceLine", { description: copy.description, from: copy.from }), ...(note !== null ? [note] : [])])}
                />
              </div>
            );
          })}

          <Field
            label={GAME_COPY.secondStone.label}
            hint={GAME_COPY.secondStoneHint}
          >
            <Select
              value={handicap.secondStoneExclusion}
              onChange={(event) =>
                update({ secondStoneExclusion: Number(event.target.value) })
              }
              data-testid="handicap-second-stone"
            >
              {SECOND_STONE_EXCLUSIONS.map((option) => (
                <option key={option} value={option}>
                  {secondStoneLabel(option, say.locale)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      ) : null}
    </div>
  );
}
