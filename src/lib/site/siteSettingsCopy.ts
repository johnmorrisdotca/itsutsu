import { SITE_SETTING_KEYS, SITE_SETTING_REMOTE_KEYS } from "./site.constants";
import { acceptSiteSetting, isSiteSettingKey, type StoredSetting } from "./site";
import type { CopyPlan, CopyStep, RemoteSetting } from "./siteSettingsRemote.types";

/**
 * What the one-off cut-over copy of `SiteSetting` onto Sumilabu would write,
 * worked out and never done. Pure; `siteSettingsCopy.play.test.ts` reads the
 * rows and the target and prints this, and nothing in this change performs it.
 *
 * Each stored row goes through `acceptSiteSetting`, the same check the panel's
 * own save makes, so the plan puts exactly what the operator saving that value
 * today would put: a note trimmed, an emptied note forgotten, and nothing for a
 * value the registry would refuse. A setting the target holds and this
 * database does not is a delete, since "no row" is how both ends say unset.
 */
export function copyPlan(local: readonly StoredSetting[], remote: readonly RemoteSetting[]): CopyPlan {
  const held = new Map(remote.map((entry) => [entry.key, entry.value]));
  const rows = new Map(local.filter((row) => isSiteSettingKey(row.key)).map((row) => [row.key, row]));

  const steps = SITE_SETTING_KEYS.map((key): CopyStep => {
    const remoteKey = SITE_SETTING_REMOTE_KEYS[key];
    const was = held.get(remoteKey) ?? null;
    const unset = (): CopyStep => (was === null ? { key, remoteKey, action: "none" } : { key, remoteKey, action: "delete", was });
    const row = rows.get(key);
    if (!row) return unset();
    const accepted = acceptSiteSetting(key, row.value);
    if (!accepted.ok) return { key, remoteKey, action: "refused", problem: accepted.problem };
    if (accepted.value === null) return unset();
    if (accepted.value === was) return { key, remoteKey, action: "same", value: was };
    return { key, remoteKey, action: "put", value: accepted.value, was, by: row.updatedBy || "nobody recorded" };
  });

  return { steps, ignored: local.filter((row) => !isSiteSettingKey(row.key)).map((row) => row.key) };
}

export function copyLines(plan: CopyPlan): string[] {
  const lines = plan.steps.map((step) => {
    switch (step.action) {
      case "put":
        return `PUT settings/${step.remoteKey} ${JSON.stringify(step.value)} (the target holds ${step.was === null ? "nothing" : JSON.stringify(step.was)}; last set here by ${step.by})`;
      case "delete":
        return `DELETE settings/${step.remoteKey} (the target holds ${JSON.stringify(step.was)}; this database holds nothing)`;
      case "same":
        return `already the same: ${step.remoteKey} = ${JSON.stringify(step.value)}`;
      case "none":
        return `nothing to do: ${step.remoteKey} is unset on both`;
      case "refused":
        return `NOT COPIED: ${step.key} holds a value the registry refuses — ${step.problem}`;
    }
  });
  if (plan.ignored.length > 0) lines.push(`not copied, not a setting this site declares: ${plan.ignored.join(", ")}`);
  return lines;
}
