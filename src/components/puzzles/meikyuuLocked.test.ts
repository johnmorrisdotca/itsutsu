import { describe, expect, it } from "vitest";

import { shutUndo, takesLineBack } from "./meikyuuLocked";

const key = (key: string, more: Partial<Pick<KeyboardEvent, "ctrlKey" | "metaKey" | "shiftKey">> = {}) => ({ key, ctrlKey: false, metaKey: false, shiftKey: false, ...more });

describe("what a finished maze refuses", () => {
  it("takes the keys that would take the line back", () => {
    expect(takesLineBack(key("Backspace"))).toBe(true);
    expect(takesLineBack(key("Delete"))).toBe(true);
    expect(takesLineBack(key("z", { ctrlKey: true }))).toBe(true);
    expect(takesLineBack(key("Z", { metaKey: true }))).toBe(true);
  });

  it("leaves every other key alone, Esc above all (it leaves Just the board)", () => {
    expect(takesLineBack(key("Escape"))).toBe(false);
    expect(takesLineBack(key("z"))).toBe(false);
    expect(takesLineBack(key("z", { ctrlKey: true, shiftKey: true }))).toBe(false);
    expect(takesLineBack(key("ArrowUp"))).toBe(false);
    expect(takesLineBack(key("Tab"))).toBe(false);
  });

  it("is a no-op with no column", () => {
    expect(shutUndo(null)).toBeUndefined();
  });
});
