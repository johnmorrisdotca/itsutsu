import { GameName } from "@/components/games/GameName";
import { BOT_MEMBERS } from "@/lib/bots/bots.constants";
import { builtLadderFingerprint } from "@/lib/gomoku/ladderFingerprint.built";
import { BOT_TIER_LIST } from "@/lib/gomoku/opponent.constants";
import { measuredLadderAll } from "@/lib/gomoku/ladderStrength";
import type { LadderMeasurement } from "@/lib/gomoku/ladderStrength.types";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { gamePath } from "@/lib/gomoku/slugs";

/**
 * DOES EACH RUNG BEAT THE ONE BELOW IT? The ladder's whole claim, drawn.
 *
 * John asked for graphs on the About page as well as paragraphs, and this is
 * the one the measurement can actually answer. The table beside it says how
 * each grade did against the whole field; this asks the narrower and more
 * interesting question — whether the ORDER is real — by plotting one bar per
 * step of the ladder: how often the higher grade beat the grade directly below
 * it, at each game that has been measured.
 *
 * FIFTY PER CENT IS THE LINE THAT MATTERS, and it is drawn. A bar at half is
 * two grades that are the same player, which is exactly what the top two turn
 * out to be — the finding the section is about, visible rather than asserted.
 *
 * SVG WRITTEN HERE, FROM THE DATA, with no chart library and no client
 * JavaScript: this is a server component drawing numbers that are fixed at
 * build time. A library would be kilobytes shipped to every reader of a page
 * that never changes, and a canvas would be a picture nobody could read.
 *
 * IT GOES SILENT RATHER THAN STALE, like every other reader of this
 * measurement: `measuredLadderAll` drops any row whose fingerprint is not the
 * running code's, so a change to how a grade plays takes the graph off the
 * page until somebody measures again. A chart that quietly draws last month's
 * players is worse than no chart, because a reader cannot tell.
 */

const WIDTH = 560;
const ROW = 26;
const PAD = { left: 148, right: 46, top: 26, bottom: 24 };

/** One step of the ladder at one game: the higher grade's share of the decided games. */
type Step = {
  variant: RuleVariant;
  higher: BotTier;
  lower: BotTier;
  /** Games the higher grade won, of those that were not drawn. */
  share: number;
  played: number;
};

/** How the higher of two neighbouring grades did against the lower, in one measurement. */
function stepOf(measurement: LadderMeasurement, higher: BotTier, lower: BotTier): Step | null {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  for (const pairing of measurement.pairings) {
    // A pairing is written from `first`'s side, so the other way round reads inverted.
    if (pairing.first === higher && pairing.second === lower) {
      wins += pairing.wins;
      losses += pairing.losses;
      draws += pairing.draws;
    } else if (pairing.first === lower && pairing.second === higher) {
      wins += pairing.losses;
      losses += pairing.wins;
      draws += pairing.draws;
    }
  }
  const decided = wins + losses;
  /*
   * A pairing nobody played, or one that was drawn every time, has no share to
   * plot — and nought would be a bar saying the higher grade lost every game.
   * A value in range that means "nothing was measured" is the fault AGENTS.md
   * calls out by name, so this answers null.
   */
  if (decided === 0) return null;
  return { variant: measurement.variant as RuleVariant, higher, lower, share: wins / decided, played: decided + draws };
}

