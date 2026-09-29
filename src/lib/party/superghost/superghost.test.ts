import { describe, expect, it } from "vitest";

import { PARTY_SPECS } from "../party.constants";

import {
  GHOST_LOSS,
  GHOST_OUT_AT,
  GHOST_PHASE,
  answerProblem,
  decodeGhost,
  encodeGhost,
  foldGhostLetter,
  foldGhostWord,
  ghostAgain,
  ghostLettersOf,
  ghostMoves,
  ghostStillIn,
  playGhost,
  startGhost,
} from "./superghost";
import type { GhostGame, GhostJudge, GhostMove } from "./superghost.types";

/**
 * SUPERGHOST'S RULES, with a word list of the test's own: what the game does
 * is decided here, and which words the site knows is `ghostWords.test.ts`'s.
 */
const WORDS = new Set(["cat", "cats", "scatter", "chat", "chats", "art", "cart", "carts", "かつこう"]);
const judge: GhostJudge = {
  isWord: (letters) => WORDS.has(letters),
  wordWith: (fragment, shortest) => [...WORDS].find((word) => [...word].length >= shortest && word.includes(fragment)) ?? null,
};

/** A game that must exist: the test is about what comes after, not whether it starts. */
function start(count: number, language: "english" | "japanese" = "english"): GhostGame {
  const game = startGhost(4, new Array<string>(count).fill(""), language);
  if (game === null) throw new Error(`no table of ${count}`);
  return game;
}

/** Make each move in turn, failing loudly on one the rules refuse. */
function play(game: GhostGame, ...moves: GhostMove[]): GhostGame {
  return moves.reduce((at, move) => {
    const next = playGhost(at, move, judge);
    if (next === null) throw new Error(`${JSON.stringify(move)} refused`);
    return next;
  }, game);
}

const before = (letter: string): GhostMove => ({ kind: "letter", letter, end: "before" });
const after = (letter: string): GhostMove => ({ kind: "letter", letter, end: "after" });
const challenge: GhostMove = { kind: "challenge" };

describe("superghost's table", () => {
  it("seats two to eight, with a word of four letters or more losing, in English or Japanese", () => {
    const spec = PARTY_SPECS.superghost;
    expect(startGhost(4, [""], "english")).toBeNull();
    expect(startGhost(4, new Array(9).fill(""), "english")).toBeNull();
    expect(startGhost(3, ["", ""], "english")).toBeNull();
    for (let count = spec.fewestPlayers; count <= spec.mostPlayers; count += 1) expect(startGhost(4, new Array(count).fill(""), "japanese")).not.toBeNull();
    const game = start(3);
    expect(game.fragment).toBe("");
    expect(game.toPlay).toBe(0);
    expect(game.letters).toEqual([0, 0, 0]);
  });

  it("has nothing to challenge before the first letter, and every letter at either end after", () => {
    const game = start(2);
    const first = ghostMoves(game, judge);
    expect(first).toHaveLength(52);
    expect(first.some((move) => move.kind === "challenge")).toBe(false);
    expect(playGhost(game, challenge, judge)).toBeNull();
    const second = ghostMoves(play(game, after("c")), judge);
    expect(second).toHaveLength(53);
    expect(second.at(-1)).toEqual(challenge);
    // In Japanese, the forty-five kana of the tiles, at either end.
    expect(ghostMoves(start(2, "japanese"), judge)).toHaveLength(90);
  });

  it("adds letters at both ends and passes the turn round the table", () => {
    const game = play(start(3), after("a"), before("c"), after("t"));
    expect(game.fragment).toBe("cat");
    expect(game.toPlay).toBe(0);
    expect(game.lastBy).toBe(2);
    // A letter not of the game's alphabet is refused, and so is a kana in English.
    expect(playGhost(game, after("A"), judge)).toBeNull();
    expect(playGhost(game, after("か"), judge)).toBeNull();
  });
});

describe("losing a round", () => {
  it("a word shorter than four letters is safe; finishing one of four or more loses the round", () => {
    const three = play(start(3), after("c"), after("a"), after("t"));
    expect(three.phase).toBe(GHOST_PHASE.adding);
    const lost = play(three, after("s"));
    expect(lost.rounds).toHaveLength(1);
    expect(lost.rounds[0]).toMatchObject({ fragment: "cats", loser: 0, how: GHOST_LOSS.spelled, word: "cats" });
    expect(lost.letters).toEqual([1, 0, 0]);
    expect(ghostLettersOf(lost, 0)).toBe("G");
    // The loser begins the next round, from nothing.
    expect(lost.fragment).toBe("");
    expect(lost.toPlay).toBe(0);
  });

  it("a challenge answered with a real word costs the challenger", () => {
    const challenged = play(start(3), after("a"), after("t"), challenge);
    expect(challenged.phase).toBe(GHOST_PHASE.answering);
    expect(challenged.toPlay).toBe(1);
    expect(challenged.challenger).toBe(2);
    expect(ghostMoves(challenged, judge)).toEqual([{ kind: "answer", word: "cats" }, { kind: "concede" }]);
    const answered = play(challenged, { kind: "answer", word: "scatter" });
    expect(answered.rounds[0]).toMatchObject({ loser: 2, how: GHOST_LOSS.named, word: "scatter", challenger: 2, challenged: 1 });
    expect(answered.toPlay).toBe(2);
  });

  it("a challenge nobody can answer costs the player challenged", () => {
    const challenged = play(start(2), after("x"), after("q"), challenge);
    expect(ghostMoves(challenged, judge)).toEqual([{ kind: "concede" }]);
    const caught = play(challenged, { kind: "concede" });
    expect(caught.rounds[0]).toMatchObject({ loser: 1, how: GHOST_LOSS.caught, word: null, challenger: 0, challenged: 1 });
    expect(caught.letters).toEqual([0, 1]);
  });

  it("refuses a word named that is not taken, and says why, so the table can try again", () => {
    const challenged = play(start(2), after("a"), after("t"), challenge);
    expect(answerProblem(challenged, "cat", judge)).toBe("short");
    expect(answerProblem(challenged, "chips", judge)).toBe("missing");
    expect(answerProblem(challenged, "atxx", judge)).toBe("unknown");
    expect(answerProblem(challenged, "sc4tter", judge)).toBe("letters");
    expect(answerProblem(challenged, "chats", judge)).toBeNull();
    expect(playGhost(challenged, { kind: "answer", word: "cat" }, judge)).toBeNull();
    // Nothing but a word or giving up while answering.
    expect(playGhost(challenged, after("s"), judge)).toBeNull();
  });
});

