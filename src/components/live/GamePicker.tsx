"use client";

import { useRef, useState, type KeyboardEvent } from "react";

import { FamilyMark } from "@/components/games/FamilyMark";
import { GameThumb } from "@/components/games/GameThumb";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { OneName } from "@/components/i18n/OneName";
import { GAME_FAMILIES, gamesShownIn } from "@/lib/gomoku/families";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";

import { familyShown, gameForFamilyClick, type Family } from "./picker";
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
 * `<OneName en={copy.label}>` as a prop — as `Paired` does on the /games cards. That
 * is the gate's scope rather than a hole opened here, but it is the reason
 * this paragraph exists instead of a green test.
 *
 * WHY THE PICTURES ARE THE THUMBNAILS. `public/art/games/thumbs/<variant>.jpg`
 * is 140px and three to five kilobytes, cut once by `pnpm art:thumbs` from the
 * board screenshot every game already has. The full boards are 712px and
 * fifty kilobytes each: eight of those on one screen is most of a megabyte to
 * draw eight squares seventy pixels wide, and nothing on this site may cost it
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
   * The open family is a READING of the chosen game.
   *
   * A separate `browsing` state was once the bug: the row of families could
   * say one thing while the chosen game said another, so clicking Drops from
   * Hex gave the eight drop games over Hex's boards and a heading still
   * reading "Hex ヘックス · 13×13 Medium". A family click chooses that
   * family's game — see `gameForFamilyClick` — so the two cannot come apart.
   *
   * `browsing` is back, and cannot be that bug again. A game may be shown on
   * two shelves (Mini Reversi lives under Flips and is listed under Small
   * boards), and a reader who picked it from Small boards must stay on Small
   * boards. So the last family clicked is remembered, but `familyShown`
   * honours it only while that family shows the chosen game and falls back to
   * the game's home otherwise: the open family always holds the chosen game.
   */
  const speaker = useSpeaker();
  const [browsing, setBrowsing] = useState<string | null>(null);
  const family = familyShown(value, browsing);
  const tagline = RULE_VARIANT_DISPLAY[value as RuleVariant]?.tagline;

  /*
   * A click on a family chooses its game; a click on the family already open
   * does nothing. Both halves are `gameForFamilyClick`, tested in picker.ts.
   */
  const openFamily = (entry: Family) => {
    setBrowsing(entry.key);
    const next = gameForFamilyClick(entry, value);
    if (next !== null) onChange(next);
  };

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
    /*
     * Arrows choose, the way a click does. This is a tab strip with automatic
     * activation, which the ARIA practices recommend where the panel is cheap
     * to draw — and it has to be the same act as a click, or the keyboard
     * would have the browse-without-choosing behaviour that was the bug.
     */
    openFamily(GAME_FAMILIES[to]);
    chips.current[to]?.focus();
  }

  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5" data-testid="shared-rules-variant">
      <legend className="mb-0.5 text-sm text-ink-soft">{label}</legend>

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
              /*
               * Inert while a game is being created, like the radios below
               * it. It was not, which meant the game could still be changed
               * in the moment between pressing Start and the game existing.
               */
              disabled={disabled}
              onClick={() => openFamily(entry)}
              onKeyDown={(event) => travel(event, at)}
              className={`${PICK_CHIP} ${showing ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
              data-testid="set-up-family"
              data-family={entry.title}
              data-open={showing ? "true" : "false"}
            >
              <FamilyMark family={entry.title} size="regular" />
              {/*
                One language, one line, under the mark. The kanji used to
                follow the name from a laptop up, and "Pieces and twists" took
                two lines in its tile; John asked for the label under an icon
                to be English on one row. For a Japanese reader `OneName` gives
                the kanji as the whole label, so this never hides their only
                copy of the name.
              */}
              <OneName en={entry.title} kanji={entry.kanji} />
              {/*
                A dot used to mark the family holding the chosen game, for a
                reader who had browsed away from it. Nobody can be away from
                it now — the open family IS the chosen game's — so the dot
                would sit on the lit chip every time and mark nothing. It went
                with the state that made it necessary.
              */}
            </button>
          );
        })}
      </div>

      {/*
        ROW TWO, AND IT HANGS OFF ROW ONE RATHER THAN SITTING UNDER IT.

        John: "The top row group should have some space of differentiation
        between the games below row." Eleven chips wrap to two lines, so the
        games were a third line of boxes at the same rhythm and the eye read
        three rows of one thing. The rule down the left and the indent say
        these belong to the chip above — an indent costs no height, which
        matters because the Start button has twenty-one pixels of margin
        above an iPad's fold and this whole block is new.

        `role="tabpanel"` moved out here with the container, so what the
        family chip controls is the family's description AND its games, which
        is what it actually controls.
      */}
      <div
        role="tabpanel"
        id="family-games"
        aria-labelledby={`family-tab-${GAME_FAMILIES.indexOf(family)}`}
        className="mt-1 flex min-w-0 flex-col gap-1 border-l-2 border-rule-strong pl-2.5"
        data-testid="set-up-family-games"
      >
        {/*
          WHAT THIS FAMILY IS. John: "Also would be good to see descriptions
          for these categories of games." The line is the one `GAME_FAMILIES`
          already carries and /games already prints, so there is no second
          copy of it to drift — and it doubles as the label that makes the
          indent legible without a heading.

          Two lines on this control and no more: what the family is, here,
          and what the chosen game is, under the grid.
        */}
        <span className="text-xs leading-snug text-muted" data-testid="set-up-family-blurb">
          {family.blurb}
        </span>
        <div className={PICK_GRID}>
        {gamesShownIn(family).map((shown) => {
          const game = shown.variant;
          const copy = RULE_VARIANT_DISPLAY[game];
          return (
            <label
              key={game}
              className={`${PICK_CARD} cursor-pointer gap-1.5 p-1`}
              data-testid="set-up-variant"
              data-variant={game}
              data-chosen={game === value ? "true" : "false"}
              data-listed={shown.listed}
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
              <GameThumb variant={game} size="regular" />
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
                until a laptop, and one language on one line: the name only,
                through `OneName`. With the regular 70px board beside it,
                three columns on an iPad in portrait left 102px and cut seven
                names, so `PICK_GRID` is two columns until a laptop and never
                four. `truncate` and the title stay as the guard for a name
                added later that is longer than any today.
              */}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[0.8125rem] font-medium lg:text-sm" title={copy.label}>
                  <OneName en={copy.label} kanji={copy.kanji} />
                </span>
                {/*
                  A GUEST SAYS WHERE IT LIVES, on one line under its name: "also
                  under Flips". The same game as at home — picking it here
                  starts that game — and the line is what makes seeing it twice
                  read as meant. Not a link: this is inside the label that
                  chooses, and a link there would swallow the choice.

                  0.7rem, the size a board tile's name is set in. Measured at
                  640px, the narrowest two columns: "also under Pieces and
                  twists" wanted 157px of 149 at text-xs, and fits at this.
                */}
                {shown.listed === "shelf" ? (
                  <span className="truncate text-[0.7rem] text-muted" data-testid="set-up-variant-home">
                    {speaker.say("setup.alsoUnder", {
                      family: speaker.pairName(shown.home.title, shown.home.kanji).text,
                    })}
                  </span>
                ) : null}
              </span>
              <PickMark className="size-5" />
            </label>
          );
        })}
        </div>

        {/* What the chosen GAME is, inside the family's block with its games. */}
        {tagline !== undefined ? (
          <span className="text-xs leading-snug text-muted" data-testid="set-up-variant-hint">
            {tagline}
          </span>
        ) : null}
      </div>
    </fieldset>
  );
}
