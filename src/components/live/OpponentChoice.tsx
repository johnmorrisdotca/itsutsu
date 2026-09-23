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
import { ANSWER_ROW_OPPONENT, ANSWER_ROW_SEAT, ANSWER_ROW_WIDE, OPPONENT_GROUPS } from "./picker.constants";
import { PickMark } from "./PickMark";
import {
  OPPONENT_GROUP_WORDS,
  PICK_CARD,
  PICK_MORE,
  PICK_PEOPLE,
  RANDOM_COMPUTER_WORDS,
} from "./picker.constants";
import type { OpponentChoiceProps, OpponentGroup, OpponentTile } from "./picker.types";
import { SetUpFold } from "./SetUpFold";
import { SeatMark } from "./SeatMark";
import { POST_FOR_ANYONE } from "./setUpWords";
import { measuredLine } from "./measuredLine";

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
    /*
     * ONE ROW OF ANSWERS FROM A TABLET UP — the posted seat, then each list,
     * side by side, and whichever list is open as a band under them. See
     * `ANSWER_ROW`: John asked for "1 row with 3 columns… and can open up when
     * clicking things that have more room needed".
     */
    <fieldset className={`min-w-0 ${ANSWER_ROW_OPPONENT}`} data-testid="set-up-with">
      {/* Named for a screen reader; the section heading above it says it to the eye. */}
      <legend className="sr-only">{say("setup.opponent")}</legend>
      {/*
        The posted seat is one tile, and in the row it is one cell: the tile
        fills it rather than sitting in a third of a grid of its own. Below a
        tablet it keeps the people grid it always had.
      */}
      <div className={ANSWER_ROW_SEAT}>
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
          /*
           * WHAT IT MEANS, AND NOT WHERE IT WAITS. `postedWhere` — "It waits on
           * the Games page until somebody takes it" — is said again, in full,
           * in the seating sentence over the button, which now states the whole
           * game. Two lines a screen apart saying one thing is the repetition
           * John named on 2026-09-21, and this tile is the one that can afford
           * to lose it: the sentence below is the statement, this is the choice.
           */
          line={say("setup.anyoneMeans")}
          // A posted seat is whoever takes it, so there is no grade to measure.
          measured={null}
          computer={false}
          name=""
        />
      </div>
      {groups.map((group) => (
        <Run
          key={group.kind}
          group={group}
          variant={variant}
          shown={shown}
          /*
           * Whether the OPPONENT QUESTION has an answer — which decides whether
           * a run is a question in front of you or a way to change your mind.
           * Asked over every group rather than inside one, because a run cannot
           * see the others.
           *
           * A POSTED SEAT IS AN ANSWER, and reading it as one is what took the
           * set-up screen from four phone-fulls to one. It used to ask only
           * whether somebody had been chosen from these LISTS, so a fresh game
           * — where "post the seat for anyone" is chosen and drawn, first,
           * above the lists — counted as unanswered and every run opened:
           * thirteen full-width tiles of people and programs on a screen whose
           * question was already answered. John, 2026-09-21: "one viewport
           * should be all the info, when collapsed… I don't like the user
           * scrolling to the bottom a lot to have to click next or play."
           *
           * It does not weaken the rule the fold was built on. That rule is
           * that a fold must not hide a question nobody has answered, and the
           * answer here is not hidden: it is the tile above these runs, chosen,
           * with its own mark and its own words. What the runs hold is the
           * other ways to answer, and each one's closed row says how many are
           * inside it.
           */
          answered={shown === ANYONE || groups.some((one) => one.tiles.some((tile) => tile.value === shown))}
          /*
           * THE PEOPLE YOU KNOW ARE OPEN WHILE NOBODY HAS BEEN CHOSEN.
           *
           * John, 2026-09-21, after a count of the clicks: "If you know the
           * person that saves you time and tells you something. no game or
           * process should take 3 screens/clicks." Folding every run took the
           * screen from four phone-fulls to under two, and it also made
           * KNOWING somebody cost an extra press — open the list, then them,
           * then Begin. That is backwards: a buddy list is short, it is the
           * likeliest answer on the screen, and it is the one run whose
           * length cannot run away with the page.
           *
           * Only while the answer is still the posted seat. Once somebody has
           * chosen a program or a person, every run folds to its summary and
           * this one with them — the screen is then about what was chosen
           * rather than about choosing.
           */
          openAnyway={group.kind === OPPONENT_GROUPS.known && shown === ANYONE}
          disabled={cannotName}
          onChange={onChange}
        />
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
        <p className={`text-xs text-muted ${ANSWER_ROW_WIDE}`} data-testid="set-up-opponent-elsewhere">
          {SET_UP_COPY.elsewhere}{" "}
          <Link href="/players" className="underline underline-offset-4 hover:text-ink">
            {SET_UP_COPY.elsewhereLink}
          </Link>{" "}
          {SET_UP_COPY.elsewhereAfter}
        </p>
      ) : signedIn ? (
        <p className={`text-xs text-muted ${ANSWER_ROW_WIDE}`} data-testid="set-up-ask-needs-account">
          {ASK_NEEDS_ACCOUNT}
        </p>
      ) : null}
    </fieldset>
  );
}

