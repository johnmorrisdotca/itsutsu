import { beforeAll, describe, expect, it } from "vitest";

import { generateKumimoji } from "./generate.ts";
import { judgeGrid, squareAt } from "./grid.ts";
import { drawAll, mayDrawAll, mayTradeThisTurn, nameOf, passViewStart, stepView, partyFits, partyLength, partyPlayersAsked, partyTilesLeft, partyTilesNeeded, seatPlay, startParty, stillIn, tidyName, withSeatPlay } from "./party.ts";
import { doneRefused, endTurn, goesOut, handCanSpell, isLastTurn, lastStanding, mayResign, mustTradeFirst, resign, winnersOf } from "./partyTurns.ts";
import type { PartyGame, PartySettings } from "./party.types.ts";
import { decodeParty, encodeParty, holdsItsBag, isPartyFor } from "./partyKept.ts";
import { placeFromHand, trade } from "./play.ts";
import { JAPANESE_TILE_MIX, KUMIMOJI_HANDS, KUMIMOJI_PARTY, kumimojiTileCount, TILE_MIX_TOTAL } from "./tiles.constants.ts";
import { familyKeyOf } from "./tileFamily.ts";
import { loadTileWords } from "./tileWords.ts";

const SETTINGS: PartySettings = { size: 3, level: "medium", seed: 7, gameLength: "short", language: "english", doubleSet: false, diagonals: false, hints: false };
const WORDS = new Set(["cat", "cats", "dog", "sun", "at", "go", "us", "to", "ox"]);
const judge = (tiles: PartyGame["players"][number]["tiles"]) => judgeGrid(tiles, (word) => WORDS.has(word));
const family = (tile: string) => (/^[a-z*]$/.test(tile) ? tile : null);

/** Lay the whole hand of the player whose turn it is across row 0, in its order. */
function layHand(game: PartyGame): PartyGame {
  let play = seatPlay(game);
  const count = play.hand.length;
  for (let col = 0; col < count; col += 1) play = placeFromHand(play, 0, squareAt(0, col));
  return withSeatPlay(game, play);
}

const verdictOf = (game: PartyGame) => judge(game.players[game.turn]!.tiles);
/** Every hand spells something, for the cases about other rules. */
const spells = () => true;

describe("how many a bag can play", () => {
  it("needs a hand each and one round of draws", () => {
    expect(partyTilesNeeded(3, 7)).toBe(24);
    expect(partyTilesNeeded(8, 11)).toBe(96);
    expect(partyFits(1, 11, 5)).toBe(true);
    expect(partyFits(3, 7, 24)).toBe(true);
    expect(partyFits(3, 7, 23)).toBe(false);
  });

  it("plays the chosen length where it fits, else the shortest that does, and Full always fits", () => {
    expect(partyLength(2, KUMIMOJI_HANDS.quick, "short", false)).toBe("short");
    expect(partyLength(6, KUMIMOJI_HANDS.quick, "short", false)).toBe("medium");
    expect(partyLength(8, KUMIMOJI_HANDS.classic, "short", false)).toBe("full");
    expect(partyLength(8, KUMIMOJI_HANDS.classic, "short", true)).toBe("short");
    // One player asks nothing of the size, since every puzzle's set-up asks: a Number Place is nine.
    expect(partyLength(1, 9, "medium", false)).toBe("medium");
    for (let players = 1; players <= KUMIMOJI_PARTY.most; players += 1) {
      for (const hand of [KUMIMOJI_HANDS.quick, KUMIMOJI_HANDS.classic]) expect(partyFits(players, hand, kumimojiTileCount(hand, "full"))).toBe(true);
    }
  });

  it("counts the Japanese set as the English one, so one rule serves both", () => {
    expect(Object.values(JAPANESE_TILE_MIX).reduce((sum, count) => sum + count, 0)).toBe(TILE_MIX_TOTAL);
  });

  it("reads two to eight players from an address, and anything else as the solo game", () => {
    expect(partyPlayersAsked("3")).toBe(3);
    expect(partyPlayersAsked("8")).toBe(8);
    for (const other of ["1", "9", "0", "2.5", "x", undefined]) expect(partyPlayersAsked(other)).toBe(1);
  });
});

