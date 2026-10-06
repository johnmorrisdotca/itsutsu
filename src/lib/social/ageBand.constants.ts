import type { PhraseKey } from "../i18n/i18n.constants";

/**
 * The age bands a member may say they are in, and the consent a child needs.
 *
 * UMAKUMA'S VOCABULARY ON PURPOSE (`src/lib/srs/ageBand.ts` there): the same
 * three values, so the two sites' members can be compared and the copy about
 * children can be shared. The database column holds these strings verbatim.
 *
 * Three bands and no birthday. The site never needs to know how old somebody
 * is, only which side of two lines they stand on: 13, below which a parent's
 * or guardian's consent is needed for an account, and 18. A birthday is a
 * fact worth not holding.
 *
 * A member who has never answered has NULL in the column, not a band. Nothing
 * here or anywhere treats null as "adult" or as "child"; a member never asked
 * is asked on their next visit to their own page, and the operator can record
 * the answer for a family by hand.
 */

export const AGE_BANDS = {
  under13: "under_13",
  teen: "13_17",
  adult: "18_plus",
} as const;

export type AgeBand = (typeof AGE_BANDS)[keyof typeof AGE_BANDS];

/** In the order a form offers them, youngest first. */
export const AGE_BAND_LIST = [AGE_BANDS.under13, AGE_BANDS.teen, AGE_BANDS.adult] as const;

/** Each band as a phrase (`mine.age*`) beside its kanji, which a reader of English is shown after it and a reader of Japanese in place of it. */
export const AGE_BAND_DISPLAY: Record<AgeBand, { label: PhraseKey; kanji: string }> = {
  under_13: { label: "mine.ageUnderThirteen", kanji: "13歳未満" },
  "13_17": { label: "mine.ageThirteenToSeventeen", kanji: "13〜17歳" },
  "18_plus": { label: "mine.ageEighteenPlus", kanji: "18歳以上" },
};

export const PARENT_RELATIONSHIPS = {
  parent: "parent",
  guardian: "guardian",
} as const;

export type ParentRelationship = (typeof PARENT_RELATIONSHIPS)[keyof typeof PARENT_RELATIONSHIPS];

export const PARENT_RELATIONSHIP_LIST = [PARENT_RELATIONSHIPS.parent, PARENT_RELATIONSHIPS.guardian] as const;

export const PARENT_RELATIONSHIP_DISPLAY: Record<ParentRelationship, PhraseKey> = {
  parent: "mine.parent",
  guardian: "mine.guardian",
};

/** The longest name a parent or guardian may give, matching the column. */
export const CONSENT_LIMITS = { name: 120 } as const;

/**
 * What the API says when a band cannot be recorded, as phrases (`mine.problem*`): the route says each in the reader's
 * language, because it is shown to the person who tried, and the tests share the names so a message cannot drift from
 * the rule it reports.
 */
export const AGE_BAND_PROBLEMS = {
  needsParent: "mine.problemNeedsParent",
  noName: "mine.problemNoName",
  relationship: "mine.problemRelationship",
  agree: "mine.problemAgree",
  notForBand: "mine.problemNotForBand",
  consentAlone: "mine.problemConsentAlone",
} as const satisfies Record<string, PhraseKey>;
