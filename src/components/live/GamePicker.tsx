"use client";

import { useRef, useState, type KeyboardEvent } from "react";

import { FamilyMark } from "@/components/games/FamilyMark";
import { GameThumb } from "@/components/games/GameThumb";
import { Paired } from "@/components/i18n/Paired";
import { GAME_FAMILIES } from "@/lib/gomoku/families";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";

import { familyShown } from "./picker";
import { PickMark } from "./PickMark";
import { PICK_CARD, PICK_CHIP, PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_GRID } from "./picker.constants";

/** Which way an arrow key moves along the family row. Home and End are the ends. */
const STEPS: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1 };

/**
 * Choosing the game, as two rows rather than a dropdown.
 *
 * John asked for the dropdown to go — "we should show all the families of
 * board images with text… much better than a dropdown" — and then, when the
 * room it would take was put to him, decided the shape himself: "list out the
 * families with icons… and clicking on a family changes the row below it with
 * the variants of that family."
 *
 * So: MASTER AND DETAIL, in two rows.
 *
 *   Row one   all eleven families, always, each with the mark /games draws
 *             for it. It never scrolls and never collapses, because seeing
 *             the whole of the choice is the point of it.
 *   Row two   the games of the open family, each with the board it is
 *             actually played on, its name and what it is.
 *
 * Thirty-nine games as thirty-nine tiles would be the long scrolling page
 * John has asked more than once not to be given. Two rows is a screenful, and
 * it reaches any game in two actions — one, when the family is already open,
 * which it is on arrival because the open family is the chosen game's own.
 * The dropdown took two. Nothing here is slower than what it replaces.
 *
 * THE NAMES HERE ARE NOT LINKS, and that is the rule kept rather than broken.
 * "If you see a name of a game, it's clickable" has one exception already
 * written down for it — a select's `<option>`, and the autocomplete suggestion
 * that is "the `<option>` case wearing different markup": choosing it IS the
 * way to that game, which is the same promise kept another way. A radio in a
 * picker is that case again. An <a> inside the <label> would also swallow the
 * click that chooses, so a link here would cost the control to keep a promise
 * the control already keeps. The way to READ about a game is on this page as
 * well — "Every game there is", above the panel.
 *
 * Worth knowing: `gameLinks.coverage.test.ts` never sees this either way. It
 * looks for a label printed into a text position, and this one goes through
 * `<Paired en={copy.label}>` as a prop — as it does on the /games cards. That
 * is the gate's scope rather than a hole opened here, but it is the reason
 * this paragraph exists instead of a green test.
 *
 * WHY THE PICTURES ARE THE THUMBNAILS. `public/art/games/thumbs/<variant>.jpg`
 * is 96px and three to five kilobytes, cut once by `pnpm art:thumbs` from the
 * board screenshot every game already has. The full boards are 712px and
 * fifty kilobytes each: eight of those on one screen is most of a megabyte to
 * draw eight squares forty pixels wide, and nothing on this site may cost it
 * extra money. GameThumb is the same component every other list uses, so a
 * game looks the same here as it does on /play and /games.
 */
