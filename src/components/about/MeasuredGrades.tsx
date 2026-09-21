import { FigureTable as Table } from "@/components/about/FigureTable";
import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { boardWords } from "@/lib/gomoku/boardWords";
import { PlayerName } from "@/components/players/PlayerName";
import { BOT_MEMBERS } from "@/lib/bots/bots.constants";
import { builtLadderFingerprint } from "@/lib/gomoku/ladderFingerprint.built";
import { measuredLadderAll } from "@/lib/gomoku/ladderStrength";
import type { LadderMeasurement } from "@/lib/gomoku/ladderStrength.types";
import type { BotTier } from "@/lib/gomoku/opponent.types";

/**
 * THE ROUND ROBIN, AS IT CAME OUT — or nothing at all.
 *
 * The same measurement the computer players' own pages show, added up per
 * grade instead of per pairing, because the question this figure answers is
 * "is the ladder in the right order" rather than "how did these two do".
 *
 * IT GOES SILENT RATHER THAN STALE. `measuredLadderAll` drops every row whose
 * fingerprint is not the running code's, so a change to how a grade plays
 * takes this figure off the page until somebody measures again. A table of
 * wins and losses that quietly describes last month's players is worse than
 * no table: a reader cannot tell the difference, and would have no reason to
 * suspect one. See `ladderStrength.ts` — silence, not a guess.
 */

type Tally = { wins: number; losses: number; draws: number };

/** One grade's whole round robin at one game, from its own side of the board. */
function tallyFor(measurement: LadderMeasurement, tier: BotTier): Tally {
  const out: Tally = { wins: 0, losses: 0, draws: 0 };
  for (const pairing of measurement.pairings) {
    // A pairing is written from `first`'s side, so `second` reads it inverted.
    if (pairing.first === tier) {
      out.wins += pairing.wins;
      out.losses += pairing.losses;
      out.draws += pairing.draws;
    } else if (pairing.second === tier) {
      out.wins += pairing.losses;
      out.losses += pairing.wins;
      out.draws += pairing.draws;
    }
  }
  return out;
}

function said({ wins, losses, draws }: Tally): string {
  return draws > 0 ? `${wins}–${losses}–${draws}` : `${wins}–${losses}`;
}

export function MeasuredGrades() {
  const measured = measuredLadderAll(builtLadderFingerprint());
  if (measured.length === 0) return null;

  // Every grade that appears in any of the measurements, in ladder order.
  const tiers: BotTier[] = [];
  for (const measurement of measured) {
    for (const tier of measurement.tiers) if (!tiers.includes(tier)) tiers.push(tier);
  }

  return (
    <Table
      head={[
        "Grade",
        // Its board beside its name, as a game named in a list is drawn everywhere here.
        ...measured.map((measurement) => (
          <span key={measurement.variant} className="flex items-center gap-1.5">
            <GameThumb variant={measurement.variant} size="small" />
            <GameName variant={measurement.variant} />
          </span>
        )),
      ]}
      rows={tiers.map((tier) => [
        // A player named here leads to their page, like a player named anywhere else.
        <PlayerName key={tier} name={BOT_MEMBERS[tier].name} memberId={BOT_MEMBERS[tier].id} fallback={BOT_MEMBERS[tier].name} />,
        ...measured.map((measurement) => said(tallyFor(measurement, tier))),
      ])}
      caption={
        <>
          Wins–losses–draws over a whole round robin: every grade against every other,{" "}
          {measured[0].gamesPerPairing} games a pairing with the colours alternating, at the budget a real move
          is given. Measured on {measured[0].measuredOn}, at{" "}
          {measured.map((measurement, at) => (
            <span key={measurement.variant} className="inline-flex items-center gap-1.5">
              {at > 0 ? " and " : ""}
              <GameThumb variant={measurement.variant} size="small" />
              <GameName variant={measurement.variant} /> on {boardWords(measurement.variant, measurement.size)}
            </span>
          ))}
          . The figures disappear from this page the moment any of the code that decides how a grade plays is
          changed, and come back when it is measured again.
        </>
      }
    />
  );
}
