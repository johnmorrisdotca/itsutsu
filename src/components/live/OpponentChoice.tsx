"use client";

import { useId, type ReactNode } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { Paired } from "@/components/i18n/Paired";
import { SECTION_TITLE } from "@/components/ui/ui.constants";
import { BOT_PROFILES } from "@/lib/gomoku/opponent.constants";
import { shownName } from "@/lib/rating/shownName";

import { ANYONE, opponentGroups, shownChoice } from "./opponentOptions";
import { PickMark } from "./PickMark";
import {
  OPPONENT_GROUP_WORDS,
  PICK_CARD,
  PICK_PEOPLE,
  SEAT_MARK_ANYONE,
  SEAT_MARK_COMPUTER,
  SEAT_MARK_PERSON,
} from "./picker.constants";
import type { OpponentChoiceProps, OpponentGroup, OpponentTile } from "./picker.types";
import { POST_FOR_ANYONE } from "./setUpWords";

/**
 * WHO THE GAME IS AGAINST, as tiles.
 *
 * The last dropdown on the set-up screen, and the one with the most in it:
 * nobody in particular, somebody the address asked for, whoever is here, the
 * players you know, and the programs that play this game. The select hid all of
 * that behind one line. Tiles show it — each person with their initial on a
 * stone, each program with its own script on a black one and its grade under
 * its name, and the chosen program's own description under the programs.
 *
 * SO A NAMED OPPONENT IS A TILE LIKE ANY OTHER, chosen, and added when they are
 * not otherwise on the list — a player met in the directory is nobody's buddy
 * and may not be here now, and a chooser that silently dropped them would
 * answer "Play" with a posted seat for anyone. See `opponentGroups`.
 *
 * It is a choice rather than a fixed line of text on purpose. John's reason for
 * wanting this screen in front of every way in was that it is the place where
 * things can still be changed; a heading that says who this is against and a
 * control that will not let you change your mind is half a screen.
 *
 * ONE RADIO GROUP ACROSS EVERY HEADING. The runs are drawn apart for the eye,
 * but the radios share a name, so the arrows walk from "for anyone" through
 * the people to the programs without a tab stop at each heading.
 */
export function OpponentChoice({
  value,
  onChange,
  variant,
  opponents,
  named,
  disabled = false,
  signedIn,
}: OpponentChoiceProps) {
  const say = useSpeaker().say;
  const groups = opponentGroups({ variant, opponents, named });
  const shown = shownChoice(value, groups);
  const inert = disabled || !signedIn;

  return (
    <fieldset className="flex min-w-0 flex-col gap-2" data-testid="set-up-with">
      <legend className="mb-0.5 text-sm text-ink-soft">{say("setup.opponent")}</legend>
      <div className={PICK_PEOPLE}>
        {/*
          THE WORDS FROM `setUpWords.ts`, WHICH IS WHERE THEY ARE DECIDED. The
          folded summary line stands in for this choice while the drawer is shut,
          so the two have to say the same thing a press apart.
        */}
        <Tile
          value={ANYONE}
          shown={shown}
          disabled={inert}
          onChange={onChange}
          mark={<span aria-hidden="true" className={SEAT_MARK_ANYONE} />}
          title={POST_FOR_ANYONE}
          line={say("setup.anyoneMeans")}
          computer={false}
          name=""
        />
      </div>
      {groups.map((group) => (
        <Run key={group.kind} group={group} shown={shown} disabled={inert} onChange={onChange} />
      ))}
    </fieldset>
  );
}

/** One heading and the people or programs under it. */
function Run({
  group,
  shown,
  disabled,
  onChange,
}: {
  group: OpponentGroup;
  shown: string;
  disabled: boolean;
  onChange: (next: string) => void;
}) {
  const speaker = useSpeaker();
  const heading = useId();
  const words = speaker.pair(OPPONENT_GROUP_WORDS[group.kind].phrase, OPPONENT_GROUP_WORDS[group.kind].kanji);
  const program = group.tiles.find((tile) => tile.value === shown && tile.tier !== null);

  return (
    <div
      role="group"
      aria-labelledby={heading}
      className="flex min-w-0 flex-col gap-1.5"
      data-testid="set-up-opponent-group"
      data-group={group.kind}
    >
      <span id={heading} className={SECTION_TITLE}>
        {words.text}
        {words.kanji !== null ? (
          <>
            {" "}
            <span className="font-mincho normal-case tracking-normal">{words.kanji}</span>
          </>
        ) : null}
      </span>
      <div className={PICK_PEOPLE}>
        {group.tiles.map((tile) => (
          <Tile key={tile.value} {...tileWords(tile)} shown={shown} disabled={disabled} onChange={onChange} />
        ))}
      </div>
      {/*
        What the chosen program is like, under the programs — the way the game
        picker prints the chosen game's tagline under the games. One blurb for
        the one being decided about, rather than six paragraphs nobody chose.
      */}
      {program?.tier != null ? (
        <span className="text-xs leading-snug text-muted" data-testid="set-up-opponent-hint">
          {BOT_PROFILES[program.tier].blurb}
        </span>
      ) : null}
    </div>
  );
}

/** A tile's picture and words, from who it is. */
function tileWords(tile: OpponentTile) {
  const shownAs = tile.computer ? tile.name : shownName(tile.name);
  const profile = tile.tier === null ? null : BOT_PROFILES[tile.tier];
  const initial = Array.from(profile?.native ?? shownAs)[0] ?? "";
  return {
    value: tile.value,
    name: tile.name,
    computer: tile.computer,
    mark: (
      <span aria-hidden="true" className={tile.computer ? SEAT_MARK_COMPUTER : SEAT_MARK_PERSON}>
        {initial}
      </span>
    ),
    title:
      profile === null ? (
        shownAs
      ) : (
        <Paired en={tile.name} kanji={profile.native ?? ""} kanjiClassName="text-xs font-normal opacity-70" />
      ),
    line: profile?.strength ?? null,
  };
}

function Tile({
  value,
  shown,
  disabled,
  onChange,
  mark,
  title,
  line,
  computer,
  name,
}: {
  value: string;
  shown: string;
  disabled: boolean;
  onChange: (next: string) => void;
  mark: ReactNode;
  title: ReactNode;
  line: string | null;
  computer: boolean;
  name: string;
}) {
  const checked = value === shown;
  return (
    <label
      className={`${PICK_CARD} min-h-12 cursor-pointer gap-2.5 p-2 pr-8`}
      data-testid="set-up-opponent"
      data-opponent={value}
      data-computer={computer ? "true" : "false"}
      data-name={name}
      data-chosen={checked ? "true" : "false"}
    >
      <input
        type="radio"
        name="set-up-opponent"
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="peer sr-only"
      />
      {mark}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">{title}</span>
        {line !== null ? <span className="text-xs leading-snug text-muted">{line}</span> : null}
      </span>
      <PickMark className="absolute top-1.5 right-1.5 size-5" />
    </label>
  );
}
