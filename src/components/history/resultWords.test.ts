import { describe, expect, it } from "vitest";

import { STONES, WIN_REASONS } from "@/lib/gomoku/gomoku.constants";
import { speaker } from "@/lib/i18n/i18n";
import { RESULT_DRAW_REASONS } from "@/lib/history/gameResult.constants";
import type { GameResultFacts, ResultReason } from "@/lib/history/gameResult.types";

import { RESULT_REASONS } from "./resultCard.constants";
import { headlineOf, reasonOf, scoreWords } from "./resultWords";

/**
 * THE RESULT CARD'S WORDS — said to "you", or by colour at one screen, for every
 * way a game can end.
 */

/* Two people, since a computer player's name is never shortened — see `shownName`. */
const names = { black: "Kuro Tester", white: "Shiro Tester" };

function facts(over: Partial<GameResultFacts>): GameResultFacts {
  return { outcome: "won", winner: STONES.black, reason: WIN_REASONS.line, score: null, ...over };
}

describe("the headline", () => {
  it("says you won, you lost, or draw to a player", () => {
    expect(headlineOf(facts({ outcome: "won" })).label).toBe("You won");
    expect(headlineOf(facts({ outcome: "lost" })).label).toBe("You lost");
    expect(headlineOf(facts({ outcome: "draw", winner: null, reason: "draw" })).label).toBe("Draw");
  });

  it("says the winning colour at one screen", () => {
    expect(headlineOf(facts({ outcome: "decided", winner: STONES.white })).label).toBe("White wins");
    expect(headlineOf(facts({ outcome: "decided", winner: STONES.black })).label).toBe("Black wins");
  });
});

describe("the reason", () => {
  it("names the winner as you when you won, and the other player by name", () => {
    expect(reasonOf(facts({ outcome: "won" }), names)).toBe("You completed a winning line.");
    expect(reasonOf(facts({ outcome: "lost" }), names)).toBe("Kuro T. completed a winning line.");
  });

  it("names the side an ending is about: you resigned, or they did", () => {
    expect(reasonOf(facts({ outcome: "lost", reason: WIN_REASONS.resign }), names)).toBe("You resigned.");
    expect(reasonOf(facts({ outcome: "won", reason: WIN_REASONS.resign }), names)).toBe("Shiro T. resigned.");
    expect(reasonOf(facts({ outcome: "won", reason: WIN_REASONS.time }), names)).toBe("Shiro T. ran out of time.");
    expect(reasonOf(facts({ outcome: "lost", reason: WIN_REASONS.blocked }), names)).toBe("You had no move left.");
  });

  it("uses colours at one screen, and gives a draw the engine's reason", () => {
    expect(reasonOf(facts({ outcome: "decided", reason: WIN_REASONS.count }), names)).toBe("Black had more discs at the end.");
    expect(reasonOf(facts({ outcome: "draw", winner: null, reason: "noMoves" }), names)).toBe("Neither side had a move left.");
    expect(reasonOf(facts({ outcome: "draw", winner: null, reason: "draw" }), names)).toBe("Neither side won.");
  });

  it("has a sentence for every reason, which reads with you in it and with a name", () => {
    const draws: readonly string[] = RESULT_DRAW_REASONS;
    for (const reason of Object.keys(RESULT_REASONS) as ResultReason[]) {
      for (const outcome of ["won", "lost", "decided"] as const) {
        const said = reasonOf(facts({ outcome, reason, winner: draws.includes(reason) ? null : STONES.black }), names);
        expect(said, `${reason} ${outcome}`).toMatch(/^[A-Z].*\.$/);
        expect(said, `${reason} ${outcome}`).not.toContain("undefined");
      }
    }
  });
});

describe("every ending in Japanese", () => {
  const ja = speaker("ja");
  const draws: readonly string[] = RESULT_DRAW_REASONS;

  it("reads in one language: the headline is the kanji and no sentence keeps an English word", () => {
    expect(headlineOf(facts({ outcome: "won" }), ja).kanji).toBe("勝ち");
    expect(headlineOf(facts({ outcome: "decided", winner: STONES.white }), ja).label).toBe("白の勝ち");
    for (const reason of Object.keys(RESULT_REASONS) as ResultReason[]) {
      for (const outcome of ["won", "lost", "decided"] as const) {
        const said = reasonOf(facts({ outcome, reason, winner: draws.includes(reason) ? null : STONES.black }), { black: "黒の人", white: "白の人" }, ja);
        expect(said, `${reason} ${outcome}`).toMatch(/。$/);
        expect(said, `${reason} ${outcome}`).not.toMatch(/[A-Za-z]/);
      }
    }
  });

  it("says the viewer's own part with no subject", () => {
    expect(reasonOf(facts({ outcome: "won" }), names, ja)).toBe("勝ちの並びを完成させました。");
    expect(reasonOf(facts({ outcome: "lost", reason: WIN_REASONS.resign }), names, ja)).toBe("投了しました。");
    expect(reasonOf(facts({ outcome: "decided", reason: WIN_REASONS.time }), names, ja)).toBe("白が時間切れになりました。");
  });

  it("writes the score with the colours' kanji", () => {
    expect(scoreWords({ kind: "discs", black: 10, white: 6 }, ja)).toBe("石の数：黒 10・白 6");
  });
});

describe("the score", () => {
  it("says what it counts, by colour", () => {
    expect(scoreWords({ kind: "discs", black: 10, white: 6 })).toBe("Discs: Black 10 · White 6");
    expect(scoreWords({ kind: "captures", black: 5, white: 2 })).toBe("Pairs captured: Black 5 · White 2");
    expect(scoreWords(null)).toBeNull();
  });
});
