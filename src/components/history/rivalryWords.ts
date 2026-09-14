import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import type { Speaker } from "@/lib/i18n/i18n";
import { shownName } from "@/lib/rating/shownName";
import type { RivalryLine, RivalrySeat, RivalryTallyShown, RivalryView } from "@/lib/record/rivalry.types";

/**
 * THE RIVALRY BOARD'S WORDS, decided without React so they can be tested.
 *
 * `rivalry.ts` chose WHICH fact to say; this says it, in the reader's language,
 * and settles the one thing the pure module cannot know: whether the reader is
 * one of the two. "You" is said only then. Anybody else reads both names.
 *
 * EVERY KEY IS WRITTEN OUT WHOLE, never built as `rivalry.${kind}.you`. The
 * phrase gate (`i18n.coverage.test.ts`) finds a phrase in use by its literal
 * key, so a key assembled at runtime would read as a phrase nobody says — and a
 * typo in one would be a sentence with a key in it, which nothing would report.
 */

type Who = Pick<RivalryView, "one" | "other" | "readerIsOne">;

/** A seat's name as a sentence says it: shortened the way every list shortens it. */
export function seatWord(say: Speaker, seat: RivalrySeat): string {
  const shown = shownName(seat.name);
  return shown === "" ? say.say("rivalry.unnamed") : shown;
}

/** A game's name inside a sentence — in kanji for a Japanese reader, as the site already names games. */
function gameWord(say: Speaker, variant: string): string {
  const copy = (RULE_VARIANT_DISPLAY as Record<string, (typeof RULE_VARIANT_DISPLAY)[RuleVariant] | undefined>)[variant];
  return copy === undefined ? variant : say.pairName(copy.label, copy.kanji).text;
}

const score = (ahead: number, behind: number) => `${ahead}–${behind}`;

/** The one line, in words. */
export function lineWords(say: Speaker, who: Who, line: RivalryLine): string {
  const you = who.readerIsOne;
  const one = seatWord(say, who.one);
  const other = seatWord(say, who.other);

  switch (line.kind) {
    case "never":
      return you ? say.say("rivalry.never.you", { name: other }) : say.say("rivalry.never.named", { one, other });
    case "neverGame": {
      const game = gameWord(say, line.variant);
      return you
        ? say.say("rivalry.neverGame.you", { name: other, game })
        : say.say("rivalry.neverGame.named", { one, other, game });
    }
    case "gap": {
      const count = String(line.count);
      if (line.unit === "months") {
        return you
          ? say.say("rivalry.gapMonths.you", { name: other, count })
          : say.say("rivalry.gapMonths.named", { one, other, count });
      }
      if (line.count === 1) {
        return you ? say.say("rivalry.gapYear.you", { name: other }) : say.say("rivalry.gapYear.named", { one, other });
      }
      return you
        ? say.say("rivalry.gapYears.you", { name: other, count })
        : say.say("rivalry.gapYears.named", { one, other, count });
    }
    case "firstWin":
      if (you) {
        return line.winner === "one"
          ? say.say("rivalry.firstWin.you", { name: other })
          : say.say("rivalry.firstLoss.you", { name: other });
      }
      return line.winner === "one"
        ? say.say("rivalry.firstWin.named", { winner: one, loser: other })
        : say.say("rivalry.firstWin.named", { winner: other, loser: one });
    case "streak": {
      const count = String(line.count);
      if (line.outcome === "draw") {
        return you
          ? say.say("rivalry.drawnRun.you", { name: other, count })
          : say.say("rivalry.drawnRun.named", { one, other, count });
      }
      if (you) {
        return line.outcome === "win"
          ? say.say("rivalry.beaten.you", { name: other, count })
          : say.say("rivalry.lostTo.you", { name: other, count });
      }
      return line.outcome === "win"
        ? say.say("rivalry.beaten.named", { winner: one, loser: other, count })
        : say.say("rivalry.beaten.named", { winner: other, loser: one, count });
    }
    case "allDrawn":
      return you ? say.say("rivalry.allDrawn.you", { name: other }) : say.say("rivalry.allDrawn.named", { one, other });
    case "tied":
      return you
        ? say.say("rivalry.tied.you", { name: other, score: score(line.score, line.score) })
        : say.say("rivalry.tied.named", { one, other, score: score(line.score, line.score) });
    case "lead": {
      const shown = score(line.ahead, line.behind);
      if (you) {
        return line.leader === "one"
          ? say.say("rivalry.lead.you", { name: other, score: shown })
          : say.say("rivalry.behind.you", { name: other, score: shown });
      }
      return line.leader === "one"
        ? say.say("rivalry.lead.named", { leader: one, trailer: other, score: shown })
        : say.say("rivalry.lead.named", { leader: other, trailer: one, score: shown });
    }
  }
}

/**
 * The run they are on, as a stat: always in names, since it sits beside the
 * two names on the board. Null for no games, which the board draws as a dash.
 * A run of one has its own words — "won the last 1" is not a sentence.
 */
export function streakWords(say: Speaker, who: Who, tally: RivalryTallyShown): string | null {
  const run = tally.streak;
  if (run === null || run.count <= 0) return null;
  if (run.kind === "draw") {
    return run.count === 1
      ? say.say("rivalry.streakDrawn.one")
      : say.say("rivalry.streakDrawn.other", { count: String(run.count) });
  }
  const name = seatWord(say, run.kind === "win" ? who.one : who.other);
  return run.count === 1
    ? say.say("rivalry.streakWon.one", { name })
    : say.say("rivalry.streakWon.other", { name, count: String(run.count) });
}
