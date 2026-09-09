import { describe, expect, it } from "vitest";

import { conversationFor, hasConversation, spokenCount } from "./conversation";
import type { GameReaction } from "./gameHistory.types";

/**
 * The conversation, grouped against the moves.
 *
 * What is worth testing here is the ordering and the hiding, because both are
 * decisions rather than plumbing: a message sent late still belongs to the
 * move it was about, and an ignored player is ignored after their game ends
 * as much as during it.
 */
let next = 0;
function said(
  stone: string,
  moveNumber: number | null,
  { text = null, at }: { text?: string | null; at?: string } = {},
): GameReaction {
  next += 1;
  return {
    id: `r${next}`,
    stone,
    emoji: "👏",
    text,
    moveNumber,
    createdAt: at ?? `2026-09-09T00:00:${String(next).padStart(2, "0")}.000Z`,
  };
}

describe("the conversation against the moves", () => {
  it("groups what was said by the move it was said at", () => {
    const entries = conversationFor([said("black", 3), said("white", 3), said("black", 7)]);
    expect(entries).toHaveLength(2);
    expect(entries[0].moveNumber).toBe(3);
    expect(entries[0].said).toHaveLength(2);
    expect(entries[1].moveNumber).toBe(7);
  });

  it("puts anything said before the first stone at the top, not at move zero", () => {
    // Move zero is a real position somebody can step to; "hello" is not at it.
    const entries = conversationFor([said("black", 5), said("white", null), said("black", 0)]);
    expect(entries[0].moveNumber).toBeNull();
    expect(entries[0].said).toHaveLength(2);
    expect(entries[1].moveNumber).toBe(5);
  });

  it("reads by move rather than by the clock, so a slow message lands where it belongs", () => {
    /*
     * Sent at move four but typed slowly, so its timestamp falls after the
     * message at move five. The reader is stepping through moves, so the move
     * is the more useful answer.
     */
    const late = said("white", 4, { at: "2026-09-09T00:10:00.000Z" });
    const quick = said("black", 5, { at: "2026-09-09T00:05:00.000Z" });
    const entries = conversationFor([quick, late]);
    expect(entries.map((entry) => entry.moveNumber)).toEqual([4, 5]);
  });

  it("keeps a back-and-forth at one move in the order it was spoken", () => {
    const first = said("black", 2, { at: "2026-09-09T00:01:00.000Z" });
    const second = said("white", 2, { at: "2026-09-09T00:02:00.000Z" });
    const entries = conversationFor([second, first]);
    expect(entries[0].said.map((one) => one.id)).toEqual([first.id, second.id]);
  });
});

describe("somebody who has been ignored", () => {
  const both = [said("black", 1, { text: "hello" }), said("white", 1, { text: "hi" })];

  it("is still ignored once the game is over", () => {
    const entries = conversationFor(both, { hidden: new Set(["white"]) });
    expect(entries).toHaveLength(1);
    expect(entries[0].said.every((one) => one.stone === "black")).toBe(true);
  });

  it("leaves no empty heading behind when they said everything at that move", () => {
    const onlyThem = [said("white", 9), said("white", 9)];
    expect(conversationFor(onlyThem, { hidden: new Set(["white"]) })).toEqual([]);
    expect(hasConversation(onlyThem, new Set(["white"]))).toBe(false);
  });

  it("does not hide the other player with them", () => {
    expect(hasConversation(both, new Set(["white"]))).toBe(true);
  });
});

describe("what to call it", () => {
  it("counts only the messages that carry words", () => {
    expect(spokenCount([said("black", 1), said("white", 2, { text: "well played" })])).toBe(1);
    // Whitespace is not a word.
    expect(spokenCount([said("black", 1, { text: "   " })])).toBe(0);
  });
});