/** One heading and the people or programs under it. */
function Run({
  group,
  variant,
  shown,
  answered,
  openAnyway,
  disabled,
  onChange,
}: {
  group: OpponentGroup;
  /** The game being set up: a measured strength is a claim about ONE game. */
  variant: string;
  shown: string;
  /** Whether any of these lists holds the chosen opponent. See the call site. */
  answered: boolean;
  /** Open this run whatever the answer is — the people you know. See the call site. */
  openAnyway: boolean;
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

  const body = (
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
          <Tile key={tile.value} {...tileWords(tile, variant)} shown={shown} disabled={disabled} onChange={onChange} />
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

        UNDER THE LIST RATHER THAN ON THE FOLDED ROW. It is a paragraph, and a
        paragraph on a one-line summary makes the folded row eight lines tall,
        which is the scrolling this fold exists to end. The row carries the
        short line instead — the same one the tile carries.
      */}
      {program?.tier != null ? (
        <span className="text-xs leading-snug text-muted" data-testid="set-up-opponent-hint">
          {BOT_PROFILES[program.tier].blurb}
        </span>
      ) : null}
    </div>
  );

  /*
   * A RUN HOLDING THE CHOSEN OPPONENT FOLDS DOWN TO THEM — John, 2026-09-18:
   * "Same goes for The computer. Keep it closed to Guoshou and only change if I
   * click to expand it." Written about the run rather than about the computers,
   * because it is the same fact either way: this list is answered, that one is
   * not, and the run somebody chose from is the one worth showing them.
   *
   * WHETHER ANYBODY IS CHOSEN DECIDES HOW THIS OPENS, AND NOTHING AFTER THAT.
   *
   * A run arrives folded when the screen already has an opponent — John's
   * rematch, a challenge, a Play pressed on somebody's page — and open when
   * nobody is chosen, because then every list is a question and a question is
   * not folded away behind a summary of nothing.
   *
   * IT IS THE FIRST STATE ONLY, never a live one, and that is a fix rather
   * than a detail. Deciding it on every render meant the lists FOLDED THE
   * MOMENT somebody chose from them — and choosing with the arrow keys walks
   * the radio group, so the group closed around the keyboard's own focus and
   * the next arrow went nowhere. `set-up-choices.spec.ts` presses those arrows;
   * it found this, twice, in two different shapes.
   */
  const mine = group.tiles.find((tile) => tile.value === shown);
  return (
    <SetUpFold
      title={words.text}
      kanji={words.kanji ?? ""}
      testId="set-up-opponent-fold"
      group={group.kind}
      openInitially={!answered || openAnyway}
      summary={
        mine === undefined ? (
          /*
           * A RUN THAT DOES NOT HOLD THE CHOSEN OPPONENT SAYS HOW MANY ARE IN
           * IT, never a name. Once somebody is chosen, the other lists are the
           * way to change your mind rather than the question in front of you —
           * and twenty-seven people between you and the program you picked is
           * the scrolling this fold exists to end. A count is true of a list
           * nobody has answered; a name would not be.
           */
          <span className="font-normal text-muted">{SET_UP_COPY.fold.among(group.tiles.length)}</span>
        ) : (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex min-w-0 items-center gap-2">
              <SeatMark kind={mine.computer ? "computer" : "person"} size="small">
                {markLetter(mine)}
              </SeatMark>
              <span className="truncate">{tileWords(mine, variant).title}</span>
            </span>
            {tileWords(mine, variant).line === null ? null : (
              <span className="text-xs leading-snug font-normal text-muted" data-testid="set-up-opponent-strength">
                {tileWords(mine, variant).line}
              </span>
            )}
          </span>
        )
      }
    >
      {body}
    </SetUpFold>
  );
}

/**
 * The one letter in somebody's mark — their own script where they have one.
 *
 * Its own function because the tile and the folded row above it draw the same
 * mark, and a second copy of this is a second place for 国手 to become a G.
 */
function markLetter(tile: OpponentTile): string {
  if (tile.value === RANDOM_COMPUTER) return RANDOM_COMPUTER_WORDS.mark;
  const profile = tile.tier === null ? null : BOT_PROFILES[tile.tier];
  const shownAs = tile.computer ? tile.name : shownName(tile.name);
  return Array.from(profile?.native ?? shownAs)[0] ?? "";
}

/** A tile's picture and words, from who it is and which game is being set up. */
function tileWords(tile: OpponentTile, variant: string) {
  const shownAs = tile.computer ? tile.name : shownName(tile.name);
  const profile = tile.tier === null ? null : BOT_PROFILES[tile.tier];
  const random = tile.value === RANDOM_COMPUTER;
  const initial = markLetter(tile);
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
    /*
     * What this grade MEASURED at this game, under what it says it tries to
     * do. Two different claims, and the second is the one that has been
     * checked: `strength` is a description, this is a round robin. Nothing is
     * drawn where nothing has been measured for this game against the code
     * that is running.
     */
    measured: measuredLine(tile.tier, variant),
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
  measured,
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
  measured: string | null;
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
        {/*
          What it MEASURED here, under what it says it tries to do. Drawn only
          where a round robin exists for this game at the running code.
        */}
        {measured !== null ? (
          <span className="text-xs leading-snug text-ink-soft" data-testid="set-up-opponent-measured">
            {measured}
          </span>
        ) : null}
      </span>
      <PickMark className="absolute top-1.5 right-1.5 size-5" />
    </label>
  );
}