describe("the deal and the turns", () => {
  const bag = "catdogsunxyzabcdefgh";

  it("deals each player the next hand, player one first, and takes them all from the bag", () => {
    const game = startParty(SETTINGS, bag, ["Aiko", "", "  Ben  "]);
    expect(game.players.map((player) => player.hand.join(""))).toEqual(["cat", "dog", "sun"]);
    expect(game.taken).toBe(9);
    expect(partyTilesLeft(game)).toBe(bag.length - 9);
    expect([0, 1, 2].map((at) => nameOf(game, at))).toEqual(["Aiko", "Player 2", "Ben"]);
    expect(game.turn).toBe(0);
  });

  it("refuses a bag too small for the players rather than dealing short", () => {
    expect(() => startParty(SETTINGS, "catdogsun", ["a", "b", "c"])).toThrow();
  });

  it("keeps a name to one line and the length a line holds", () => {
    expect(tidyName("  a\n  b ")).toBe("a b");
    expect(tidyName("x".repeat(40))).toHaveLength(KUMIMOJI_PARTY.nameMost);
  });

  it("plays a turn with the solo moves on that player's own hand and table, leaving the others alone", () => {
    const game = layHand(startParty(SETTINGS, bag, ["a", "b", "c"]));
    expect(game.players[0]!.hand).toEqual([]);
    expect([...game.players[0]!.tiles.values()].join("")).toBe("cat");
    expect(game.players[1]!.tiles.size).toBe(0);
    expect(game.players[1]!.hand.join("")).toBe("dog");
  });

  it("passes round the table with Done, 1 → 2 → 3 → 1", () => {
    let game = startParty(SETTINGS, bag, ["a", "b", "c"]);
    const seen: number[] = [];
    for (let step = 0; step < 4; step += 1) {
      seen.push(game.turn);
      game = endTurn(game, verdictOf(game), spells);
    }
    expect(seen).toEqual([0, 1, 2, 0]);
    expect(game.turns).toBe(4);
  });

  it("trades from the shared bag, the tile given back going to its end", () => {
    const game = startParty(SETTINGS, bag, ["a", "b", "c"]);
    const traded = withSeatPlay(game, trade(seatPlay(game), 0));
    expect(traded.returned).toBe("c");
    expect(traded.players[0]!.hand.join("")).toBe("atxyz");
    expect(partyTilesLeft(traded)).toBe(partyTilesLeft(game) - 2);
  });
});

describe("whose table is shown", () => {
  it("opens the pass screen on whoever just played, and steps round every seat either way", () => {
    let game = startParty(SETTINGS, "catdogsunxyzabcdefghijkl", ["a", "b", "c"]);
    expect(passViewStart(game)).toBe(0);
    game = endTurn(game, verdictOf(game), spells);
    expect(game.passedBy).toBe(0);
    expect(passViewStart(game)).toBe(0);
    expect([1, 2, 3, 4].map((by) => stepView(game, 0, by))).toEqual([1, 2, 0, 1]);
    expect(stepView(game, 0, -1)).toBe(2);
    // A resigned player's table is still one of the tables.
    const resigned = resign({ ...game, taken: game.bag.length });
    expect(passViewStart(resigned)).toBe(1);
    expect(stepView(resigned, 0, 1)).toBe(1);
  });
});

