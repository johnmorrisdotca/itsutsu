import type { SITE_SETTING_SPECS } from "./site.constants";

/**
 * One row of the registry: everything a setting may be, and what it is when
 * nothing usable is stored.
 *
 * Two kinds, and they are two kinds rather than one loose shape because they
 * are checked differently. A `choice` is a closed list and a stored value is
 * either in it or is not; a `note` is something the operator typed and can
 * only be measured, never enumerated. One spec type covering both would need
 * an `options` that is sometimes meaningless, which is the shape this
 * repository calls a name compromised rather than split.
 *
 * `fallback` is what a missing row reads as. For a `choice` it is one of the
 * options — the type cannot say so, and `site.test.ts` checks it instead.
 */
export type SiteSettingSpec =
  | {
      readonly kind: "choice";
      readonly options: readonly string[];
      readonly fallback: string;
    }
  | {
      readonly kind: "note";
      /** Longest the operator may type. Anything longer is refused, not cut. */
      readonly maxLength: number;
      readonly fallback: "";
    };

/** The name of a setting the registry knows. */
export type SiteSettingKey = keyof typeof SITE_SETTING_SPECS;

/**
 * Every setting, each holding one of its own values.
 *
 * A `choice` narrows to its own options, so `settings.registration` is the
 * union of the three modes and not `string` — which is what makes a forgotten
 * branch a typecheck failure rather than a runtime surprise.
 */
export type SiteSettings = {
  [K in SiteSettingKey]: (typeof SITE_SETTING_SPECS)[K] extends {
    readonly options: readonly (infer V)[];
  }
    ? V
    : string;
};

/** How a Google identity with no member row is treated. */
export type RegistrationMode = SiteSettings["registration"];

/**
 * A change the operator asks for: a value keeps it, null forgets it.
 *
 * Null rather than the default string, so that "back to however this site
 * behaves out of the box" and "pin it to invite-only" stay two different acts.
 * The row goes away; the reading does not change today, and would follow the
 * registry if the default ever did.
 */
export type SiteSettingPatch = { [K in SiteSettingKey]?: SiteSettings[K] | null };

/** What a setting is worth, and whether anybody said so. */
export type SiteSettingState<K extends SiteSettingKey = SiteSettingKey> = {
  key: K;
  value: SiteSettings[K];
  /** False when no row exists and the value above is the registry's default. */
  chosen: boolean;
  updatedAt: string | null;
  updatedBy: string;
};
