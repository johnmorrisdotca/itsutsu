"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { Paired } from "@/components/i18n/Paired";
import { OPENING_DISPLAY } from "@/lib/gomoku/openings.constants";
import type { OpeningRule } from "@/lib/gomoku/gomoku.types";

import { OpeningMark } from "./OpeningMark";
import { PickMark } from "./PickMark";
import { OPENING_MARK_PX, PICK_CARD, PICK_TILES } from "./picker.constants";
import type { OpeningPickerProps } from "./picker.types";
import { openingsOffered } from "./rulesDraft";

/**
 * The opening, as tiles rather than a dropdown — the same ask John made of the
 * game and the board: "UGLY dropdown… much better than a dropdown."
 *
 * Each tile is the rule drawn small (`OpeningMark`), its name and the one line
 * `OPENING_DISPLAY` already carries for it. Same mechanism as the board blocks:
 * a real radio inside the label, so the arrows move along the row, the chosen
 * one is announced, and the ring and the tick read the input's own state.
 *
 * THE OPENINGS OFFERED ARE THE ONES THIS GAME ALLOWS. The select offered the
 * three a shared game can use at every game, so Halma offered Pro — and the
 * creation route quietly played Free instead (`normaliseSettings`). That was a
 * control whose answer is thrown away. `openingsOffered` asks the variant, and
 * `applyRulesChange` holds the draft to the same answer.
 *
 * A GAME WITH ONE OPENING STATES IT, the way a one-board game states its board:
 * the same picture and words, no radio, no tick, no pointer. Most of the
 * catalogue is in that case, and "Free" is still a fact worth reading about
 * the game somebody is about to play.
 */
export function OpeningPicker({ value, variant, size, onChange, disabled = false }: OpeningPickerProps) {
  const say = useSpeaker().say;
  const offered = openingsOffered(variant);
  const only = offered.length === 1;

  /*
   * ONE OPENING IS A CHOSEN OPENING, drawn as one. A game with a single
   * opening — Reversi, Halma — was shown as a plain card with no radio and no
   * check, a fact rather than a picker of one. That is the sole-board fault
   * John reported on Checkers ("if there is only one board, it should be
   * checked... like boards with > 1 game type") wearing an opening: beside a
   * game whose chosen opening carries the check, the lone card read as
   * unchosen. So a sole opening is the same tile as a chosen opening among
   * three — the chosen style, the check, a radio group of one that is checked
   * and announced as such — and `data-only` still says which case it is.
   */
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5" data-testid="shared-rules-opening">
      <legend className="mb-0.5 text-sm text-ink-soft">{say("setup.opening")}</legend>
      {
        <div className={PICK_TILES}>
          {offered.map((opening) => (
            <label
              key={opening}
              className={`${PICK_CARD} cursor-pointer gap-2.5 p-2 pr-8`}
              data-testid="set-up-opening"
              data-opening={opening}
              data-chosen={opening === value ? "true" : "false"}
              data-only={only ? "true" : "false"}
            >
              <input
                type="radio"
                name="set-up-opening"
                value={opening}
                checked={opening === value}
                disabled={disabled}
                onChange={() => onChange(opening)}
                className="peer sr-only"
              />
              <OpeningMark opening={opening} size={size} px={OPENING_MARK_PX} />
              <OpeningWords opening={opening} />
              <PickMark className="absolute top-1.5 right-1.5 size-5" />
            </label>
          ))}
        </div>
      }
    </fieldset>
  );
}

/** The name and what it means, which is also what the radio is named by. */
function OpeningWords({ opening }: { opening: OpeningRule }) {
  const copy = OPENING_DISPLAY[opening];
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="text-sm font-medium">
        <Paired en={copy.label} kanji={copy.kanji} kanjiClassName="text-xs font-normal opacity-70" />
      </span>
      <span className="text-xs leading-snug text-muted">{copy.tagline}</span>
    </span>
  );
}
