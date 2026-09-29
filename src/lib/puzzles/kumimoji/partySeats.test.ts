import { describe, expect, it } from "vitest";

import { judgeGrid, squareAt } from "./grid";
import { nameOf, partyTilesLeft, seatPlay, startParty, stillIn, withSeatPlay } from "./party";
import type { PartyGame, PartySettings } from "./party.types";
import { decodeParty, encodeParty, holdsItsBag, isPartyFor } from "./partyKept";
import { joinParty, joinRefused, leaveParty, leaveRefused, tilesHeldBy } from "./partySeats";
import { endTurn, lastStanding, resign, winnersOf } from "./partyTurns";
import { assignHandTile, placeFromHand } from "./play";

const SETTINGS: PartySettings = { size: 3, level: "medium", seed: 7, gameLength: "short", language: "english", doubleSet: false, diagonals: false, hints: false };
const WORDS = new Set(["cat", "dog", "sun", "at", "go"]);
const verdictOf = (game: PartyGame) => judgeGrid(game.players[game.turn]!.tiles, (word) => WORDS.has(word.toLowerCase()));
const spells = () => true;
const family = (tile: string) => (/^[a-z]$/.test(tile) ? tile : /^[A-Z*]$/.test(tile) ? "*" : null);
const BAG = "catdogsunxyzabcdefghijklmnopq";

/** Lay the whole hand of the player whose turn it is across row 0. */
function layHand(game: PartyGame): PartyGame {
  let play = seatPlay(game);
  const count = play.hand.length;
  for (let col = 0; col < count; col += 1) play = placeFromHand(play, 0, squareAt(0, col));
  return withSeatPlay(game, play);
}

/** Every tile of the bag, wherever it is: held by somebody, or still to come. */
const everyTile = (game: PartyGame) =>
  [...game.players.flatMap((player) => [...player.hand, ...player.tiles.values()]), ...(game.bag + game.returned).slice(game.taken)].map((tile) => family(tile)).sort().join("");

describe("joining", () => {
  it("seats a new player after the last with the next hand from the bag, to play when the turn comes round", () => {
    const game = startParty(SETTINGS, BAG, ["Aiko", "Ben"]);
    const joined = joinParty(game, { name: "  Cho " });
    expect(joined.players).toHaveLength(3);
    expect(joined.players[2]!.name).toBe("Cho");
    expect(joined.players[2]!.hand.join("")).toBe("sun");
    expect(joined.taken).toBe(game.taken + SETTINGS.size);
    expect(partyTilesLeft(joined)).toBe(partyTilesLeft(game) - SETTINGS.size);
    expect(joined.dealt).toBe(2);
    expect(holdsItsBag(joined, family)).toBe(true);
    // The turn order takes them in after the last seat: 0 → 1 → 2 → 0.
    let played = joined;
    const seen: number[] = [];
    for (let step = 0; step < 4; step += 1) {
      seen.push(played.turn);
      played = endTurn(played, verdictOf(played), spells);
    }
    expect(seen).toEqual([0, 1, 2, 0]);
  });

  it("names an unnamed player by their seat and a computer by the next free number", () => {
    let game = startParty(SETTINGS, BAG, [{ name: "", computer: true }, "Ben"]);
    expect(game.players[0]!.name).toBe("Computer 1");
    game = joinParty(game, { name: "" });
    expect(nameOf(game, 2)).toBe("Player 3");
    game = joinParty(game, { name: "ignored", computer: true });
    expect(game.players[3]).toMatchObject({ name: "Computer 2", computer: true });
  });

  it("is refused at eight, in the last round, once the game is over, and when the bag cannot give a whole hand", () => {
    const game = startParty(SETTINGS, BAG, ["a", "b"]);
    expect(joinRefused(game)).toBeNull();
    const eight = Array.from({ length: 6 }).reduce<PartyGame>((now) => joinParty(now, { name: "" }), startParty(SETTINGS, BAG + BAG, ["a", "b"]));
    expect(eight.players).toHaveLength(8);
    expect(joinRefused(eight)).toBe("full");
    expect(joinParty(eight, { name: "" })).toBe(eight);
    expect(joinRefused({ ...game, lastTurns: [1] })).toBe("lastRound");
    expect(joinRefused({ ...game, ending: "out" })).toBe("over");
    const short = { ...game, taken: game.bag.length - 2 };
    expect(joinRefused(short)).toBe("bag");
    expect(joinParty(short, { name: "x" })).toBe(short);
  });
});