describe("Draw gives every player a tile", () => {
  it("only once your hand is used, your grid sound, and the bag holds one for everybody", () => {
    const game = startParty(SETTINGS, "catdogsunxyzab", ["a", "b", "c"]);
    expect(mayDrawAll(game, verdictOf(game))).toBe(false);
    const laid = layHand(game);
    expect(mayDrawAll(laid, verdictOf(laid))).toBe(true);
    const tooFew = { ...laid, taken: laid.bag.length - 2 };
    expect(mayDrawAll(tooFew, verdictOf(tooFew))).toBe(false);
  });

  it("in turn order from the one who pressed it", () => {
    const game = { ...layHand(startParty(SETTINGS, "catdogsunxyzab", ["a", "b", "c"])) };
    const second = { ...game, turn: 1 };
    const drawn = drawAll(second);
    expect(drawn.taken).toBe(game.taken + 3);
    // x to the presser (player 2), y to player 3, z round to player 1.
    expect(drawn.players.map((player) => player.hand.at(-1))).toEqual(["z", "x", "y"]);
    expect(drawAll({ ...game, taken: game.bag.length - 1 })).toEqual({ ...game, taken: game.bag.length - 1 });
  });
});

describe("going out, the last round and the winners", () => {
  // Three players, a hand of three each and one tile left: too few for everybody to draw, so a used hand goes out.
  const start = () => startParty(SETTINGS, "catdogsunx" + "yzabcdefghijkl", ["Aiko", "Ben", "Cho"]);
  const nearEnd = () => ({ ...start(), taken: 23 });

  it("goes out with Done on a used hand and a sound grid when the bag cannot give everybody a tile", () => {
    const laid = layHand(nearEnd());
    expect(goesOut(laid, verdictOf(laid))).toBe(true);
    expect(goesOut(layHand(start()), verdictOf(layHand(start())))).toBe(false);
    const ended = endTurn(laid, verdictOf(laid), spells);
    expect(ended.out).toEqual([0]);
    expect(ended.lastTurns).toEqual([1, 2]);
    expect(ended.turn).toBe(1);
    expect(isLastTurn(ended)).toBe(true);
    expect(ended.ending).toBeNull();
  });

  it("gives every other player one last turn, in order, then ends with the first out winning alone", () => {
    let game = layHand(nearEnd());
    game = endTurn(game, verdictOf(game), spells);
    game = endTurn(game, verdictOf(game), spells);
    expect(game.turn).toBe(2);
    expect(game.lastTurns).toEqual([2]);
    expect(winnersOf(game)).toEqual([]);
    game = endTurn(game, verdictOf(game), spells);
    expect(game.ending).toBe("out");
    expect(winnersOf(game)).toEqual([0]);
    expect(endTurn(game, verdictOf(game), spells)).toBe(game);
  });

  it("shares the win with anybody who also goes out on their last turn", () => {
    let game = { ...layHand(startParty(SETTINGS, "catdogsunx" + "yzabcdefghijkl", ["Aiko", "Ben", "Cho"])), taken: 23, turn: 1 };
    game = layHand(game);
    game = endTurn(game, verdictOf(game), spells);
    expect(game.out).toEqual([1]);
    expect(game.lastTurns).toEqual([2, 0]);
    game = endTurn(game, verdictOf(game), spells);
    // Player one laid CAT before the round began: their hand is used on their last turn too.
    game = endTurn(game, verdictOf(game), spells);
    expect(game.ending).toBe("out");
    expect(winnersOf(game)).toEqual([1, 0]);
  });

  it("does not let a player whose grid is unsound go out", () => {
    let game = nearEnd();
    let play = seatPlay(game);
    play = placeFromHand(play, 0, "0,0");
    play = placeFromHand(play, 0, "0,2");
    play = placeFromHand(play, 0, "0,4");
    game = withSeatPlay(game, play);
    expect(goesOut(game, verdictOf(game))).toBe(false);
    expect(endTurn(game, verdictOf(game), spells).lastTurns).toBeNull();
  });
});

