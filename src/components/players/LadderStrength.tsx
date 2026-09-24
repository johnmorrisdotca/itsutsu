import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { botName } from "@/lib/bots/bots";
import { ladderNeighbours, readsAsLevel } from "@/lib/gomoku/ladderNeighbours";
import type { LadderMeasurement, LadderNeighbour } from "@/lib/gomoku/ladderStrength.types";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import { SECTION_TITLE } from "@/components/ui/ui.constants";

/**
 * WHAT THIS GRADE ACTUALLY DOES, GAME BY GAME.
 *
 * A grade's name is one claim about more than forty games, and it cannot know
 * how it plays any of them, because until this table nothing ever asked.
 * John's framing, and it is the better half of the finding: a program that is
 * genuinely stronger at five in a row than at Reversi is an ordinary fact
 * about a player. What misleads is a single label implying the same strength
 * everywhere.
 *
 * So this says, per game, how this grade did against the rung above and the
 * rung below — which is the comparison somebody choosing an opponent is making
 * anyway. Not a rating: a rating would be a second number to trust, and these
 * are twenty games a pairing.
 *
 * LEVEL IS SAID AS LEVEL. Where the margin is inside the noise the row reads
 * "level with", never "beats". That is the whole reason this exists: 名人 and
 * 国手 measured 7-13 at Reversi and 3-6 at draughts, both of which LOOK like
 * results and neither of which is — a quarter and a half of the time
 * respectively between players of equal strength. Two names for one player,
 * and a display that rounded either away would have hidden the finding it was
 * built to show. `readsAsLevel` holds the line.
 *
 * A GAME WITH NOTHING TO SAY SAYS NOTHING. There is no row for a game that has
 * never been measured, and `measuredLadder` has already dropped any row
 * measured against code that is no longer running. That is silence rather than
 * an empty table, and it is the one place on this site where an empty panel is
 * wrong: "nobody has played this yet" is a true fact about a game, whereas
 * "we have not measured this" is a fact about us, and a reader choosing an
 * opponent is not helped by it.
 */
export function LadderStrength({ tier, measured }: { tier: BotTier; measured: readonly LadderMeasurement[] }) {
  const rows = measured
    .map((measurement) => ({ measurement, beside: ladderNeighbours(measurement, tier) }))
    .filter(({ beside }) => beside.above !== null || beside.below !== null);
  if (rows.length === 0) return null;

  return (
    <section className="flex flex-col gap-2" data-testid="ladder-strength">
      <h2 className={SECTION_TITLE}>
        Measured game by game <span className="font-mincho normal-case tracking-normal">実力</span>
      </h2>
      <ul className="flex flex-col gap-1.5">
        {rows.map(({ measurement, beside }) => (
          <li
            key={measurement.variant}
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
            data-testid="ladder-strength-game"
            data-variant={measurement.variant}
          >
            <GameThumb variant={measurement.variant} size="small" />
            <GameName variant={measurement.variant} />
            <span className="text-ink-soft">
              {[sentence(tier, beside.above), sentence(tier, beside.below)].filter((part) => part !== null).join("; ")}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted" data-testid="ladder-strength-note">
        {note(rows.map(({ measurement }) => measurement))}
      </p>
    </section>
  );
}

/** One comparison, in words a player can read without a key. */
function sentence(tier: BotTier, beside: LadderNeighbour | null): string | null {
  if (beside === null) return null;
  const them = botName(beside.tier);
  const score = `${beside.wins}–${beside.losses}${beside.draws > 0 ? `–${beside.draws}` : ""}`;
  const me = botName(tier);
  if (readsAsLevel(beside)) return `level with ${them} (${score})`;
  return beside.wins > beside.losses ? `${me} beats ${them} (${score})` : `${them} beats ${me} (${score})`;
}

/**
 * Where the numbers came from. It says the sample and the day, because a
 * measurement without either is an assertion — and because these are twenty
 * games, which is enough to see a gap and not enough to rank two players who
 * are close.
 */
function note(measured: readonly LadderMeasurement[]): string {
  const games = measured[0]?.gamesPerPairing ?? 0;
  const on = measured.map((measurement) => measurement.measuredOn).sort().at(-1);
  return `Played out here, ${games} games a pairing with the colours alternating, at the same budget a move gets in a real game. Measured ${on}.`;
}
