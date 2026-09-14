"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { RATING_REFUSAL_DISPLAY } from "@/lib/rating/rateable.constants";

import { PickMark } from "./PickMark";
import { PICK_CARD, PICK_FACT, PICK_ICON, PICK_PAIR, RATED_TILES } from "./picker.constants";
import type { RatedPickerProps } from "./picker.types";

/**
 * Whether the game counts, as two tiles: Rated and Friendly, each saying what
 * it means. The select put both answers behind one closed line, and a reader
 * had to open it to learn there were two.
 *
 * The same values as that select, through the same `change({ rated })`.
 *
 * WHERE THE ANSWER IS ALREADY SETTLED, THE FACT, NOT A CONTROL. A fork with
 * nobody to hand the second seat to becomes a game at one screen, and a game at
 * one screen cannot move a rating — `RulesForm` explains why a choice there
 * would be taken and thrown away. The select was simply left out in that case
 * and the fold's summary said "Will not count"; the drawer now says it too, in
 * the words the rating notice already uses, where the tiles would have been.
 */
export function RatedPicker({ value, refused, onChange, disabled = false }: RatedPickerProps) {
  const say = useSpeaker().say;

  if (refused !== null) {
    const copy = RATING_REFUSAL_DISPLAY[refused];
    return (
      <div className="flex min-w-0 flex-col gap-1.5" data-testid="set-up-rated-fact" data-refused={refused}>
        <span className="text-sm text-ink-soft">{say("setup.ratings")}</span>
        <div className={`${PICK_FACT} gap-2.5 p-2`}>
          <LevelIcon />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-medium">
              {copy.playing} <span className="font-mincho text-xs font-normal opacity-70">{copy.kanji}</span>
            </span>
            <span className="text-xs leading-snug text-muted">{copy.sentence}</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5" data-testid="shared-rules-rated">
      <legend className="mb-0.5 text-sm text-ink-soft">{say("setup.ratings")}</legend>
      <div className={PICK_PAIR}>
        {RATED_TILES.map((tile) => (
          <label
            key={tile.word}
            className={`${PICK_CARD} cursor-pointer gap-2.5 p-2 pr-8`}
            data-testid="set-up-rated"
            data-rated={tile.word}
            data-chosen={tile.rated === value ? "true" : "false"}
          >
            <input
              type="radio"
              name="set-up-rated"
              value={tile.word}
              checked={tile.rated === value}
              disabled={disabled}
              onChange={() => onChange(tile.rated)}
              className="peer sr-only"
            />
            {tile.rated ? <MovesIcon /> : <LevelIcon />}
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-medium">{say(tile.phrase)}</span>
              <span className="text-xs leading-snug text-muted">{say(tile.means)}</span>
            </span>
            <PickMark className="absolute top-1.5 right-1.5 size-5" />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** A rating that moves: one arrow up, one down. */
function MovesIcon() {
  return (
    <span aria-hidden="true" className={PICK_ICON}>
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 19V5M4 9l4-4 4 4M16 5v14M12 15l4 4 4-4" />
      </svg>
    </span>
  );
}

/** A rating that stays where it is: level. */
function LevelIcon() {
  return (
    <span aria-hidden="true" className={PICK_ICON}>
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M5 10h14M5 14h14" />
      </svg>
    </span>
  );
}