describe("a hand that spells nothing must be traded first", () => {
  const spellsNothing = () => false;
  const start = () => startParty(SETTINGS, "catdogsunxyzabcdefghijkl", ["a", "b", "c"]);

  it("holds Done until the player trades, while the bag can give three", () => {
    const game = start();
    expect(mustTradeFirst(game, spellsNothing)).toBe(true);
    expect(endTurn(game, verdictOf(game), spellsNothing)).toBe(game);
    const traded = withSeatPlay(game, trade(seatPlay(game), 0));
    expect(traded.traded).toBe(true);
    expect(mustTradeFirst(traded, spellsNothing)).toBe(false);
    const passed = endTurn(traded, verdictOf(traded), spellsNothing);
    expect(passed.turn).toBe(1);
    // A new turn, a new player: they have not traded yet.
    expect(passed.traded).toBe(false);
    expect(mustTradeFirst(passed, spellsNothing)).toBe(true);
  });

  it("allows one trade a turn: after it the player may lay or press Done, and trades again next turn", () => {
    const game = start();
    expect(mayTradeThisTurn(game)).toBe(true);
    const traded = withSeatPlay(game, trade(seatPlay(game), 0));
    expect(mayTradeThisTurn(traded)).toBe(false);
    // A second trade is refused, the game given back as it was: nothing more comes out of the bag.
    expect(withSeatPlay(traded, trade(seatPlay(traded), 0))).toBe(traded);
    // Laying still works after a trade.
    const laid = withSeatPlay(traded, placeFromHand(seatPlay(traded), 0, "0,0"));
    expect(laid.players[0]!.tiles.size).toBe(1);
    expect(mayTradeThisTurn(laid)).toBe(false);
    const passed = endTurn(laid, verdictOf(laid), spells);
    expect(mayTradeThisTurn(passed)).toBe(true);
  });

  it("lets Done through once something is laid, when the hand spells a word, or when the bag cannot give three", () => {
    const game = start();
    const laid = withSeatPlay(game, placeFromHand(seatPlay(game), 0, "0,0"));
    expect(mustTradeFirst(laid, spellsNothing)).toBe(false);
    expect(mustTradeFirst(game, spells)).toBe(false);
    expect(mustTradeFirst({ ...game, taken: game.bag.length - 2 }, spellsNothing)).toBe(false);
  });

  it("counts the table as it stood when the turn began, not an empty one", () => {
    let game = layHand(start());
    game = endTurn(game, verdictOf(game), spells);
    game = endTurn(game, verdictOf(game), spells);
    game = endTurn(game, verdictOf(game), spells);
    expect(game.turn).toBe(0);
    expect(game.startTable).toBe("act");
    // CAT still on the table from an earlier turn, and a hand that spells nothing: laying nothing new, they must trade.
    const drawn = drawAll(game);
    expect(mustTradeFirst(drawn, spellsNothing)).toBe(true);
  });

  it("reads a hand with a wild as able to spell, and a real hand against the list", async () => {
    const words = await loadTileWords();
    expect(handCanSpell([..."cat"], words)).toBe(true);
    expect(handCanSpell([..."qzx"], words)).toBe(false);
    expect(handCanSpell([..."qz*"], words)).toBe(true);
  });
});

