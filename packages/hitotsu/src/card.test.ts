import { describe, expect, it } from "vitest";

import { HITOTSU_DECK } from "./deck.ts";
import { HITOTSU_COLOUR_LOOK, hitotsuCardShapes, hitotsuCardSvg } from "./card.ts";

describe("hitotsu: the card design", () => {
  it("draws every card in the deck, and the back", () => {
    for (const card of [...HITOTSU_DECK, null]) {
      const svg = hitotsuCardSvg(card);
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg.endsWith("</svg>")).toBe(true);
    }
  });

  it("puts a colour's element in the corners, so no card is told by colour alone", () => {
    const texts = (card: string) => hitotsuCardShapes(card).flatMap((shape) => (shape.kind === "text" ? [shape.text] : []));
    expect(texts("R50")).toEqual(["5", "5", "5", "火", "火"]);
    expect(texts("BS0")).toContain("水");
    expect(texts("WW0")).toEqual(["★", "★", "五", "五"]);
    expect(texts("WF1")).toContain("+4");
  });

  it("marks a wild on the pile with the colour it called", () => {
    const circles = hitotsuCardShapes("WW0", "G").filter((shape) => shape.kind === "circle");
    expect(circles).toEqual([expect.objectContaining({ fill: HITOTSU_COLOUR_LOOK.G.fill })]);
  });

  it("writes its text as text", () => {
    expect(hitotsuCardSvg("R50", { title: `a "red" <five>` })).toContain('aria-label="a &quot;red&quot; &lt;five&gt;"');
  });
});