describe("leaving", () => {
  it("puts every tile in their hand and on their table back in the bag, and nothing else", () => {
    const start = startParty(SETTINGS, BAG, ["Aiko", "Ben", "Cho"]);
    // Aiko lays CAT, then it is Ben's turn; Aiko leaves from the pass screen.
    const laid = endTurn(layHand(start), verdictOf(layHand(start)), spells);
    expect(laid.turn).toBe(1);
    const held = tilesHeldBy(laid, 0);
    expect(held).toBe(3);
    const left = leaveParty(laid, 0);
    expect(partyTilesLeft(left)).toBe(partyTilesLeft(laid) + held);
    expect(left.players.map((player) => player.name)).toEqual(["Ben", "Cho"]);
    expect(everyTile(left)).toBe(everyTile(laid));
    expect(holdsItsBag(left, family)).toBe(true);
    // What the others hold is untouched.
    expect(left.players[0]!.hand).toEqual(laid.players[1]!.hand);
    expect(left.players[1]!.hand).toEqual(laid.players[2]!.hand);
  });

  it("shuffles the returned tiles in the same way every time, from the game's seed", () => {
    const game = startParty(SETTINGS, BAG, ["a", "b", "c"]);
    expect(leaveParty(game, 1).bag).toBe(leaveParty(game, 1).bag);
    expect(leaveParty(game, 1).bag).not.toBe(leaveParty({ ...game, settings: { ...game.settings, seed: 8 } }, 1).bag);
  });

  it("gives a wild back blank", () => {
    const game = startParty(SETTINGS, "ca*dogsunxyzabc", ["a", "b"]);
    const assigned = withSeatPlay(game, assignHandTile(seatPlay(game), 2, "T"));
    const left = leaveParty({ ...assigned, turn: 1 }, 0);
    expect(left.bag.slice(left.taken)).toContain("*");
    expect(left.bag.slice(left.taken)).not.toContain("T");
    expect(holdsItsBag(left, family)).toBe(true);
  });

  it("takes them out of the turn order, and passes their turn to the next still in", () => {
    const game = startParty(SETTINGS, BAG, ["Aiko", "Ben", "Cho", "Dai"]);
    // Aiko's turn, and Aiko leaves: Ben plays next, and the order goes Ben → Cho → Dai → Ben.
    let left = leaveParty(game, 0);
    expect(left.turn).toBe(0);
    expect(nameOf(left, left.turn)).toBe("Ben");
    const seen: string[] = [];
    for (let step = 0; step < 4; step += 1) {
      seen.push(nameOf(left, left.turn));
      left = endTurn(left, verdictOf(left), spells);
    }
    expect(seen).toEqual(["Ben", "Cho", "Dai", "Ben"]);
    // Somebody after the one to play leaves: the same player still plays.
    const other = leaveParty({ ...game, turn: 1 }, 3);
    expect(nameOf(other, other.turn)).toBe("Ben");
    // Somebody before them leaves: the same player, one seat up.
    const before = leaveParty({ ...game, turn: 2 }, 0);
    expect(before.turn).toBe(1);
    expect(nameOf(before, before.turn)).toBe("Cho");
    expect(before.turns).toBe(game.turns + 1);
  });

  it("keeps the names the unnamed were shown, rather than renumbering them", () => {
    const game = startParty(SETTINGS, BAG, ["", "", ""]);
    const left = leaveParty(game, 0);
    expect([0, 1].map((at) => nameOf(left, at))).toEqual(["Player 2", "Player 3"]);
  });

  it("carries resignations over to the seats that moved up, and skips a resigned player as before", () => {
    const endgame = { ...startParty(SETTINGS, BAG, ["a", "b", "c", "d"]), taken: BAG.length - 2 };
    let game = resign({ ...endgame, turn: 2 });
    expect(game.resigned).toEqual([2]);
    game = leaveParty(game, 0);
    expect(game.resigned).toEqual([1]);
    expect(stillIn(game)).toEqual([0, 2]);
  });

  it("leaves one player still in the last one standing, who wins by laying a tile", () => {
    const game = startParty(SETTINGS, BAG, ["Aiko", "Ben"]);
    const left = leaveParty(game, 1);
    expect(left.players).toHaveLength(1);
    expect(left.ending).toBeNull();
    expect(lastStanding(left)).toBe(true);
    const won = endTurn(layHand(left), verdictOf(layHand(left)), spells);
    expect(won.ending).toBe("standing");
    expect(winnersOf(won)).toEqual([0]);
  });

  it("ends a last round nobody is left to play, and the one who went out wins", () => {
    const game = { ...startParty(SETTINGS, BAG, ["Aiko", "Ben", "Cho"]), out: [0], lastTurns: [1, 2], turn: 1 };
    const one = leaveParty(game, 1);
    expect(one.ending).toBeNull();
    expect(one.lastTurns).toEqual([1]);
    expect(nameOf(one, one.turn)).toBe("Cho");
    const none = leaveParty(one, 1);
    expect(none.ending).toBe("out");
    expect(winnersOf(none)).toEqual([0]);
  });

  it("ends tied between those left when everybody left has resigned", () => {
    const endgame = { ...startParty(SETTINGS, BAG, ["a", "b", "c"]), taken: BAG.length - 2 };
    const game = resign(resign(endgame));
    expect(game.turn).toBe(2);
    const left = leaveParty(game, 2);
    expect(left.ending).toBe("tied");
    expect(winnersOf(left)).toEqual([0, 1]);
  });

  it("is refused to a player who has gone out, to the last person at a table of computers, and after the end", () => {
    const game = startParty(SETTINGS, BAG, ["Aiko", { name: "", computer: true }, "Ben"]);
    expect(leaveRefused({ ...game, out: [0], lastTurns: [1, 2] }, 0)).toBe("out");
    expect(leaveRefused({ ...game, ending: "out" }, 1)).toBe("over");
    const alone = leaveParty(game, 2);
    expect(leaveRefused(alone, 0)).toBe("lastPerson");
    expect(leaveParty(alone, 0)).toBe(alone);
    // A computer can always be sent away.
    expect(leaveRefused(alone, 1)).toBeNull();
  });
});

