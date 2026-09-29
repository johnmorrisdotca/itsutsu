import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * EVERY GAME WITH PIECES A PLAYER OWNS OFFERS THEM A COLOUR. John,
 * 2026-09-29: "This is for essentially all games." Held from the source, as
 * the site's other gates are, so a new table or a new way of drawing a live
 * board cannot ship in the ordinary colours only:
 *
 * - every board a stone game is PLAYED on hands its seats' colours to `Board`
 *   — the live board, the practice and hot-seat board, Pair Go — and so does
 *   the replay, so a finished game reads in the colours it was played in;
 * - every pass-and-play table's game offers the place to play its colour on
 *   its turn (`PartySeatColour`), and every table's set-up makes its marbles
 *   the buttons that choose one (`SeatColourButton`);
 * - nothing at a table reads the table colours past the place's own choice
 *   (`PARTY_MARBLES[...]` outside the one module that lays choices over it).
 *
 * The exceptions are named with the reason, below.
 */

const PARTY = join("src", "components", "party");

function read(path: string): string {
  return readFileSync(path, "utf8");
}

/** Pieces nobody at the table owns, so there is no one to choose their colour. */
const NO_OWNED_PIECES: Record<string, string> = {
  [join(PARTY, "PairGoGame.tsx")]: "Pair Go's pieces are its two teams' stones: chosen per team with the stone games' own panel (`SeatColoursPanel`), not per place",
};

describe("every game with pieces a player owns offers them a colour", () => {
  it("hands the seats' colours to every stone board that is played or read", () => {
    const boards = {
      "src/components/live/SharedGame.tsx": "colours={detail.colours}",
      "src/components/game/GameView.tsx": "colours={seatColours.colours}",
      "src/components/party/PairGoGame.tsx": "colours={teams.colours}",
      "src/components/history/GameReplay.tsx": "colours={game.colours}",
    };
    for (const [path, handed] of Object.entries(boards)) expect(read(path), path).toContain(handed);
  });

  it("offers the place to play its colour at every pass-and-play table, and at every table's set-up", () => {
    const files = readdirSync(PARTY).filter((name) => name.endsWith(".tsx"));
    const games = files.filter((name) => name.endsWith("Game.tsx")).map((name) => join(PARTY, name));
    expect(games.length).toBeGreaterThan(5);
    const silent = games.filter((path) => {
      const text = read(path);
      return !text.includes("<PartySeatColour") && !text.includes("<PartyRaceGame") && !Object.hasOwn(NO_OWNED_PIECES, path);
    });
    expect(silent, "a table whose players cannot choose a colour on their turn: draw <PartySeatColour> in its side column").toEqual([]);
    // Pair Go's set-up names four players in two teams; its colours are the teams', chosen on the board (NO_OWNED_PIECES).
    const setUps = files.filter((name) => name.endsWith("SetUp.tsx") && name !== "PairGoSetUp.tsx").map((name) => join(PARTY, name));
    expect(setUps.length).toBeGreaterThan(3);
    const plain = setUps.filter((path) => !read(path).includes("<SeatColourButton"));
    expect(plain, "a set-up whose marbles do not choose a colour: draw <SeatColourButton> beside each name").toEqual([]);
  });

  it("reads a table's marbles through the place's own choice everywhere at a table", () => {
    const reading = readdirSync(PARTY)
      .filter((name) => name.endsWith(".tsx"))
      .map((name) => join(PARTY, name))
      .filter((path) => /PARTY_MARBLES\[/.test(read(path)));
    // The two that must read a place's DEFAULT marble: the chooser's first circle, on the table and on the set-up.
    expect(reading.sort()).toEqual([join(PARTY, "PartySeatColour.tsx"), join(PARTY, "SeatColourButton.tsx")].sort());
  });

  it("names only real exceptions", () => {
    for (const [path, reason] of Object.entries(NO_OWNED_PIECES)) {
      expect(read(path), path).toContain("SeatColoursPanel");
      expect(reason.length).toBeGreaterThan(20);
    }
  });
});
