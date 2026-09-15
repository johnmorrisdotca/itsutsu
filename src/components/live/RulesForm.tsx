"use client";

import { OPENING_DISPLAY } from "@/lib/gomoku/openings.constants";
import {
  MOVE_TIME_OPTIONS,
  SHARED_OPENINGS,
  TIMEOUT_PENALTIES,
} from "@/lib/history/gameSettingsSchema";
import { describeMoveTime } from "@/lib/history/deadline";
import { GAME_COPY } from "@/components/game/game.constants";
import type { RatingRefusal } from "@/lib/rating/rateable.constants";
import { Field, Select, Toggle } from "@/components/ui/Controls";
import type { ReactNode } from "react";
import { GameAndBoardChooser } from "./GameAndBoardChooser";
import { SET_UP_COPY } from "./live.constants";
import { OpeningPicker } from "./OpeningPicker";
import { RatedPicker } from "./RatedPicker";
import { penaltyName } from "./penalty";
import { applyRulesChange, type RulesDraft } from "./rulesDraft";
import { SetUpSection } from "./SetUpSection";

/**
 * How the two biggest choices are drawn. NOT which rules are offered — that
 * is the same set on both screens and always will be, which is the whole
 * reason this form is one component used twice.
 *
 * `select` is the rules panel beside a board: a narrow column next to a game
 * already in progress, where a row of board pictures would crowd out the
 * board it is about.
 *
 * `pictures` is the screen whose entire job is choosing — /games/new, where
 * John's word for the dropdown was UGLY and the games have forty board
 * photographs between them that were going unused.
 */
export const RULES_CHOOSERS = { select: "select", pictures: "pictures" } as const;

export type RulesChooser = (typeof RULES_CHOOSERS)[keyof typeof RULES_CHOOSERS];

/**
 * The rules of a shared game, as a form.
 *
 * One form, used twice: on the setup screen, where it edits a draft and no
 * game exists yet, and in Play apart beside a scratch board, where the board
 * has already chosen the game and the form asks the rest. It knows nothing
 * about either — it is handed a value and gives back the next one — so the two
 * screens cannot come to offer different rules, or the same rule under a
 * different name. Play apart had its own copy of these controls until it
 * rendered this form, and the copy had already drifted: other hints, another
 * order, other test ids.
 *
 * Every change goes through `applyRulesChange`, so a setting that cannot sit
 * with another is corrected here, where somebody can watch it happen, rather
 * than silently on the way into the database.
 */