describe("keeping a game people have joined and left", () => {
  it("reads back the seats, the computers and how many it was dealt to, and still matches its address", () => {
    let game = startParty(SETTINGS, BAG, ["Aiko", { name: "", computer: true }, "Ben"]);
    game = leaveParty(joinParty(game, { name: "Cho" }), 2);
    const back = decodeParty(encodeParty(game), family)!;
    expect(back).not.toBeNull();
    expect(encodeParty(back)).toBe(encodeParty(game));
    expect(back.players.map((player) => [player.name, player.computer === true])).toEqual([
      ["Aiko", false],
      ["Computer 1", true],
      ["Cho", false],
    ]);
    expect(back.dealt).toBe(3);
    expect(isPartyFor(back, SETTINGS, 3)).toBe(true);
    // Down to one player, still the same game.
    const one = decodeParty(encodeParty(leaveParty(leaveParty(back, 2), 1)), family)!;
    expect(one.players).toHaveLength(1);
    expect(isPartyFor(one, SETTINGS, 3)).toBe(true);
  });

  it("reads a game kept before seats could change as one dealt to everybody at it, all people", () => {
    const game = startParty(SETTINGS, BAG, ["a", "b"]);
    const kept = JSON.parse(encodeParty(game)) as Record<string, unknown>;
    expect(kept.dealt).toBeUndefined();
    expect(JSON.stringify(kept.players)).not.toContain("computer");
    const back = decodeParty(JSON.stringify(kept), family)!;
    expect(back.dealt).toBe(2);
    expect(back.players.every((player) => player.computer === undefined)).toBe(true);
    expect(decodeParty(JSON.stringify({ ...kept, dealt: 1 }))).toBeNull();
    expect(decodeParty(JSON.stringify({ ...kept, players: [] }))).toBeNull();
  });
});
