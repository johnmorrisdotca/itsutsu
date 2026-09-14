import { describe, expect, it } from "vitest";

import { aliasesFor } from "@/lib/legacy/gameAliases";

import { pictureOf } from "./gamePicture";

describe("which game's picture belongs beside a name", () => {
  it("is the game itself, named by its key", () => {
    expect(pictureOf({ variant: "freestyle" })).toBe("freestyle");
  });

  it("is the game itself, named by its slug", () => {
    expect(pictureOf({ variant: "gomoku" })).toBe("freestyle");
  });

  it("is our game, for a name another site gave it that the alias table knows", () => {
    // Read off the alias table rather than written down, so a reworded alias cannot fail this for no reason.
    const [name] = aliasesFor("freestyle");
    expect(name, "Gomoku still has a name another site gave it").toBeDefined();
    expect(pictureOf({ name })).toBe("freestyle");
  });

  it("is nothing — not the nearest board — for a name with no game here", () => {
    expect(pictureOf({ name: "Backgammon" })).toBeNull();
    expect(pictureOf({ name: "" })).toBeNull();
  });

  it("is nothing for a variant key this site does not know", () => {
    expect(pictureOf({ variant: "chess" })).toBeNull();
  });

  it("is nothing when neither a game nor a name was given", () => {
    expect(pictureOf({})).toBeNull();
  });
});