export function RulesForm({
  value,
  onChange,
  disabled = false,
  /** The setup screen posts a seat by choosing an opponent, so it hides this. */
  showOpen = true,
  /**
   * The setup screen hides this: its address names the game, and a form that
   * could change the game underneath it would leave the two disagreeing —
   * which is the whole thing that screen exists to stop.
   */
  showVariant = true,
  settledByBoard = false,
  variantLabel = "Rules",
  chooser = RULES_CHOOSERS.select,
  refused,
  sections,
  onSizeChosen,
}: {
  value: RulesDraft;
  onChange: (next: RulesDraft) => void;
  disabled?: boolean;
  showOpen?: boolean;
  showVariant?: boolean;
  /**
   * The game, its board and its opening were chosen on a board the reader is
   * already playing at, so this form asks none of the three.
   *
   * Play apart sits beside a scratch board whose own settings panel chooses
   * all three, and its press reads them from that board rather than from this
   * form. Offering them here as well would be a second place to change the
   * game — one that could disagree with the board beside it, which is the
   * same fault `showVariant` exists to stop on the setup screen. The rest (the
   * clock, the penalty, the rating, resigning, the seat) is not the board's to
   * decide, and is asked exactly as it is everywhere else.
   *
   * Not a third `chooser`: that prop says how the choices are DRAWN and
   * promises the same set on both screens. This one says which are ASKED.
   */
  settledByBoard?: boolean;
  /**
   * What to call the chooser at the top.
   *
   * "Rules" is right where a game has already been chosen and this is the set
   * of rules it is played under. It is wrong where the chooser IS the game —
   * on the screen whose whole job is picking one, "Rules" reads as sub-settings
   * and the first thing you do reads as the last.
   */
  variantLabel?: string;
  /**
   * How the game and the board are drawn — see RULES_CHOOSERS. One prop
   * rather than two flags, because it is one decision: whether this is the
   * screen that CHOOSES a game or the panel that AMENDS one. Everything
   * either branch offers comes from the same tables and goes through the
   * same `applyRulesChange`, so the two screens still cannot drift.
   */
  chooser?: RulesChooser;
  /**
   * Why the game this form describes could never count, where that is already
   * settled before it exists — or null while the rating is still a choice.
   *
   * No default, and required of every caller, because it decides whether a
   * control is OFFERED at all, and a prop that could be forgotten would offer
   * it silently. There is one shape today: a fork with nobody to hand the
   * second seat to becomes a board at one screen, and a board at one screen
   * cannot move a rating — the write path reads the seats before it asks the
   * names and never reaches `recordResult`. So a rating chosen here would be
   * stored on the row, shown as chosen, and applied to nothing. Since offers
   * (0.167.0) a fork against a NAMED PERSON binds one seat and offers the
   * other, so it counts like any other game and keeps the control.
   *
   * The fold's summary says what will happen in the control's place rather
   * than the line going quiet about ratings altogether — `describeSettings`
   * takes the same value.
   */
  refused: RatingRefusal | null;
  /**
   * THE SET-UP SCREEN'S GROUPS, drawn open under headings: who you play straight
   * after the board, then these rules, then a handicap.
   *
   * They used to fold behind one grey line, "The rest of the rules", to keep the
   * Start button above an iPad's fold. John, on Halma: "Why can't I choose
   * someone in this Halma page? … where are the options to change other
   * settings?" — and, having found them, "so very hard to see...". A button a
   * reader can reach is worth nothing if the choices above it cannot be seen, so
   * nothing here folds; the page is long, and its headings are what make it
   * readable. The opponent comes first because it is the question people come
   * with after the game: who.
   *
   * The caller's own controls arrive here rather than being reached for, because
   * they live on that screen rather than in these rules. Either may be null
   * where the screen has nothing to ask — a fork, whose opponent and handicap
   * come with the position — and its heading is then not drawn.
   *
   * Absent on the panel beside a board, where every rule is inline.
   */
  sections?: {
    opponent: ReactNode | null;
    handicap: ReactNode | null;
  };
  /**
   * Told when somebody chooses a board themselves, so a caller that was
   * following a default can stop. A chosen board is not a default.
   */
  onSizeChosen?: (size: number) => void;
}) {
  const change = (next: Partial<RulesDraft>) => onChange(applyRulesChange(value, next));
  /*
   * THE TWO QUESTIONS THE SCREEN EXISTS TO ASK: which game, and what board —
   * `GameAndBoardChooser`. Everything below is a setting about a game already
   * chosen.
   */
  const head = settledByBoard ? null : (
    <GameAndBoardChooser
      value={value}
      disabled={disabled}
      showVariant={showVariant}
      variantLabel={variantLabel}
      pictures={chooser === RULES_CHOOSERS.pictures}
      change={change}
      onSizeChosen={onSizeChosen}
    />
  );

  /*
   * The rest: the opening, resigning, the clock, the ratings, and what
   * running out of time costs. Unchanged — they move behind the disclosure
   * exactly as they are — and rendered in the same order whether they are
   * folded or not, so the two screens cannot come to put them differently.
   */
  const rest = (
    <>
      {/*
        The opening is the board's too, where a board has settled the game.
        On the screen that CHOOSES, it is tiles with a picture of each rule;
        beside a board it stays a select, for the reason the game does.
      */}
      {settledByBoard ? null : chooser === RULES_CHOOSERS.pictures ? (
        <OpeningPicker
          value={value.opening}
          variant={value.variant}
          size={value.size}
          disabled={disabled}
          onChange={(next) => change({ opening: next })}
        />
      ) : (
        <Field label="Opening">
          <Select
            value={value.opening}
            disabled={disabled}
            onChange={(event) => change({ opening: event.target.value })}
            data-testid="shared-rules-opening"
          >
            {SHARED_OPENINGS.map((option) => (
              <option key={option} value={option}>
                {OPENING_DISPLAY[option].label}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Toggle
        label={GAME_COPY.allowResign.label}
        hint={GAME_COPY.allowResignHint}
        checked={value.allowResign}
        onChange={(next) => change({ allowResign: next })}
        disabled={disabled}
      />
      {showOpen ? (
        <Toggle
          label={GAME_COPY.openSeat.label}
          hint={GAME_COPY.openSeatHint}
          checked={value.open}
          onChange={(next) => change({ open: next })}
          disabled={disabled}
        />
      ) : null}
      <Field label={GAME_COPY.moveTime.label}>
        <Select
          value={value.moveTimeMs === null ? "none" : String(value.moveTimeMs)}
          disabled={disabled}
          onChange={(event) =>
            change({ moveTimeMs: event.target.value === "none" ? null : Number(event.target.value) })
          }
          data-testid="shared-rules-move-time"
        >
          {MOVE_TIME_OPTIONS.map((option) => (
            <option key={option ?? "none"} value={option === null ? "none" : option}>
              {describeMoveTime(option)}
            </option>
          ))}
        </Select>
      </Field>
      {value.moveTimeMs !== null ? (
        <Field label="Clock">
          <Select
            value={value.clockMode}
            disabled={disabled}
            onChange={(event) => change({ clockMode: event.target.value })}
            data-testid="shared-rules-clock-mode"
          >
            <option value="move">Time is per move</option>
            <option value="game">Time is for the whole game</option>
          </Select>
        </Field>
      ) : null}
      {/*
        NOT OFFERED WHERE THE ANSWER IS ALREADY SETTLED AGAINST IT, because a
        choice taken and thrown away is worse than no choice. A fork with
        nobody becomes two seats in front of one person, which cannot move a
        rating — the write path reads the seats before the names and never
        asks — so this select would take an answer, store it on the row, show
        it as chosen and change nothing, which is the control whose answer is
        discarded this codebase keeps finding. The fact is said instead, in the
        fold's own summary line, from the same `refused`.
      */}
      {chooser === RULES_CHOOSERS.pictures ? (
        /*
          Tiles on the screen that chooses. Where `refused` is set they are
          not drawn either; the fact is, in their place — see RatedPicker.
        */
        <RatedPicker
          value={value.rated}
          refused={refused}
          disabled={disabled}
          onChange={(rated) => change({ rated })}
        />
      ) : refused !== null ? null : (
        <Field label="Ratings">
          <Select
            value={value.rated ? "rated" : "friendly"}
            disabled={disabled}
            onChange={(event) => change({ rated: event.target.value === "rated" })}
            data-testid="shared-rules-rated"
          >
            <option value="rated">Game will affect ratings</option>
            <option value="friendly">Game will NOT affect ratings</option>
          </Select>
        </Field>
      )}
      {/*
        The hint explains all three, because this is where somebody is choosing
        between them and the option itself is only a name. What this game's
        setting actually means is said in full in the statement, once there is
        nothing left to choose.
      */}
      {value.moveTimeMs !== null && value.clockMode !== "game" ? (
        <Field label={GAME_COPY.penalty.label} hint={GAME_COPY.penaltyHint}>
          <Select
            value={value.timeoutPenalty}
            disabled={disabled}
            onChange={(event) => change({ timeoutPenalty: event.target.value })}
            data-testid="shared-rules-penalty"
          >
            {TIMEOUT_PENALTIES.map((option) => (
              <option key={option} value={option}>
                {penaltyName(option)}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
    </>
  );

  /* Inline, unless the caller has groups of its own to draw these among. */
  if (sections === undefined) {
    return (
      <>
        {head}
        {rest}
      </>
    );
  }
  const words = SET_UP_COPY.sections;
  return (
    <>
      {head}
      {sections.opponent !== null ? (
        <SetUpSection title={words.opponent.title} kanji={words.opponent.kanji} testId="set-up-who">
          {sections.opponent}
        </SetUpSection>
      ) : null}
      <SetUpSection title={words.rules.title} kanji={words.rules.kanji} testId="set-up-rules">
        {rest}
      </SetUpSection>
      {sections.handicap !== null ? (
        <SetUpSection title={words.handicap.title} kanji={words.handicap.kanji} testId="set-up-handicap-group">
          {sections.handicap}
        </SetUpSection>
      ) : null}
    </>
  );
}
