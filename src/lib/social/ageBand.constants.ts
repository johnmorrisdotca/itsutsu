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

export const AGE_BAND_DISPLAY: Record<AgeBand, { label: string; kanji: string }> = {
  under_13: { label: "Under 13", kanji: "13歳未満" },
  "13_17": { label: "13 to 17", kanji: "13〜17歳" },
  "18_plus": { label: "18 or over", kanji: "18歳以上" },
};

export const PARENT_RELATIONSHIPS = {
  parent: "parent",
  guardian: "guardian",
} as const;

export type ParentRelationship = (typeof PARENT_RELATIONSHIPS)[keyof typeof PARENT_RELATIONSHIPS];

export const PARENT_RELATIONSHIP_LIST = [PARENT_RELATIONSHIPS.parent, PARENT_RELATIONSHIPS.guardian] as const;

export const PARENT_RELATIONSHIP_DISPLAY: Record<ParentRelationship, string> = {
  parent: "Parent",
  guardian: "Guardian",
};

/** The longest name a parent or guardian may give, matching the column. */
export const CONSENT_LIMITS = { name: 120 } as const;

/**
 * What the API says when a band cannot be recorded. Sentences, because they
 * are shown to the person who tried, and shared with the tests so a message
 * cannot drift from the rule it reports.
 */
export const AGE_BAND_PROBLEMS = {
  needsParent: "Somebody under 13 needs a parent or guardian to consent before the account can go on.",
  noName: "A parent or guardian needs to give their name.",
  relationship: "Say whether you are the parent or a guardian.",
  agree: "A parent or guardian needs to agree.",
  notForBand: "Consent is recorded only for a member under 13.",
  consentAlone: "Consent goes with an age band, and none was given.",
} as const;