describe("resigning, the last one standing, and a tie", () => {
  // Three players, hands of three, and the bag down to two: nothing more can be got from it.
  const endgame = () => ({ ...startParty(SETTINGS, "catdogsunxyzabcdefghijkl", ["Aiko", "Ben", "Cho"]), taken: 22 });

  it("is offered only once the bag cannot give a trade", () => {
    const game = startParty(SETTINGS, "catdogsunxyzabcdefghijkl", ["a", "b", "c"]);
    expect(mayResign(game)).toBe(false);
    expect(resign(game)).toBe(game);
    expect(mayResign({ ...game, taken: game.bag.length - 3 })).toBe(false);
    expect(mayResign(endgame())).toBe(true);
  });

  it("passes a resigned player over from then on", () => {
    let game = resign(endgame());
    expect(game.resigned).toEqual([0]);
    expect(stillIn(game)).toEqual([1, 2]);
    expect(game.turn).toBe(1);
    game = endTurn(game, verdictOf(game), spells);
    game = endTurn(game, verdictOf(game), spells);
    expect(game.turn).toBe(1);
    expect(game.resignRun).toEqual([]);
  });

  it("gives the last one standing the win for a tile laid on a sound grid, and not for nothing", () => {
    let game = resign(resign(endgame()));
    expect(game.turn).toBe(2);
    expect(lastStanding(game)).toBe(true);
    expect(doneRefused(game, verdictOf(game), spells)).toBe("standing");
    expect(endTurn(game, verdictOf(game), spells)).toBe(game);
    game = layHand(game);
    expect(doneRefused(game, verdictOf(game), spells)).toBeNull();
    game = endTurn(game, verdictOf(game), spells);
    expect(game.ending).toBe("standing");
    expect(winnersOf(game)).toEqual([2]);
  });

  it("ties everybody who resigned since the last Done when the last one standing resigns too", () => {
    let game = endgame();
    game = resign(game);
    game = endTurn(game, verdictOf(game), spells);
    // Aiko resigned before Ben's Done; Cho and then Ben resign in the final run.
    game = resign(game);
    expect(game.turn).toBe(1);
    game = resign(game);
    expect(game.ending).toBe("tied");
    expect(winnersOf(game)).toEqual([2, 1]);
  });

  it("ties every player who resigns in one run with nobody left standing", () => {
    const game = resign(resign(resign(endgame())));
    expect(game.ending).toBe("tied");
    expect(winnersOf(game)).toEqual([0, 1, 2]);
  });

  it("gives a resigned player no last turn, and a resignation in the last round ends that turn without the win", () => {
    // Four players, so one who goes out still leaves the bag able to... not give everybody a tile: two left.
    const four = { ...startParty(SETTINGS, "catdogsunabcxyzdefghijk", ["a", "b", "c", "d"]), taken: 21 };
    let game = resign({ ...four, turn: 3 });
    expect(game.turn).toBe(0);
    game = layHand(game);
    game = endTurn(game, verdictOf(game), spells);
    expect(game.out).toEqual([0]);
    expect(game.lastTurns).toEqual([1, 2]);
    game = resign(game);
    expect(game.turn).toBe(2);
    game = endTurn(game, verdictOf(game), spells);
    expect(game.ending).toBe("out");
    expect(winnersOf(game)).toEqual([0]);
  });
});

