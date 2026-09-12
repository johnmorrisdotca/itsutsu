import { describe, expect, it } from "vitest";

import { playedScopeNote } from "@/components/players/PlayerRecord";
import { hasPlayedAnyGames, MY_STANDINGS_SCOPE } from "./MyRecord";

/**
 * The guard `MyRecord` gates its whole record line on: "No games yet" versus
 * the rating, the record line and the per-game table.
 *
 * `profile === null` used to stand in for this, and was wrong to: `Player`
 * is a rating row that exists only once a RATED game has been recorded, so
 * it answers "has this member ever settled a rating" rather than "has this
 * member ever played" — and a member whose games were all friendly, never
 * rated, has one without the other. They saw "No games yet" on their own
 * record page while their games sat in the list one tab over.
 */
describe("hasPlayedAnyGames", () => {
  it("is false for a member who has finished no games at all", () => {
    expect(hasPlayedAnyGames({ wins: 0, losses: 0, draws: 0 })).toBe(false);
  });

  /**
   * THE CASE THIS GUARD EXISTS FOR: a member with finished games and no
   * `Player` row — every game they have played was a friendly one, so
   * nothing ever wrote a rating for them. `fetchPlayer` would answer null
   * for this member (no rated game, no row), while `fetchPlayerRecord`'s
   * tally — what this function actually reads — counts their games same as
   * anybody else's, because a friendly game is still a finished game.
   */
  it("is true for a member with finished games and no Player row", () => {
    expect(hasPlayedAnyGames({ wins: 2, losses: 1, draws: 0 })).toBe(true);
  });

  it("is true even where every finished game was a draw", () => {
    expect(hasPlayedAnyGames({ wins: 0, losses: 0, draws: 1 })).toBe(true);
  });

  it("is true even where every finished game was a loss", () => {
    expect(hasPlayedAnyGames({ wins: 0, losses: 3, draws: 0 })).toBe(true);
  });
});

/*
 * /me's per-game table (fetchVariantStandings, rated only) and
 * /players/<id>'s (ItsutsuRecord, via record.byVariant — every finished
 * game) draw the same "Played" heading over two different counts for the
 * same person. MY_STANDINGS_SCOPE is what tells RecordTable's heading to
 * say so, the same fix batch 2 already made for the Ladder tab.
 */
describe("MY_STANDINGS_SCOPE", () => {
  it("says Played here counts rated games, not every finished game", () => {
    const note = playedScopeNote(MY_STANDINGS_SCOPE);
    expect(note).toContain("rated");
  });

  it("names no one pool — a row can hold a standing in either", () => {
    // A member can hold a standing against people and a separate one
    // against the computer for the same game; each row already marks
    // which is which beside its name, so the table-wide note must not
    // claim a single pool the rows themselves do not all share.
    expect(playedScopeNote(MY_STANDINGS_SCOPE)).not.toMatch(/computer|people/);
  });
});
