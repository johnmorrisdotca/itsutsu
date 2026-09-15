import { describe, expect, it } from "vitest";

import { SUMILABU_PROJECTS, SumilabuTargetError, sumilabuTarget, targetLine } from "./sumilabuProject";

const TOKENS = {
  SUMILABU_BOARD_DEV_TOKEN: "dev-board-secret",
  SUMILABU_SETTINGS_DEV_TOKEN: "dev-settings-secret",
  SUMILABU_BOARD_TOKEN: "live-board-secret",
  SUMILABU_SETTINGS_TOKEN: "live-settings-secret",
};

function env(over: Record<string, string | undefined> = {}) {
  return { NODE_ENV: "development", SUMILABU_BOARD_URL: "https://api.example.test/", ...TOKENS, ...over };
}

/*
 * The property every Sumilabu caller here leans on: forgetting something can
 * only land on itsutsu-dev. Each case below is a way of forgetting.
 */
describe("which Sumilabu project", () => {
  it("lands on the dev project, with the dev tokens, when nothing names one", () => {
    expect(sumilabuTarget("board", env())).toEqual({
      projectKey: SUMILABU_PROJECTS.dev,
      scope: "board",
      url: "https://api.example.test",
      host: "api.example.test",
      token: "dev-board-secret",
      tokenEnv: "SUMILABU_BOARD_DEV_TOKEN",
    });
    expect(sumilabuTarget("settings", env({ SUMILABU_PROJECT_KEY: " " })).token).toBe("dev-settings-secret");
  });

  it("refuses the live project anywhere but the site, unless a :prod script opts in by name", () => {
    for (const NODE_ENV of ["development", "test", undefined, "Production"]) {
      expect(() => sumilabuTarget("board", env({ NODE_ENV, SUMILABU_PROJECT_KEY: "itsutsu" }))).toThrow(SumilabuTargetError);
    }
    expect(sumilabuTarget("settings", env({ NODE_ENV: "production", SUMILABU_PROJECT_KEY: "itsutsu" }))).toMatchObject({
      projectKey: SUMILABU_PROJECTS.live,
      token: "live-settings-secret",
    });
    expect(sumilabuTarget("board", env({ SUMILABU_PROJECT_KEY: "itsutsu", SUMILABU_LIVE_OPT_IN: "board:export:prod" })).token).toBe("live-board-secret");
  });

  it("refuses a project Itsutsu does not have rather than guessing which was meant", () => {
    expect(() => sumilabuTarget("board", env({ SUMILABU_PROJECT_KEY: "umakuma" }))).toThrow(/itsutsu-dev and itsutsu/);
  });

  it("names the variable that is missing and never prints a token", () => {
    let message = "";
    try {
      sumilabuTarget("board", env({ SUMILABU_BOARD_DEV_TOKEN: undefined }));
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toMatch(/SUMILABU_BOARD_DEV_TOKEN/);
    expect(message).not.toMatch(/secret/);
    expect(targetLine(sumilabuTarget("board", env()))).toBe("itsutsu-dev on api.example.test");
  });

  it("never lends the live token to the dev project", () => {
    expect(() => sumilabuTarget("board", env({ SUMILABU_BOARD_DEV_TOKEN: "" }))).toThrow(/SUMILABU_BOARD_DEV_TOKEN/);
  });
});
