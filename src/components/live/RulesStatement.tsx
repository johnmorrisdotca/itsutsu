import { boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import { OPENING_DISPLAY } from "@/lib/gomoku/openings.constants";
import type { OpeningRule, RuleVariant } from "@/lib/gomoku/gomoku.types";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { describeMoveTime } from "@/lib/history/deadline";
import { GAME_COPY } from "@/components/game/game.constants";
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
export function RulesStatement({ rules }: { rules: RulesDraft }) {
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
  said.push({ label: "Ratings", value: rules.rated ? "Counts towards ratings" : "Friendly — ratings unaffected" });
  if (timed && rules.clockMode !== "game") {
    said.push({ label: GAME_COPY.penalty.label, value: penaltyMeans(rules.timeoutPenalty) });
  }

  return (
    <div className="mt-1 flex flex-col gap-2 border-t border-rule pt-3" data-testid="rules-statement">
      <p className="text-xs text-muted">
        The first stone is down, so these are the rules the game is played under.
      </p>
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
