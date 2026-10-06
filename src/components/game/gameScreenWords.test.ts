import { describe, expect, it } from "vitest";

import { dottedName, feltName, gridStyleName, scaleWords, stoneSetName, surfaceTestName, themeName } from "@/components/board/boardNames";
import { BOARD_THEMES, FELTS } from "@/components/board/Board.constants";
import { squareLabel } from "@/components/board/squareLabel";
import { gameEndingCopy } from "@/components/play/gameEnding.constants";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import { speaker } from "@/lib/i18n/i18n";

import { gameCopy } from "./game.constants";
import { winCoverCopy } from "./winCover.constants";
import { resultLine, tableNews } from "./winNews";

const en = speaker("en");
const ja = speaker("ja");

/**
 * THE GAME SCREEN IN BOTH LANGUAGES. What an English reader sees is what it
 * always was, and a Japanese reader is shown Japanese alone: a name that has a
 * kanji beside it in English is the kanji, once, and never the English too.
 */
describe("the board's own looks, named for the reader", () => {
  it("puts the kanji beside the English name, and shows a Japanese reader the Japanese alone", () => {
    expect(themeName(en, "kaya")).toEqual({ label: "Kaya", kanji: "榧" });
    expect(themeName(ja, "kaya")).toEqual({ label: "榧", kanji: "" });
    expect(feltName(en, "green").label).toBe("Green");
    expect(feltName(ja, "green").label).toBe("緑");
    expect(stoneSetName(ja, "jade").kanji).toBe("");
  });

  it("names the three views and says what each does, in either language", () => {
    expect(dottedName(gridStyleName(en, "auto"))).toBe("Traditional view · 伝統");
    expect(dottedName(gridStyleName(ja, "auto"))).toBe("伝統的な表示");
    expect(gridStyleName(ja, "lines").hint).toContain("碁盤");
  });

  it("names the three sizes of board on a desk", () => {
    expect(scaleWords(en, "large").label).toBe("Large");
    expect(scaleWords(ja, "large").whole).toContain("全画面");
  });

  it("keeps the English surface name a browser test reads, whatever language the page is in", () => {
    expect(surfaceTestName(BOARD_THEMES.kaya)).toBe("Kaya");
    expect(surfaceTestName(FELTS.blue)).toBe("Blue");
  });

  it("names one square for a screen reader", () => {
    expect(squareLabel(8, { row: 0, col: 1 }, STONES.black, { forbidden: false, king: true })).toBe("B8, Black king");
    expect(squareLabel(8, { row: 0, col: 1 }, STONES.black, { forbidden: false, king: true }, ja)).toBe("B8は黒のキング");
    expect(squareLabel(15, { row: 7, col: 7 }, null, { forbidden: true, king: false }, ja)).toBe("H8は禁じ手");
  });
});

describe("ending a game", () => {
  it("says Resign and New game the same way on every kind of play", () => {
    expect(gameEndingCopy(en).resign).toBe("Resign");
    expect(gameEndingCopy(ja).resign).toBe("投了");
    expect(gameEndingCopy(ja).newGame).toBe("新規対局");
    expect(gameEndingCopy(ja).giveUp).toBe("あきらめる");
  });

  it("asks who resigns, and who wins, in the reader's language", () => {
    expect(gameEndingCopy(en).resignFor("Ann", 2)).toBe("Resign this game for Ann? The other player wins.");
    expect(gameEndingCopy(ja).resignFor("Ann", 2)).toContain("Ann");
    expect(gameEndingCopy(ja).resignedResult("Ann", ["Ben"])).toBe("Annが投了しました。Benの勝ちです。");
    expect(gameEndingCopy(en).resignedResult("Ann", [])).toContain("nobody the winner");
  });

  it("counts the other games going, with a plus where there are more", () => {
    expect(gameEndingCopy(en).othersGoing(1, false, "Gomoku")).toBe("1 other Gomoku game is going in My games");
    expect(gameEndingCopy(en).othersGoing(3, true, "Gomoku")).toBe("3+ other Gomoku games are going in My games");
    expect(gameEndingCopy(ja).othersGoing(3, true, "五目並べ")).toBe("「対局中」に、ほかの五目並べが3+局あります");
  });
});

describe("the win cover", () => {
  it("shows an English reader the kanji beside the words and a Japanese reader the words alone", () => {
    expect(winCoverCopy(en).solved).toEqual({ label: "Solved", kanji: "解決" });
    expect(winCoverCopy(ja).solved).toEqual({ label: "解決", kanji: "" });
    expect(winCoverCopy(en).after("4:49", 131)).toBe(" in 4:49, in 131 moves");
    expect(winCoverCopy(ja).after("4:49")).toBe("（所要4:49）");
  });

  it("says who won, to the right person, in Japanese", () => {
    const next = null;
    expect(tableNews({ names: ["Aiko", "Ben"], winners: [0], you: null, next }, ja)?.headline.label).toBe("Aikoの勝ち");
    expect(tableNews({ names: ["Aiko", "Ben"], winners: [0], you: 0, next }, ja)?.headline.label).toBe("勝ちです");
    expect(tableNews({ names: ["Aiko", "Ben", "Chloe"], winners: [0, 2], you: null, next }, ja)?.headline.label).toBe("AikoとChloeで勝ちを分け合いました");
    expect(resultLine(["Aiko", "Ben"], [], true, ja)).toBe("引き分け");
  });
});

describe("the words under the board", () => {
  it("is a full sentence in Japanese, with the winner named", () => {
    expect(gameCopy(ja).winsByCaptures("Aiko", 5)).toBe("Aikoの勝ちです。5子を取りました。");
    expect(gameCopy(en).winsByCaptures("Aiko", 5)).toBe("Aiko wins by capturing 5 stones");
  });

  it("counts a win streak as a streak, not an ordinal", () => {
    expect(gameCopy(en).reviewStreak("Aiko", 3)).toBe("Aiko's 3rd win in a row.");
    expect(gameCopy(ja).reviewStreak("Aiko", 3)).toBe("Aikoの3連勝。");
  });
});
