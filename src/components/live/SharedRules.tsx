import { OPENING_RULES } from "@/lib/gomoku/gomoku.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { OPENING_DISPLAY } from "@/lib/gomoku/openings.constants";
import type { OpeningRule, RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { GameDetail } from "@/lib/history/gameHistory.types";

import { SectionTitle } from "@/components/ui/Controls";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { RATING_REFUSAL_DISPLAY, type RatingRefusal } from "@/lib/rating/rateable.constants";
import { MoreSettings } from "./MoreSettings";
import { RulesStatement } from "./RulesStatement";
import { SHARED_RULES_COPY } from "./live.constants";
import { draftFromGame } from "./rulesDraft";
import { describeHandicap, describeRules, describeSettings } from "./rulesSummary";

/**
 * THE RULES BESIDE A BOARD: A STATEMENT, FOLDED SMALL.
 *
 * John, in the same breath as asking for the doorstep: "We do not want to see
 * that Game board with all the settings on the side… the board means we're
 * playing!!!!"
 *
 * TWO THINGS WENT WRONG HERE AND ONLY ONE HAD BEEN FIXED. The panel used to be
 * a FORM for a game nobody had answered yet, which is how the rules of a posted
 * seat could move under whoever took it; 0.156.0 closed most of that by settling
 * the rules the moment somebody else arrives. What was left was the other half:
 * the panel was still a form for the creator of an unanswered game, and still a
 * column of nine labelled rows for everybody else. A board with the whole rule
 * sheet open beside it does not read as a game in progress.
 *
 * So there is no form here at all, at any stage. The rules were agreed on the
 * doorstep before the game existed — that is the whole point of that page — and
 * a board is not the place to re-offer them. A creator who got the clock wrong
 * cancels the game, which is one control away on a board with no stones on it,
 * and sets it up again; that is a cheaper answer than a window in which one seat
 * can change what the other agreed to, and it cannot be got wrong.
 *
 * AND IT IS COMPACT. One line saying what the game is, the two things that are
 * facts about its STATE rather than its rules — a seat still posted, a game that
 * will move no rating — and everything else behind the site's own disclosure,
 * summarised by the line it folds under. Somebody who wants to check the penalty
 * for running out of time is one tap away; somebody who came to play is looking
 * at a board.
 *
 * The disclosure is the same component the setup screen folds its settings into,
 * and the rows inside are the same `RulesStatement` the doorstep shows. So what
 * was agreed, what is about to be played and what is being played are one set of
 * words in three places rather than three descriptions that can drift.
 */
export function SharedRules({
  game,
  refusal,
}: {
  game: GameDetail;
  /**
   * Why this game will move no rating, when it will not. Decided on the
   * server — the rule reads the kept-record table — and said here rather than
   * discovered afterwards, when the ladder has not moved and there is nothing
   * left to ask.
   */
  refusal: RatingRefusal | null;
}) {
  const variant = game.variant as RuleVariant;
  const copy = RULE_VARIANT_DISPLAY[variant];
  const handicap = describeHandicap(game.handicap);

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="shared-rules">
      <SectionTitle kanji="規則">Rules</SectionTitle>
      <p className="text-sm font-semibold" data-testid="shared-rules-line">
        {describeRules(game)}
      </p>
      {/*
        A seat still on the noticeboard, and a game that will count for nothing.
        Both stay OUT of the fold, because neither is a rule: they are things
        about this game right now that somebody looking at the board would want to
        know without being told to look.
      */}
      {game.openSeat !== null ? (
        <p className="text-xs text-moss" data-testid="shared-open-line">
          The {game.openSeat} seat is posted on the games page for anyone to take.
        </p>
      ) : null}
      {refusal !== null ? (
        <p
          className="rounded-lg border border-ochre/60 bg-ochre-soft px-3 py-2 text-xs text-ink"
          data-testid="shared-unrated-line"
        >
          <span className="font-semibold">{RATING_REFUSAL_DISPLAY[refusal].playing}</span>{" "}
          <span className="font-mincho">{RATING_REFUSAL_DISPLAY[refusal].kanji}</span>
          {". "}
          {RATING_REFUSAL_DISPLAY[refusal].sentence}
        </p>
      ) : null}

      {/*
        THE REFUSAL GOES INTO THE FOLD AS WELL AS ABOVE IT.
        The notice above said "this game will not count" while the summary line
        of this very disclosure said "Rated", read straight off `game.rated`,
        and the statement inside it said "Counts towards ratings". One panel,
        one screen, three lines apart, and twelve production rows displayed it.
        The refusal is already computed on the server; both places take it.
      */}
      <MoreSettings summary={describeSettings(game, refusal)}>
        {copy !== undefined ? <p className="text-xs text-muted">{copy.tagline}</p> : null}
        {game.opening !== OPENING_RULES.free && game.opening in OPENING_DISPLAY ? (
          <p className="text-xs text-muted">{OPENING_DISPLAY[game.opening as OpeningRule].tagline}</p>
        ) : null}
        {handicap !== null ? (
          <p className="text-xs text-muted">{SHARED_RULES_COPY.handicapMeans}</p>
        ) : null}
        {/*
          The same rows the doorstep showed, with a note saying why they are
          answers: they were settled before this game was written, which is a
          different reason from the one that used to be given here and the true
          one now that nothing after the doorstep can change them.
        */}
        <RulesStatement rules={draftFromGame(game)} note={SHARED_RULES_COPY.settled} refusal={refusal} />
        <p className="text-xs text-muted" data-testid="shared-times-line">
          Started {new Date(game.playedAt).toLocaleString()}
          {game.status === "finished" && game.lastMoveAt !== null
            ? ` · finished ${new Date(game.lastMoveAt).toLocaleString()}`
            : ""}
        </p>
      </MoreSettings>
    </section>
  );
}
