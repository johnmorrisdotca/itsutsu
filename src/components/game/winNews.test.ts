import { describe, expect, it } from "vitest";

import { namesInALine, solvedNews, tableNews } from "./winNews";

const next = { label: "Play again, same table", onPress: () => undefined };

describe("the words on a win's cover", () => {
  it("says a solve with its time, and a card game won with its moves", () => {
    const solved = solvedNews({ cards: false, elapsed: "4:49", xp: null, next });
    expect(solved.headline).toEqual({ label: "Solved", kanji: "解決", after: " in 4:49" });
    expect(solved.mark).toBe("解");
    expect(solved.tone).toBe("won");
    expect(solved.xp).toBeNull();
    const won = solvedNews({ cards: true, elapsed: "4:49", moves: 131, next });
    expect(won.headline).toEqual({ label: "Won", kanji: "勝ち", after: " in 4:49, in 131 moves" });
    expect(won.mark).toBe("勝");
    expect("xp" in won).toBe(false);
    expect(solvedNews({ cards: true, elapsed: "0:40", moves: 1, next }).headline.after).toBe(" in 0:40, in 1 move");
  });

  it("names the winner at a device several people share", () => {
    const news = tableNews({ names: ["Aiko", "Ben"], winners: [0], you: null, next });
    expect(news?.headline).toEqual({ label: "Aiko wins", kanji: "勝ち" });
    expect(news?.tone).toBe("decided");
    expect(news?.mark).toBe("勝");
  });

  it("says you win to the one person among computers, and names the computer quietly when it wins", () => {
    const mine = tableNews({ names: ["Aiko", "Computer 2"], winners: [0], you: 0, next });
    expect(mine?.headline.label).toBe("You win");
    expect(mine?.tone).toBe("won");
    const theirs = tableNews({ names: ["Aiko", "Computer 2"], winners: [1], you: 0, next });
    expect(theirs?.headline.label).toBe("Computer 2 wins");
    expect(theirs?.tone).toBe("lost");
    expect(theirs?.mark).toBe("終");
  });

  it("shares a win by name, with you among them", () => {
    expect(tableNews({ names: ["Aiko", "Ben", "Chloe"], winners: [0, 2], you: null, next })?.headline.label).toBe("Aiko and Chloe share the win");
    expect(tableNews({ names: ["Aiko", "Ben", "Chloe"], winners: [0, 2], you: 2, next })?.headline.label).toBe("You and Aiko share the win");
  });

  it("says a draw where the game calls a tie one, and nothing where nobody won", () => {
    const draw = tableNews({ names: ["Aiko", "Ben"], winners: [0, 1], you: null, draw: true, next });
    expect(draw?.headline).toEqual({ label: "Draw", kanji: "引き分け" });
    expect(draw?.tone).toBe("draw");
    expect(tableNews({ names: ["Aiko", "Ben"], winners: [], you: null, next })).toBeNull();
  });

  it("joins names as a sentence does", () => {
    expect(namesInALine([])).toBe("");
    expect(namesInALine(["Aiko"])).toBe("Aiko");
    expect(namesInALine(["Aiko", "Ben", "Chloe"])).toBe("Aiko, Ben and Chloe");
  });
});
