import { describe, expect, it } from "vitest";

import { copyLines, copyPlan } from "./siteSettingsCopy";
import type { RemoteSetting } from "./siteSettingsRemote.types";

const remote = (key: string, value: string): RemoteSetting => ({ key, value, setBy: "someone", updatedAt: "2026-09-14T10:00:00.000Z" });

describe("the cut-over copy, as a report", () => {
  it("puts what the panel's own save would put, under Sumilabu's names", () => {
    const plan = copyPlan(
      [
        { key: "registration", value: "open", updatedBy: "operator@example.test" },
        { key: "joinNotice", value: "  Beta — ask John  ", updatedBy: "" },
      ],
      [],
    );
    expect(plan.steps).toEqual([
      { key: "registration", remoteKey: "registration", action: "put", value: "open", was: null, by: "operator@example.test" },
      { key: "joinNotice", remoteKey: "join_notice", action: "put", value: "Beta — ask John", was: null, by: "nobody recorded" },
    ]);
  });

  it("leaves a matching value alone, forgets what this database no longer holds, and refuses what the registry would", () => {
    const plan = copyPlan(
      [
        { key: "registration", value: "approval" },
        { key: "maintenance", value: "on" },
      ],
      [remote("registration", "closed"), remote("join_notice", "Old words")],
    );
    expect(plan.steps.map((step) => step.action)).toEqual(["refused", "delete"]);
    expect(plan.ignored).toEqual(["maintenance"]);
    expect(copyPlan([{ key: "registration", value: "closed" }], [remote("registration", "closed")]).steps[0]).toMatchObject({ action: "same" });
    expect(copyPlan([{ key: "joinNotice", value: "   " }], []).steps[1]).toMatchObject({ action: "none" });
  });

  it("says every step in a line a person can check before the copy is made", () => {
    const lines = copyLines(copyPlan([{ key: "joinNotice", value: "Hi", updatedBy: "op" }, { key: "maintenance", value: "on" }], [remote("registration", "open")]));
    expect(lines).toEqual([
      'DELETE settings/registration (the target holds "open"; this database holds nothing)',
      'PUT settings/join_notice "Hi" (the target holds nothing; last set here by op)',
      "not copied, not a setting this site declares: maintenance",
    ]);
  });
});
