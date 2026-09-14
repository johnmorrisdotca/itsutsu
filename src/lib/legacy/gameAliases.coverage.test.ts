import { describe, expect, it } from "vitest";

import { RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { GAME_ALIASES, NO_GAME_HERE } from "./gameAliases";
import { LEGACY_PLAYERS } from "./legacyPlayers.data";

/**
 * The alias gate: every game a kept record names has been decided.
 *
 * John, looking at his own ItsYourTurn record with Anti-Checkers, Backgammon,
 * Checkers, Crowded Checkers and Halma 10x10 all drawn plain: "why does our
 * site not have links for Anti-Checkers, Checkers, Halma 10x10, crowded, etc?
 * we have to always make sure we go through the site to catch these things
 * when we introduce new games."
 *
 * Checkers had been a game here for releases. Nothing tied adding it to the
 * table that turns a record's "Checkers" into a link, so the record went on
 * saying it was not a game played here — the one statement on that page that
 * had stopped being true. A name missing from `GAME_ALIASES` fails silently,
 * as plain italic words, which is exactly why it has to fail here instead.
 *
 * THE NAMES ARE READ FROM THE RECORDS, not listed again. `LEGACY_PLAYERS` is
 * the only place the source sites' names are written down, and a second list
 * of them in this file would be one more thing to forget. A row's `detail` and
 * a head-to-head's games are game names; a class's own `record.game` is the
 * class ("Regular games"), not a game, and is left out.
 */

function recordedGameNames(): string[] {
  const names = new Set<string>();
  for (const player of LEGACY_PLAYERS) {
    for (const source of player.sources) {
      for (const row of source.summary) {
        for (const game of row.detail ?? []) names.add(game.game);
      }
      for (const pairing of source.headToHead ?? []) {
        for (const game of pairing.games) names.add(game.game);
      }
    }
  }
  return [...names].sort();
}

/** Every name the alias gate knows of: what the records use, and what the two tables mention. */
function everyKnownName(): string[] {
  return [...new Set([...recordedGameNames(), ...Object.keys(GAME_ALIASES), ...Object.keys(NO_GAME_HERE)])].sort();
}

/** The games here that go by a name, compared without case: their label and every other name they are known by. */
function gamesCalled(name: string): RuleVariant[] {
  const wanted = name.trim().toLowerCase();
  return (Object.values(RULE_VARIANTS) as RuleVariant[]).filter((variant) => {
    const copy = RULE_VARIANT_DISPLAY[variant];
    return [copy.label, ...(copy.alsoKnownAs ?? [])].some((own) => own.trim().toLowerCase() === wanted);
  });
}

describe("every game a kept record names has been decided", () => {
  it("reads some names from the records, or it is checking nothing", () => {
    expect(recordedGameNames().length).toBeGreaterThan(20);
  });

  it("every recorded name is aliased to a game here, or named as having none", () => {
    const undecided = recordedGameNames().filter((name) => !(name in GAME_ALIASES) && !(name in NO_GAME_HERE));
    expect(
      undecided,
      "a kept record names these games and nothing says what they are here: add each to GAME_ALIASES " +
        "(the game it really is) or NO_GAME_HERE (with the reason there is none)",
    ).toEqual([]);
  });

  it("a name one of our games goes by leads to that game wherever a record uses it", () => {
    const missed = everyKnownName().flatMap((name) => {
      const ours = gamesCalled(name);
      if (ours.length === 0) return [];
      const target = GAME_ALIASES[name];
      return target !== undefined && ours.includes(target)
        ? []
        : [`"${name}" is what ${ours.join(" / ")} is called here, but it ${target === undefined ? "is not aliased" : `is aliased to ${target}`}`];
    });
    expect(missed, "a game added here under a name the records already use must be aliased from it").toEqual([]);
  });

  it("no name is both a game here and a game we do not have", () => {
    const both = Object.keys(NO_GAME_HERE).filter((name) => name in GAME_ALIASES);
    expect(both).toEqual([]);
  });

  it("every game we do not have says why, in one line", () => {
    const unexplained = Object.entries(NO_GAME_HERE)
      .filter(([, reason]) => reason.trim().length < 12 || reason.includes("\n"))
      .map(([name]) => name);
    expect(unexplained).toEqual([]);
  });
});
