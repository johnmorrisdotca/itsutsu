import { boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import { OPENING_DISPLAY } from "@/lib/gomoku/openings.constants";
import type { OpeningRule, RuleVariant } from "@/lib/gomoku/gomoku.types";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { describeMoveTime } from "@/lib/history/deadline";
import { GAME_COPY } from "@/components/game/game.constants";
import { RATING_REFUSAL_DISPLAY, type RatingRefusal } from "@/lib/rating/rateable.constants";
import { penaltyMeans } from "./penalty";
import type { RulesDraft } from "./rulesDraft";

/**
 * The rules of a game already being played, said rather than offered.
 *
 * Until the first stone the panel is a form. After it the rules are part of
 * the record, and the form went away and took the answers with it: everything
 * a player had agreed to — the opening, whether resigning was allowed, what
 * running out of time costs — simply stopped being on the page. The one line
 * at the top of the panel never carried the half of it.
 *
 * That is worst for the player who was invited. They never saw the settings
 * the game was started from, and the one screen that would have shown them is
 * the one that disappears the moment somebody plays.
 *
 * So the same rows, in the same order, with the same words — the panel does
 * not change shape when the game starts, it settles. A control becomes the
 * answer it was holding.
 */
export function RulesStatement({
  rules,
  note = "The first stone is down, so these are the rules the game is played under.",
  refusal = null,
}: {
  rules: RulesDraft;
  /**
   * Why this game cannot move a rating, when it cannot — so the Ratings row
   * below says what happened rather than what the row's column claims.
   *
   * Null for a draft. The doorstep shows these same rows for a game that does
   * not exist yet, where `rated` IS the answer because it is the choice being
   * made and there is no game to refuse.
   */
  refusal?: RatingRefusal | null;
  /**
   * The line above the rows, saying why they are answers rather than controls.
   *
   * A prop because the same rows are now shown in two places with two different
   * reasons for being settled: beside a board, because the game has started, and
   * on the doorstep, because nothing has been written yet. One sentence covering
   * both would have to be vague about which, and "these are the rules" without
   * saying why is the half of a statement that carries no information.
   */
  note?: string;
}) {
  const variant = rules.variant as RuleVariant;
  const timed = rules.moveTimeMs !== null;
  const said: { label: string; value: string }[] = [
    { label: "Rules", value: RULE_VARIANT_DISPLAY[variant]?.label ?? rules.variant },
  ];
  // Only where there was a choice, the same rule the form follows.
  if (boardSizesFor(variant).length > 1) {
    said.push({ label: "Board", value: `${rules.size}×${rules.size}` });
  }
  said.push({
    label: "Opening",
    value: OPENING_DISPLAY[rules.opening as OpeningRule]?.label ?? rules.opening,
  });
  said.push({
    label: GAME_COPY.allowResign.label,
    value: rules.allowResign ? "Allowed" : "Not allowed",
  });
  said.push({ label: GAME_COPY.moveTime.label, value: describeMoveTime(rules.moveTimeMs) });
  if (timed) {
    said.push({
      label: "Clock",
      value: rules.clockMode === "game" ? "Time is for the whole game" : "Time is per move",
    });
  }
  /*
   * The refusal first, for the reason `describeSettings` gives at the same
   * decision: a game the site cannot rate is neither "Counts towards ratings"
   * nor "Friendly", and this row saying the first of those under a notice
   * saying the game will not count is the contradiction twelve production
   * rows put on one screen. Here there is room for the reason as well as the
   * verdict, so the short form carries both.
   */
  said.push({
    label: "Ratings",
    value:
      refusal !== null
        ? RATING_REFUSAL_DISPLAY[refusal].short
        : rules.rated
          ? "Counts towards ratings"
          : "Friendly — ratings unaffected",
  });
  if (timed && rules.clockMode !== "game") {
    said.push({ label: GAME_COPY.penalty.label, value: penaltyMeans(rules.timeoutPenalty) });
  }

  return (
    <div className="mt-1 flex flex-col gap-2 border-t border-rule pt-3" data-testid="rules-statement">
      <p className="text-xs text-muted">{note}</p>
      <dl className="flex flex-col gap-1.5">
        {said.map((row) => (
          <div key={row.label} className="flex min-w-0 items-baseline justify-between gap-3 text-sm">
            <dt className="min-w-0 text-ink-soft">{row.label}</dt>
            {/* Right-aligned and free to wrap: a whole sentence lives here. */}
            <dd className="min-w-0 text-right font-medium text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
