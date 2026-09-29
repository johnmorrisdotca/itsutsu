import { beforeAll, describe, expect, it } from "vitest";

import { ghostJudge, ghostWordsReady, loadGhostWords } from "./ghostWords";
import { answerProblem, foldGhostWord, playGhost, startGhost } from "./superghost";
import type { GhostGame, GhostMove } from "./superghost.types";

/**
 * SUPERGHOST AGAINST THE SITE'S OWN WORDS: Kumimoji's lists, SCOWL for
 * English and JMdict for Japanese, judged as the table judges them.
 */
beforeAll(async () => {
  await Promise.all([loadGhostWords("english"), loadGhostWords("japanese")]);
});

function playAll(game: GhostGame, moves: readonly GhostMove[]): GhostGame {
  return moves.reduce((at, move) => {
    const next = playGhost(at, move, ghostJudge(at.language));
    if (next === null) throw new Error(`${JSON.stringify(move)} refused`);
    return next;
  }, game);
}

describe("superghost's English words", () => {
  it("knows the words a table would name, and not the nonsense a bluff makes", () => {
    const judge = ghostJudge("english");
    expect(ghostWordsReady("english")).toBe(true);
    for (const word of ["cats", "ghost", "scatter", "quiz", "rhythm"]) expect(judge.isWord(word), word).toBe(true);
    for (const word of ["xqzt", "catz", "ghst"]) expect(judge.isWord(word), word).toBe(false);
  });

  it("finds a word of four letters or more with a fragment in it, or says there is none", () => {
    const judge = ghostJudge("english");
    const found = judge.wordWith("tte", 4);
    expect(found).not.toBeNull();
    expect(found!).toContain("tte");
    expect(found!.length).toBeGreaterThanOrEqual(4);
    expect(judge.isWord(found!)).toBe(true);
    // "cat" itself is too short to answer with: something longer is found.
    expect(judge.wordWith("cat", 4)!.length).toBeGreaterThanOrEqual(4);
    expect(judge.wordWith("xqz", 4)).toBeNull();
    expect(judge.wordWith("abcdefghijklmnopq", 4)).toBeNull();
  });

  it("loses the round for the letter that finishes GHOST, and takes a real word in answer to a challenge", () => {
    const game = startGhost(4, ["Ann", "Ben", "Cy"], "english")!;
    const letter = (letter: string, end: "before" | "after" = "after"): GhostMove => ({ kind: "letter", letter, end });
    const spelled = playAll(game, [letter("h"), letter("o"), letter("g", "before"), letter("s"), letter("t")]);
    expect(spelled.rounds[0]).toMatchObject({ how: "spelled", word: "ghost", loser: 1 });
    const challenged = playAll(game, [letter("t"), letter("t"), letter("e"), { kind: "challenge" }]);
    expect(answerProblem(challenged, foldGhostWord("english", "Letter")!, ghostJudge("english"))).toBeNull();
    expect(answerProblem(challenged, "ttexq", ghostJudge("english"))).toBe("unknown");
  });
});

describe("superghost's Japanese words", () => {
  it("reads a word spelt in the tiles' kana, whichever form was typed", () => {
    const judge = ghostJudge("japanese");
    expect(ghostWordsReady("japanese")).toBe(true);
    for (const typed of ["がっこう", "さくら", "しんぶん", "ともだち"]) expect(judge.isWord(foldGhostWord("japanese", typed)!), typed).toBe(true);
    expect(judge.isWord("ぬぬぬぬ")).toBe(false);
    const found = judge.wordWith("くら", 4);
    expect(found).not.toBeNull();
    expect(found!).toContain("くら");
    expect([...found!].length).toBeGreaterThanOrEqual(4);
  });
});