export function GamePicker({
  value,
  onChange,
  disabled = false,
  label,
}: {
  /** The chosen game, as its variant key. */
  value: string;
  onChange: (variant: string) => void;
  disabled?: boolean;
  /** What the group is called — "Game" on the screen that is choosing one. */
  label: string;
}) {
  /*
   * The family being browsed, which is the chosen game's own until somebody
   * looks elsewhere. The rule is `familyShown` — pure, in its own module and
   * tested there, because it is the one thing here that can be wrong without
   * showing: a screen that arrives with a game already chosen must open on
   * that game's family rather than on the first.
   */
  const [browsing, setBrowsing] = useState<string | null>(null);
  const family = familyShown(value, browsing);
  const tagline = RULE_VARIANT_DISPLAY[value as RuleVariant]?.tagline;

  /*
   * ONE TAB STOP FOR ELEVEN FAMILIES. A row of eleven focusable buttons would
   * put eleven stops between the reader and the games, which on a form with
   * six more controls under it is most of a minute of tabbing. The open one
   * is the only one in the tab order and the arrows move along the row, which
   * is how a tab strip behaves everywhere else and how the radio group below
   * behaves for free.
   */
  const chips = useRef<(HTMLButtonElement | null)[]>([]);
  function travel(event: KeyboardEvent, at: number) {
    const step = STEPS[event.key];
    const to =
      step !== undefined
        ? (at + step + GAME_FAMILIES.length) % GAME_FAMILIES.length
        : event.key === "Home"
          ? 0
          : event.key === "End"
            ? GAME_FAMILIES.length - 1
            : -1;
    if (to === -1) return;
    event.preventDefault();
    setBrowsing(GAME_FAMILIES[to].title);
    chips.current[to]?.focus();
  }

  return (
    <fieldset className="flex min-w-0 flex-col gap-2" data-testid="shared-rules-variant">
      <legend className="mb-1 text-sm text-ink-soft">{label}</legend>

      {/* Row one: every family there is, wrapping rather than scrolling sideways. */}
      <div role="tablist" aria-label="Families of games" className="flex flex-wrap gap-1.5">
        {GAME_FAMILIES.map((entry, at) => {
          const showing = entry.title === family.title;
          return (
            <button
              key={entry.title}
              ref={(node) => {
                chips.current[at] = node;
              }}
              type="button"
              role="tab"
              id={`family-tab-${at}`}
              aria-selected={showing}
              aria-controls="family-games"
              tabIndex={showing ? 0 : -1}
              onClick={() => setBrowsing(entry.title)}
              onKeyDown={(event) => travel(event, at)}
              className={`${PICK_CHIP} ${showing ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
              data-testid="set-up-family"
              data-family={entry.title}
              data-open={showing ? "true" : "false"}
            >
              <FamilyMark family={entry.title} className="size-5 shrink-0 rounded-sm" />
              {/*
                The kanji goes below a laptop, and only for a reader of
                English. Eleven chips carrying both scripts wrap to three
                lines on an iPad and six on a phone, and those lines come
                straight off the bottom of the screen where the Start button
                is. For a Japanese reader `Paired` returns the kanji as the
                whole label rather than as an extra, so this never hides
                their only copy of the name.
              */}
              <Paired en={entry.title} kanji={entry.kanji} kanjiClassName="hidden opacity-70 lg:inline" />
              {/*
                Where the chosen game lives, for a reader who has wandered off
                to look at another family. Without it, browsing away leaves a
                picker with nothing checked anywhere on it and no way back but
                memory.
              */}
              {entry.games.includes(value as RuleVariant) ? (
                <span
                  aria-hidden="true"
                  className={`size-1.5 shrink-0 rounded-full ${showing ? "bg-paper" : "bg-ink"}`}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/*
        Row two: the open family's games. Its height is fixed by PICK_GRID —
        see there for why — so browsing the families never moves the Start
        button under the reader's hand.
      */}
      <div
        role="tabpanel"
        id="family-games"
        aria-labelledby={`family-tab-${GAME_FAMILIES.indexOf(family)}`}
        className={PICK_GRID}
      >
        {family.games.map((game) => {
          const copy = RULE_VARIANT_DISPLAY[game];
          return (
            <label
              key={game}
              className={`${PICK_CARD} gap-1.5 p-1`}
              data-testid="set-up-variant"
              data-variant={game}
              data-chosen={game === value ? "true" : "false"}
            >
              <input
                type="radio"
                name="set-up-variant"
                value={game}
                checked={game === value}
                disabled={disabled}
                onChange={() => onChange(game)}
                className="peer sr-only"
              />
              <GameThumb variant={game} className="size-10" />
              {/*
                THE BOARD AND THE NAME, and not the tagline.

                A line of what-it-is under every name read well and cost forty
                pixels a row — a hundred and sixty on the tallest family,
                which is most of the difference between a Start button you can
                see and one you have to go looking for. It is not lost: the
                tagline of the game actually chosen is printed under the
                picker, which is the one a reader is deciding about. The
                picture does the rest of the work, and doing that work is why
                John asked for pictures.
              */}
              {/*
                A thirteenth of a pixel smaller than the site's small text
                until a laptop, and this is measured too. Three columns at
                exactly 768 — an iPad in portrait, the device this screen is
                for — leave 132px beside the board for the name and its
                kanji, and "Tournament Gomoku" at 14px wants 124 of them, so
                the clip reached back into the name: "Tournament Gomo…". At
                13px it wants 115 and the kanji takes the squeeze instead,
                which is the way round this control is supposed to fail.

                Two columns would have fixed it too and cost 56px of height,
                which is more than the whole margin the Start button has.
              */}
              <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium lg:text-sm">
                <Paired en={copy.label} kanji={copy.kanji} kanjiClassName="text-xs font-normal opacity-70" />
              </span>
              <PickMark className="size-5" />
            </label>
          );
        })}
      </div>

      {tagline !== undefined ? (
        <span className="text-xs leading-snug text-muted" data-testid="set-up-variant-hint">
          {tagline}
        </span>
      ) : null}
    </fieldset>
  );
}
