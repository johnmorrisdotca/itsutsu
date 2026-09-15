"use client";

import { useId, useState, type ReactNode } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { Paired } from "@/components/i18n/Paired";
import { SECTION_TITLE } from "@/components/ui/ui.constants";
import { BOT_PROFILES } from "@/lib/gomoku/opponent.constants";
import { shownName } from "@/lib/rating/shownName";

import Link from "next/link";

import { ASK_NEEDS_ACCOUNT, SET_UP_COPY } from "./live.constants";
import { ANYONE, RANDOM_COMPUTER, capTiles, opponentGroups, shownChoice } from "./opponentOptions";
import { PickMark } from "./PickMark";
import {
  OPPONENT_GROUP_WORDS,
  PICK_CARD,
  PICK_MORE,
  PICK_PEOPLE,
  RANDOM_COMPUTER_WORDS,
} from "./picker.constants";
import type { OpponentChoiceProps, OpponentGroup, OpponentTile } from "./picker.types";
import { SeatMark } from "./SeatMark";
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
  canAsk,
}: OpponentChoiceProps) {
  const say = useSpeaker().say;
  const groups = opponentGroups({ variant, opponents, named });
  const shown = shownChoice(value, groups);
  /*
   * TWO GATES, BECAUSE THEY ARE TWO ROUTES. A seat for anyone is a posted game,
   * which a session is enough for; a person or a program is a challenge, which
   * the route answers with 401 unless the caller has an address. An invite
   * holder is the reader with the first and not the second.
   */
  const inert = disabled || !signedIn;
  const cannotName = disabled || !canAsk;

  return (
    <fieldset className="flex min-w-0 flex-col gap-2" data-testid="set-up-with">
      {/* Named for a screen reader; the section heading above it says it to the eye. */}
      <legend className="sr-only">{say("setup.opponent")}</legend>
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
          mark={<SeatMark kind="anyone" size="regular" />}
          title={POST_FOR_ANYONE}
          line={`${say("setup.anyoneMeans")} ${SET_UP_COPY.postedWhere}`}
          computer={false}
          name=""
        />
      </div>
      {groups.map((group) => (
        <Run key={group.kind} group={group} shown={shown} disabled={cannotName} onChange={onChange} />
      ))}
      {/*
        NOBODY IS A DEAD END. The lists hold whoever is here and the players this
        member knows; anybody else is one page away, and that page's Challenge
        lands back here with them chosen.

        Only for an account, because only an account is offered that Challenge:
        sent to /players, an invite holder would find no button there, which is
        a promise this line cannot keep for them. They are told instead why the
        names above cannot be chosen — in words, not by tiles that simply refuse.
      */}
      {canAsk ? (
        <p className="text-xs text-muted" data-testid="set-up-opponent-elsewhere">
          {SET_UP_COPY.elsewhere}{" "}
          <Link href="/players" className="underline underline-offset-4 hover:text-ink">
            {SET_UP_COPY.elsewhereLink}
          </Link>{" "}
          {SET_UP_COPY.elsewhereAfter}
        </p>
      ) : signedIn ? (
        <p className="text-xs text-muted" data-testid="set-up-ask-needs-account">
          {ASK_NEEDS_ACCOUNT}
        </p>
      ) : null}
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
  const grid = useId();
  /*
   * Folded or not, per run, and only here: which of a long list is on screen
   * is a reading preference for this visit, not a setting of the game. A press
   * redraws what is already in the page — no request, no address.
   */
  const [expanded, setExpanded] = useState(false);
  /*
   * Whoever was chosen when the run was last folded — or when the page arrived,
   * which for a challenge is the person it was filled in with. Kept on screen
   * beside whoever is chosen now, so an arrow press away from a pre-filled
   * opponent does not fold them out of reach. See `capTiles`.
   */
  const [pinned, setPinned] = useState(shown);
  const run = capTiles(group.tiles, [pinned, shown], expanded);
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
      <div id={grid} className={PICK_PEOPLE}>
        {run.visible.map((tile) => (
          <Tile key={tile.value} {...tileWords(tile)} shown={shown} disabled={disabled} onChange={onChange} />
        ))}
      </div>
      {run.capped ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={grid}
          onClick={() => {
            // Folding keeps whoever is chosen at that moment, wherever they sat in the open run.
            if (expanded) setPinned(shown);
            setExpanded(!expanded);
          }}
          className={PICK_MORE}
          data-testid="set-up-opponent-more"
          data-group={group.kind}
          data-expanded={expanded ? "true" : "false"}
        >
          {expanded ? speaker.say("setup.showFewer") : speaker.say("setup.showAll", { count: String(run.total) })}
        </button>
      ) : null}
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
  const random = tile.value === RANDOM_COMPUTER;
  const initial = random ? RANDOM_COMPUTER_WORDS.mark : (Array.from(profile?.native ?? shownAs)[0] ?? "");
  return {
    value: tile.value,
    name: tile.name,
    computer: tile.computer,
    mark: (
      <SeatMark kind={tile.computer ? "computer" : "person"} size="regular">
        {initial}
      </SeatMark>
    ),
    title:
      profile === null ? (
        shownAs
      ) : (
        <Paired en={tile.name} kanji={profile.native ?? ""} kanjiClassName="text-xs font-normal opacity-70" />
      ),
    line: profile?.strength ?? (random ? RANDOM_COMPUTER_WORDS.means : null),
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