describe("keeping the game in the browser", () => {
  it("reads back exactly what was written, mid last round", () => {
    // Aiko lays CAT and draws, everybody takes a tile, and her S makes CATS with the bag empty: she is out.
    let game = layHand(startParty(SETTINGS, "catdogsunsox", ["Aiko", "", "Cho"]));
    game = drawAll(game);
    game = withSeatPlay(game, placeFromHand(seatPlay(game), 0, squareAt(0, 3)));
    expect(goesOut(game, verdictOf(game))).toBe(true);
    game = endTurn(game, verdictOf(game), spells);
    const back = decodeParty(encodeParty(game), family)!;
    expect(back).not.toBeNull();
    expect(encodeParty(back)).toBe(encodeParty(game));
    expect(back.lastTurns).toEqual([1, 2]);
    const resigned = decodeParty(encodeParty(resign({ ...back, taken: back.bag.length })), family)!;
    expect(resigned.resigned).toEqual([1]);
    expect(resigned.resignRun).toEqual([1]);
    expect(back.players[0]!.tiles.get("0,1")).toBe("a");
    expect(isPartyFor(back, SETTINGS, 3)).toBe(true);
    expect(isPartyFor(back, { ...SETTINGS, seed: 8 }, 3)).toBe(false);
    expect(isPartyFor(back, SETTINGS, 4)).toBe(false);
  });

  it("keeps Diagonals with the game, reads a game kept before it as played without, and opens neither for the other", () => {
    const diagonal = startParty({ ...SETTINGS, diagonals: true }, "catdogsunsox", ["Aiko", "", "Cho"]);
    const back = decodeParty(encodeParty(diagonal), family)!;
    expect(back.settings.diagonals).toBe(true);
    expect(isPartyFor(back, { ...SETTINGS, diagonals: true }, 3)).toBe(true);
    expect(isPartyFor(back, SETTINGS, 3)).toBe(false);
    const kept = JSON.parse(encodeParty(startParty(SETTINGS, "catdogsunsox", ["Aiko", "", "Cho"])));
    delete kept.settings.diagonals;
    expect(decodeParty(JSON.stringify(kept), family)!.settings.diagonals).toBe(false);
    expect(decodeParty(JSON.stringify({ ...kept, settings: { ...kept.settings, diagonals: "yes" } }), family)).toBeNull();
  });

  it("refuses what is not a kept game, or one whose tiles did not come out of its bag", () => {
    const game = startParty(SETTINGS, "catdogsunxyzabcdefghijkl", ["a", "b", "c"]);
    expect(decodeParty(null)).toBeNull();
    expect(decodeParty("not json")).toBeNull();
    expect(decodeParty(JSON.stringify({ v: 99 }))).toBeNull();
    const kept = JSON.parse(encodeParty(game)) as { players: { hand: string }[]; turn: number };
    expect(decodeParty(JSON.stringify({ ...kept, turn: 5 }))).toBeNull();
    kept.players[0]!.hand = "qqq";
    const forged = JSON.stringify(kept);
    expect(decodeParty(forged)).not.toBeNull();
    expect(decodeParty(forged, family)).toBeNull();
    expect(holdsItsBag(game, family)).toBe(true);
  });
});

describe("with a real bag", () => {
  beforeAll(async () => {
    await loadTileWords();
  });

  it("deals eight Quick hands from a Medium bag and keeps every tile accounted for through a draw", async () => {
    const words = await loadTileWords();
    const length = partyLength(8, KUMIMOJI_HANDS.quick, "short", false);
    const bag = generateKumimoji(KUMIMOJI_HANDS.quick, "medium", 11, { gameLength: length }).givens;
    const game = startParty({ ...SETTINGS, size: KUMIMOJI_HANDS.quick, gameLength: length }, bag, Array.from({ length: 8 }, () => ""));
    expect(game.players.every((player) => player.hand.length === KUMIMOJI_HANDS.quick)).toBe(true);
    expect(holdsItsBag(drawAll(game), words.familyKey)).toBe(true);
    expect(drawAll(game).players.every((player) => player.hand.length === KUMIMOJI_HANDS.quick + 1)).toBe(true);
  });

  it("keeps a Japanese game, whose tiles are not letters, and reads it back on its own bag", async () => {
    const words = await loadTileWords("japanese");
    const length = partyLength(3, KUMIMOJI_HANDS.quick, "short", false);
    const settings: PartySettings = { ...SETTINGS, size: KUMIMOJI_HANDS.quick, gameLength: length, language: "japanese" };
    const bag = generateKumimoji(KUMIMOJI_HANDS.quick, "medium", 11, { gameLength: length, language: "japanese" }).givens;
    const game = drawAll(startParty(settings, bag, ["Aiko", "", "Cho"]));
    const laid = withSeatPlay(game, placeFromHand(seatPlay(game), 0, squareAt(0, 0)));
    const back = decodeParty(encodeParty(laid), words.familyKey);
    expect(back).not.toBeNull();
    expect(encodeParty(back!)).toBe(encodeParty(laid));
    expect(decodeParty(encodeParty(laid), familyKeyOf("japanese"))).not.toBeNull();
  });
});
