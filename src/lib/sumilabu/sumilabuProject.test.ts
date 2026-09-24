import { describe, expect, it } from "vitest";

import { SUMILABU_PROJECTS, SumilabuTargetError, liveProject, sumilabuTarget, targetLine } from "./sumilabuProject";

const TOKENS = {
  SUMILABU_BOARD_DEV_TOKEN: "dev-board-secret",
  SUMILABU_SETTINGS_DEV_TOKEN: "dev-settings-secret",
  SUMILABU_BOARD_TOKEN: "live-board-secret",
  SUMILABU_SETTINGS_TOKEN: "live-settings-secret",
  SUMILABU_REPORTS_DEV_TOKEN: "dev-reports-secret",
  SUMILABU_REPORTS_TOKEN: "live-reports-secret",
  SUMILABU_BOARD_UMAKUMA_TOKEN: "umakuma-board-secret",
  SUMILABU_BOARD_UMAKUMA_DEV_TOKEN: "umakuma-dev-board-secret",
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

  it("gives reports a token of their own, so a board or settings key never reads them", () => {
    expect(sumilabuTarget("reports", env())).toMatchObject({ token: "dev-reports-secret", tokenEnv: "SUMILABU_REPORTS_DEV_TOKEN" });
    expect(sumilabuTarget("reports", env({ NODE_ENV: "production", SUMILABU_PROJECT_KEY: "itsutsu" })).token).toBe("live-reports-secret");
    expect(() => sumilabuTarget("reports", env({ SUMILABU_REPORTS_DEV_TOKEN: undefined }))).toThrow(/SUMILABU_REPORTS_DEV_TOKEN/);
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

  it("refuses a project this checkout does not know rather than guessing which was meant", () => {
    expect(() => sumilabuTarget("board", env({ SUMILABU_PROJECT_KEY: "ridemuseum" }))).toThrow(SumilabuTargetError);
    expect(() => sumilabuTarget("board", env({ SUMILABU_PROJECT_KEY: "itsutsu-prod" }))).toThrow(/the projects here are/);
  });

  /*
   * UmaKuma's board is reached from here too, and the guard is about LIVE
   * rather than about the name `itsutsu`. This is the case that was open while
   * UmaKuma was being added: `umakuma` is a real board with real rows on it,
   * and comparing against one project name would have let a plain `pnpm task`
   * write to it with nothing said.
   */
  it("guards UmaKuma's live board exactly as it guards Itsutsu's", () => {
    expect(liveProject("umakuma")).toBe(true);
    expect(liveProject("umakuma-dev")).toBe(false);
    for (const NODE_ENV of ["development", "test", undefined]) {
      expect(() => sumilabuTarget("board", env({ NODE_ENV, SUMILABU_PROJECT_KEY: "umakuma" }))).toThrow(/live site's project/);
    }
    expect(sumilabuTarget("board", env({ SUMILABU_PROJECT_KEY: "umakuma", SUMILABU_LIVE_OPT_IN: "task:umakuma:prod" }))).toMatchObject({
      projectKey: SUMILABU_PROJECTS.umakuma,
      token: "umakuma-board-secret",
      tokenEnv: "SUMILABU_BOARD_UMAKUMA_TOKEN",
    });
    expect(sumilabuTarget("board", env({ SUMILABU_PROJECT_KEY: "umakuma-dev" })).token).toBe("umakuma-dev-board-secret");
  });

  /*
   * The refusal a worktree actually meets. Nothing here holds UmaKuma's
   * tokens, so asking for its board by name gets the variable's name back and
   * no board — which is the property that makes adding it cost nothing.
   */
  it("names the token a checkout would need before it can reach another site's board", () => {
    const bare = env({ SUMILABU_PROJECT_KEY: "umakuma-dev", SUMILABU_BOARD_UMAKUMA_DEV_TOKEN: undefined });
    expect(() => sumilabuTarget("board", bare)).toThrow(/SUMILABU_BOARD_UMAKUMA_DEV_TOKEN/);
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
