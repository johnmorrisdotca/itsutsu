import { CAPTURE_CHOICES, CROWN_MID_CAPTURE, ENDGAME_COUNT_KINDS, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { CheckersRules, EndgameCount, PieceTally, RuleVariant } from "@/lib/gomoku/gomoku.types";
import { NO_PROGRESS_RULES, PROGRESS_MEASURES } from "@/lib/gomoku/rules/noProgress";
import type { Speaker } from "@/lib/i18n/i18n";

/**
 * The rules page's sentences for a game of the checkers family, written from
 * its `CheckersRules` rather than from its name — so International Draughts
 * and Canadian Checkers, which differ only in their board, cannot be described
 * differently, and English checkers reads exactly as it did before the family
 * had other games in it. Every sentence is a phrase (`rulespage.checkers.*`),
 * said in the reader's language.
 */

/**
 * A short list in words: "a", "a or b", "a, b or c". A list of whole phrases
 * (`long`) is joined with its own "or", which Japanese says more firmly than
 * it does for two bare numbers.
 */
function either(say: Speaker, items: string[], long = false): string {
  if (items.length === 1) return items[0] as string;
  const head = items.slice(0, -1).join(say.locale === "ja" ? "、" : ", ");
  return say.say(long ? "rulespage.list.orEither" : "rulespage.list.or", { head, last: items[items.length - 1] as string });
}

function rulesOf(variant: RuleVariant): CheckersRules {
  const rules = VARIANT_SPECS[variant].checkersRules;
  if (rules === null) throw new Error(`${variant} is not a game of the checkers family`);
  return rules;
}

/** What the board holds at the start. */
export function checkersBoardLine(variant: RuleVariant, size: number, say: Speaker): string {
  const rules = rulesOf(variant);
  const men = (rules.menRows * size) / 2;
  return say.say("rulespage.checkers.board", {
    dark: say.words((size * size) / 2),
    all: say.words(size * size),
    men: say.words(men),
    rows: say.words(rules.menRows),
  });
}

/** How a turn goes: stepping, capturing, carrying a capture on, crowning, and how the game ends. */
export function checkersPlayLines(variant: RuleVariant, say: Speaker): string[] {
  const rules = rulesOf(variant);
  const lines = [say.say("rulespage.checkers.step")];

  if (!rules.menCaptureBackward && rules.captureChoice === CAPTURE_CHOICES.free) {
    lines.push(say.say("rulespage.checkers.forcedFree"));
  } else {
    lines.push(say.say(rules.menCaptureBackward ? "rulespage.checkers.menBackward" : "rulespage.checkers.menForward"));
    lines.push(say.say(rules.captureChoice === CAPTURE_CHOICES.maximum ? "rulespage.checkers.choiceMost" : "rulespage.checkers.choiceFree"));
  }

  if (rules.crownMidCapture === CROWN_MID_CAPTURE.stops) {
    lines.push(say.say("rulespage.checkers.crownStops"));
  } else {
    lines.push(say.say(rules.crownMidCapture === CROWN_MID_CAPTURE.passes ? "rulespage.checkers.crownPasses" : "rulespage.checkers.crownAtOnce"));
  }
  if (rules.flyingKings || rules.menCaptureBackward) {
    lines.push(say.say("rulespage.checkers.afterCapture"));
  }

  lines.push(say.say(rules.flyingKings ? "rulespage.checkers.crownFlying" : "rulespage.checkers.crownPlain"));
  lines.push(say.say("rulespage.checkers.gameEnd"));
  return lines;
}

/** A side's pieces in words: "two kings and a man", "a king". */
function tallyWords(say: Speaker, tally: PieceTally): string {
  const kings =
    tally.kings === 0
      ? null
      : tally.kings === 1
        ? say.say("rulespage.checkers.kingOne")
        : say.say("rulespage.checkers.kingMany", { count: say.words(tally.kings) });
  const men =
    tally.men === 0
      ? null
      : tally.men === 1
        ? say.say("rulespage.checkers.manOne")
        : say.say("rulespage.checkers.manMany", { count: say.words(tally.men) });
  if (kings !== null && men !== null) return say.say("rulespage.checkers.tally", { kings, men });
  return kings ?? men ?? "";
}

/**
 * The named endings of a count, in one clause. A run of kings against the same
 * lone opponent that climbs one king at a time to the most a side can hold is
 * "three or more kings", which is what it means.
 */
function endingsWords(say: Speaker, endings: readonly (readonly [PieceTally, PieceTally])[]): string {
  const against = endings[0][1];
  const sameOpponent = endings.every(([, other]) => other.kings === against.kings && other.men === against.men);
  if (!sameOpponent) {
    return either(
      say,
      endings.map(([one, other]) => say.say("rulespage.checkers.against", { one: tallyWords(say, one), other: tallyWords(say, other) })),
      true,
    );
  }
  const firsts = endings.map(([one]) => one);
  const climbing =
    firsts.length >= 3 && firsts.every((one, at) => one.men === 0 && one.kings === firsts[0].kings + at);
  if (climbing) {
    return say.say("rulespage.checkers.kingsOrMore", { count: say.words(firsts[0].kings), against: tallyWords(say, against) });
  }
  return say.say("rulespage.checkers.against", {
    one: either(
      say,
      firsts.map((one) => tallyWords(say, one)),
      true,
    ),
    other: tallyWords(say, against),
  });
}

/** One count, as a sentence. */
function countLine(count_: EndgameCount, say: Speaker): string {
  if (count_.kind === ENDGAME_COUNT_KINDS.balance) {
    return say.say("rulespage.checkers.drawBalance", {
      pieces: either(
        say,
        count_.pieces.map((pieces) => say.words(pieces)),
      ),
      moves: say.words(count_.movesEach),
    });
  }
  return say.say(count_.restartsOnChange ? "rulespage.checkers.drawCountFresh" : "rulespage.checkers.drawCountOnce", {
    ending: endingsWords(say, count_.endings),
    moves: say.words(count_.movesEach),
  });
}

/** The ways the game can be drawn, as this site applies them. */
export function checkersDrawLines(variant: RuleVariant, say: Speaker): string[] {
  const rules = rulesOf(variant);
  const lines: string[] = [];
  const idle = NO_PROGRESS_RULES[variant];
  if (idle !== undefined && idle.measure === PROGRESS_MEASURES.taking) {
    lines.push(say.say("rulespage.checkers.drawIdle", { moves: say.words(idle.plies / 2) }));
  }
  if (rules.repetitionDraw !== null) {
    lines.push(say.say("rulespage.checkers.drawRepeat"));
  }
  for (const entry of rules.endgameCounts) lines.push(countLine(entry, say));
  return lines;
}
