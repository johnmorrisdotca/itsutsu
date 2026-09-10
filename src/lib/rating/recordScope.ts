/**
 * How much of somebody's playing a page is answering about.
 *
 * A person who played four thousand games on ItsYourTurn and twenty here has
 * had a life of playing, and a page that leads with the twenty is telling the
 * smaller truth first. So the headline answers EVERYWHERE by default, and
 * narrowing to this site is the thing somebody asks for — the reverse of how
 * it was, and John's call.
 *
 * Two scopes and no more, deliberately. Per-site figures already exist and are
 * better served than a filter could serve them: there is a tab for each site,
 * with the handle used there and a link to check the claim. A third scope
 * would be a worse copy of a thing already on the page.
 *
 * Pure and addressable, like the directory's bar: every narrowing is an
 * address somebody can send, and the page needs no script to answer.
 */

export const RECORD_SCOPES = {
  /** Every site somebody played on, this one included. */
  everywhere: "everywhere",
  /** What happened on Itsutsu, and nothing else. */
  here: "here",
} as const;

export type RecordScope = (typeof RECORD_SCOPES)[keyof typeof RECORD_SCOPES];

export const RECORD_SCOPE_LIST: readonly RecordScope[] = [RECORD_SCOPES.everywhere, RECORD_SCOPES.here];

/** What a page shows before anybody asks for anything narrower. */
export const DEFAULT_SCOPE: RecordScope = RECORD_SCOPES.everywhere;

export const SCOPE_PARAM = "scope";

/**
 * The scope an address asks for, falling back to the default rather than to
 * nothing — a mistyped address should show the page.
 */
export function readRecordScope(asked: string | string[] | undefined): RecordScope {
  const one = (Array.isArray(asked) ? asked[0] : asked) ?? "";
  return (RECORD_SCOPE_LIST as readonly string[]).includes(one) ? (one as RecordScope) : DEFAULT_SCOPE;
}

/**
 * The address one scope reads as, keeping whichever tab is open.
 *
 * The two questions are independent — which site's chapter you are reading is
 * not the same as how much the headline is counting — so choosing one must
 * never quietly answer the other. The default is left off the address, so an
 * ordinary player page stays a bare address.
 */
export function scopeHref(base: string, view: string | undefined, scope: RecordScope): string {
  const params = new URLSearchParams();
  if (view !== undefined && view !== "") params.set("view", view);
  return scopeHrefFrom(base, params, scope);
}

/**
 * The same, for a page whose address already carries more than a tab.
 *
 * The directory has a narrowing of its own — who to list, whether a rating has
 * settled, whether they have been seen lately — and choosing a scope must not
 * silently undo any of it. So the existing query comes in whole and only the
 * scope is changed, which is the same promise `scopeHref` makes about the tab.
 */
export function scopeHrefFrom(base: string, params: URLSearchParams, scope: RecordScope): string {
  const next = new URLSearchParams(params);
  next.delete(SCOPE_PARAM);
  if (scope !== DEFAULT_SCOPE) next.set(SCOPE_PARAM, scope);
  const query = next.toString();
  return query === "" ? base : `${base}?${query}`;
}

/**
 * Whether a scope toggle would mean anything here.
 *
 * With nothing kept from anywhere else, "everywhere" and "here" are the same
 * list of games, and a control that cannot change the answer is furniture. It
 * also reads as a promise the page cannot keep — somebody who has only played
 * here would click it expecting another chapter to appear.
 */
export function scopeWorthAsking(sources: number): boolean {
  return sources > 1;
}