export function GradeLadderGraph() {
  const measured = measuredLadderAll(builtLadderFingerprint());
  /*
   * GROUPED BY GAME, because a bar has to say what it is about. Drawn as a
   * flat list, "Kyu over Razryad" appeared twice with nothing to tell the two
   * apart — the same pairing at two different games, which is the one thing a
   * reader needs to know to make sense of two different numbers.
   */
  const games: { variant: RuleVariant; steps: Step[] }[] = [];
  for (const measurement of measured) {
    const steps: Step[] = [];
    for (let rung = 1; rung < BOT_TIER_LIST.length; rung += 1) {
      const step = stepOf(measurement, BOT_TIER_LIST[rung]!, BOT_TIER_LIST[rung - 1]!);
      if (step !== null) steps.push(step);
    }
    if (steps.length > 0) games.push({ variant: measurement.variant as RuleVariant, steps });
  }
  if (games.length === 0) return null;

  const rows = games.reduce((total, game) => total + game.steps.length + 1, 0);
  const height = PAD.top + rows * ROW + PAD.bottom;
  const plotW = WIDTH - PAD.left - PAD.right;
  const x = (share: number) => PAD.left + share * plotW;
  const all = games.flatMap((game) => game.steps);
  const played = all.reduce((total, step) => total + step.played, 0);
  /*
   * SAID FROM THE DATA, NEVER ASSERTED BESIDE IT. The first draft of this
   * caption claimed the top two grades come out level — which the prose above
   * says of the LIVE move budget, and which this measurement plainly does not
   * show. A figure that disagrees with its own caption is worse than no
   * figure, so the sentence is computed from the bars it is under.
   */
  const inOrder = all.every((step) => step.share > 0.5);
  const lowest = all.reduce((least, step) => (step.share < least.share ? step : least), all[0]!);

  let row = 0;
  return (
    <figure className="mx-auto flex w-full max-w-2xl flex-col items-center gap-2" data-testid="about-grade-ladder">
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="w-full"
        role="img"
        aria-label={`How often each computer grade beat the grade directly below it, over ${all.length} measured pairings across ${games.length} games. A bar reaching halfway means the two grades are as strong as each other.`}
      >
        {/* The quarters, and the half drawn darker: it is the line the whole figure is about. */}
        {[0, 0.25, 0.5, 0.75, 1].map((mark) => (
          <g key={mark}>
            <line
              x1={x(mark)}
              x2={x(mark)}
              y1={PAD.top - 8}
              y2={height - PAD.bottom}
              stroke={mark === 0.5 ? "var(--ink-soft)" : "var(--rule)"}
              strokeDasharray={mark === 0.5 ? undefined : "2 3"}
            />
            <text x={x(mark)} y={PAD.top - 12} textAnchor="middle" fontSize={9} fill="var(--muted)">
              {Math.round(mark * 100)}%
            </text>
          </g>
        ))}
        {games.map((game) => {
          const heading = row;
          row += 1;
          return (
            <g key={game.variant}>
              {/* A game's name is the way to that game, in a chart as anywhere: an SVG link. */}
              <a href={gamePath(game.variant)}>
                <text
                  x={4}
                  y={PAD.top + heading * ROW + 14}
                  fontSize={11}
                  fontWeight={600}
                  fill="var(--ink)"
                  textDecoration="underline"
                >
                  {RULE_VARIANT_DISPLAY[game.variant].label}
                </text>
              </a>
              {game.steps.map((step) => {
                const y = PAD.top + row * ROW;
                row += 1;
                // Within five points of half is two players nothing separates.
                const level = Math.abs(step.share - 0.5) < 0.05;
                return (
                  <g key={`${game.variant}-${step.higher}`}>
                    <text x={PAD.left - 8} y={y + 13} textAnchor="end" fontSize={10} fill="var(--ink-soft)">
                      {BOT_MEMBERS[step.higher].name} over {BOT_MEMBERS[step.lower].name}
                    </text>
                    <rect
                      x={PAD.left}
                      y={y + 4}
                      width={Math.max(1, x(step.share) - PAD.left)}
                      height={12}
                      rx={2}
                      fill={level ? "var(--ochre)" : "var(--moss)"}
                    />
                    <text x={x(step.share) + 6} y={y + 14} fontSize={9} fill="var(--muted)">
                      {Math.round(step.share * 100)}%
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <figcaption className="text-xs text-muted">
        Each bar is one step of the ladder at one game: how often the higher grade beat the grade directly below
        it, over {played} measured games. Half would be two players nothing separates.{" "}
        {inOrder ? (
          <>
            Every step here is above half, so at these games the ladder is in the order it claims — the closest
            is {BOT_MEMBERS[lowest.higher].name} over {BOT_MEMBERS[lowest.lower].name} at{" "}
            <GameName variant={lowest.variant} /> ({Math.round(lowest.share * 100)}%).
          </>
        ) : (
          <>
            The closest step is {BOT_MEMBERS[lowest.higher].name} over {BOT_MEMBERS[lowest.lower].name} at{" "}
            <GameName variant={lowest.variant} />, at {Math.round(lowest.share * 100)}%.
          </>
        )}
      </figcaption>
    </figure>
  );
}