describe("going out and winning", () => {
  it("five letters and a player is out, skipped round the table, and the last one left wins", () => {
    const concede: GhostMove = { kind: "concede" };
    // Seat 1 is caught bluffing in the first round, and then in each round they begin.
    let game = play(start(3), after("x"), after("q"), challenge, concede);
    for (let round = 1; round < GHOST_OUT_AT; round += 1) {
      expect(game.toPlay).toBe(1);
      game = play(game, after("x"), challenge, concede);
    }
    expect(game.letters).toEqual([0, GHOST_OUT_AT, 0]);
    expect(ghostStillIn(game, 1)).toBe(false);
    expect(ghostLettersOf(game, 1)).toBe("GHOST");
    // Out, so the next round begins with the next player still in, and the turn never reaches them.
    expect(game.toPlay).toBe(2);
    const round = play(game, after("x"), after("y"));
    expect(round.lastBy).toBe(0);
    expect(round.toPlay).toBe(2);
  });

  it("ends when one player is left, and names them", () => {
    let game = start(2);
    for (let round = 0; round < GHOST_OUT_AT; round += 1) game = play(game, ...(game.toPlay === 0 ? [after("x"), after("q"), challenge] : [after("x"), challenge]), { kind: "concede" });
    expect(game.phase).toBe(GHOST_PHASE.finished);
    expect(game.winners).toHaveLength(1);
    expect(ghostMoves(game, judge)).toEqual([]);
    const loser = game.winners[0] === 0 ? 1 : 0;
    expect(game.letters[loser]).toBe(GHOST_OUT_AT);
    // The same table again, the next seat round beginning.
    const again = ghostAgain(game);
    expect(again.letters).toEqual([0, 0]);
    expect(again.toPlay).toBe(1);
  });
});

describe("Japanese, in the Kumimoji tiles' kana", () => {
  it("plays が as か and ゃ as や, and reads a word typed the same way", () => {
    expect(foldGhostLetter("japanese", "が")).toBe("か");
    expect(foldGhostLetter("japanese", "ゃ")).toBe("や");
    expect(foldGhostLetter("japanese", "を")).toBe("お");
    expect(foldGhostLetter("japanese", "ー")).toBeNull();
    expect(foldGhostLetter("japanese", "a")).toBeNull();
    expect(foldGhostWord("japanese", "がっこう")).toBe("かつこう");
    expect(foldGhostWord("english", " Scatter ")).toBe("scatter");
    expect(foldGhostWord("english", "can't")).toBeNull();
    const game = play(start(2, "japanese"), after("か"), after("つ"), after("こ"));
    expect(play(game, after("う")).rounds[0]).toMatchObject({ how: GHOST_LOSS.spelled, word: "かつこう", loser: 1 });
    expect(ghostLettersOf(play(game, after("う")), 1)).toBe("お");
  });
});

describe("kept and read back", () => {
  it("reads a kept game back exactly, with the verdicts it was played with and no word list", () => {
    const game = play(start(3), after("c"), after("a"), after("t"), after("s"), after("a"), after("t"), challenge, { kind: "answer", word: "scatter" }, after("x"), challenge);
    const back = decodeGhost(encodeGhost(game));
    expect(back).toEqual(game);
    expect(back?.phase).toBe(GHOST_PHASE.answering);
  });

  it("refuses what the rules could not have played, or a verdict they would not give", () => {
    const game = play(start(2), after("c"), after("a"), after("t"), after("s"));
    const kept = JSON.parse(encodeGhost(game)) as { rounds: string[]; record: string; players: string[] };
    expect(decodeGhost(null)).toBeNull();
    expect(decodeGhost("{")).toBeNull();
    expect(decodeGhost(JSON.stringify({ ...kept, rounds: [">c>a>t>s"] }))).toBeNull();
    expect(decodeGhost(JSON.stringify({ ...kept, rounds: [">c>a!"] }))).toBeNull();
    expect(decodeGhost(JSON.stringify({ ...kept, record: "?" }))).toBeNull();
    expect(decodeGhost(JSON.stringify({ ...kept, record: ">c?=cab." }))).toBeNull();
    expect(decodeGhost(JSON.stringify({ ...kept, players: [""] }))).toBeNull();
    expect(decodeGhost(JSON.stringify({ ...kept, record: ">c>a" }))).not.toBeNull();
  });
});
