/**
 * WHICH FAMILIES A READER KEEPS OPEN ON THE GAMES PAGE, REMEMBERED. John,
 * 2026-09-26: "Games page, families tab: Allow toggled families to have Memory
 * and preserve on reload."
 *
 * One preference a family, `familyOpen.<key>`, each "open" or "shut", rather
 * than one list of the open ones: a toggle is then one key written on its own
 * (`writePreferences` merges a key into the row), so two tabs folding two
 * families can never write over each other's answer, and nothing is read
 * before it is written. A family never toggled has no key, and opens as the
 * page always has: the first one open, the rest shut (`familyOpenAt`).
 *
 * On the account for a member, like every remembered choice; in this
 * browser's storage for a reader with no account to keep it on
 * (`FAMILY_FOLDS_STORAGE`). Pure and browser-safe: the page and the fold both
 * read it.
 */

/** Every family's key, declared so each has a registry row; held to `GAME_FAMILIES` by its test. */
export const FAMILY_FOLD_KEYS = [
  "five-in-a-row",
  "drops",
  "flips",
  "strange-boards",
  "checkers",
  "territory",
  "small-boards",
  "numbers",
  "other",
] as const;

export type FamilyFoldKey = (typeof FAMILY_FOLD_KEYS)[number];

export const FAMILY_FOLD = { open: "open", shut: "shut" } as const;
export type FamilyFold = (typeof FAMILY_FOLD)[keyof typeof FAMILY_FOLD];
export const FAMILY_FOLD_LIST: readonly FamilyFold[] = [FAMILY_FOLD.open, FAMILY_FOLD.shut];

export type FamilyFoldName = `familyOpen.${FamilyFoldKey}`;

/** The preference that keeps one family's fold. */
export function familyFoldName(key: FamilyFoldKey): FamilyFoldName {
  return `familyOpen.${key}`;
}

export function isFamilyFoldKey(key: string): key is FamilyFoldKey {
  return (FAMILY_FOLD_KEYS as readonly string[]).includes(key);
}

/**
 * The registry's rows, one a family. The fallback is never read for the page's
 * answer — an unset family follows `familyOpenAt`'s first-one-open rule, which
 * a single fallback per row cannot say — and is "shut" only because a row must
 * have one.
 */
export const FAMILY_FOLD_SPECS = Object.fromEntries(
  FAMILY_FOLD_KEYS.map((key) => [familyFoldName(key), { options: FAMILY_FOLD_LIST, fallback: FAMILY_FOLD.shut }]),
) as { readonly [K in FamilyFoldName]: { readonly options: readonly FamilyFold[]; readonly fallback: FamilyFold } };

/** What this browser keeps for a reader with no account: `{ [familyKey]: "open" | "shut" }`. */
export const FAMILY_FOLDS_STORAGE = "itsutsu.familyFolds";

/**
 * Whether a family is drawn open: as the reader last left it, or, for a family
 * they have never toggled, the page's own rule — the first family open, so a
 * newcomer meets a shelf of games, and the rest shut.
 */
export function familyOpenAt(kept: FamilyFold | undefined, index: number): boolean {
  return kept === undefined ? index === 0 : kept === FAMILY_FOLD.open;
}

/** A reader's kept folds, by family key: what the page is handed. */
export type KeptFolds = Partial<Record<FamilyFoldKey, FamilyFold>>;

/** The folds an account keeps, out of its cleaned preferences (`familyOpen.<key>` → key). */
export function keptFoldsFrom(preferences: Readonly<Record<string, unknown>>): KeptFolds {
  const kept: KeptFolds = {};
  for (const key of FAMILY_FOLD_KEYS) {
    const value = preferences[familyFoldName(key)];
    if ((FAMILY_FOLD_LIST as readonly unknown[]).includes(value)) kept[key] = value as FamilyFold;
  }
  return kept;
}

/** The folds a store holds, from whatever it holds: only known families and offered answers survive. */
export function foldsFrom(stored: unknown): KeptFolds {
  if (stored === null || typeof stored !== "object" || Array.isArray(stored)) return {};
  const folds: KeptFolds = {};
  for (const [key, value] of Object.entries(stored)) {
    if (isFamilyFoldKey(key) && (FAMILY_FOLD_LIST as readonly unknown[]).includes(value)) folds[key] = value as FamilyFold;
  }
  return folds;
}
