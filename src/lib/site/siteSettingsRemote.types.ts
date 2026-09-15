import type { SiteSettingKey } from "./site.types";

/** One setting as Sumilabu's settings routes hand it back. */
export type RemoteSetting = {
  /** Sumilabu's name for it (`join_notice`), not the registry's (`joinNotice`). */
  key: string;
  value: string;
  setBy: string | null;
  updatedAt: string;
};

type Step<Action extends string, More> = { key: SiteSettingKey; remoteKey: string; action: Action } & More;

/** What the cut-over copy would do for one setting. */
export type CopyStep =
  | Step<"put", { value: string; was: string | null; by: string }>
  | Step<"delete", { was: string }>
  | Step<"same", { value: string }>
  | Step<"none", Record<never, never>>
  | Step<"refused", { problem: string }>;

export type CopyPlan = {
  steps: CopyStep[];
  /** Local rows under a key the registry does not declare: never copied. */
  ignored: string[];
};
