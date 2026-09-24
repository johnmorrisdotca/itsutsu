import {
  AGE_BANDS,
  AGE_BAND_DISPLAY,
  AGE_BAND_LIST,
  AGE_BAND_PROBLEMS,
  CONSENT_LIMITS,
  PARENT_RELATIONSHIP_LIST,
  type AgeBand,
  type ParentRelationship,
} from "./ageBand.constants";

/**
 * The rules about an age band, pure, asked by the profile API, the admin API
 * and the forms. Nothing here reads a row; `ageBandStore.ts` does that and
 * calls in.
 */

export function isAgeBand(value: unknown): value is AgeBand {
  return typeof value === "string" && (AGE_BAND_LIST as readonly string[]).includes(value);
}

export function isParentRelationship(value: unknown): value is ParentRelationship {
  return typeof value === "string" && (PARENT_RELATIONSHIP_LIST as readonly string[]).includes(value);
}

/**
 * Whether a band needs a parent's or guardian's consent. ONLY under 13. Null
 * — never asked — answers false here, and that is deliberate: a member who
 * has not said is not a child by default, and is not an adult either; they
 * are asked. The question is put before anything else on a first visit.
 */
export function needsConsent(band: string | null | undefined): boolean {
  return band === AGE_BANDS.under13;
}

/** What a parent or guardian offers on the form, as typed. */
export type ConsentOffer = { name: string; relationship: string; agreed: boolean };

/** What is kept: the name as given, and which of the two they are. */
export type Consent = { name: string; relationship: ParentRelationship };

export type ConsentDecision =
  | { ok: true; consent: Consent | null }
  | { ok: false; needsParent: boolean; problem: string };

/**
 * Whether a band may be recorded with what came with it.
 *
 * - A band that needs no consent, with none offered: yes, nothing to keep.
 * - A band that needs no consent, with one offered: no. A consent row on an
 *   adult is a record of something that never happened.
 * - Under 13 with nothing offered: no, and `needsParent` says which form to
 *   open. Under 13 with an offer: the name has to be there, the relationship
 *   has to be one of the two, and they have to have agreed.
 *
 * `alreadyHeld` is for a member whose consent is on file: changing nothing, or
 * saying under 13 again, needs no second parent.
 */
export function consentDecision(band: AgeBand, offer: ConsentOffer | null, alreadyHeld = false): ConsentDecision {
  if (!needsConsent(band)) {
    if (offer !== null) return { ok: false, needsParent: false, problem: AGE_BAND_PROBLEMS.notForBand };
    return { ok: true, consent: null };
  }
  if (alreadyHeld) return { ok: true, consent: null };
  if (offer === null) return { ok: false, needsParent: true, problem: AGE_BAND_PROBLEMS.needsParent };
  const name = offer.name.replace(/\s+/g, " ").trim().slice(0, CONSENT_LIMITS.name);
  if (name === "") return { ok: false, needsParent: true, problem: AGE_BAND_PROBLEMS.noName };
  if (!isParentRelationship(offer.relationship)) {
    return { ok: false, needsParent: true, problem: AGE_BAND_PROBLEMS.relationship };
  }
  if (!offer.agreed) return { ok: false, needsParent: true, problem: AGE_BAND_PROBLEMS.agree };
  return { ok: true, consent: { name, relationship: offer.relationship } };
}

/** The band as a reader sees it, or null for a member never asked. */
export function ageBandLabel(band: string | null | undefined): { label: string; kanji: string } | null {
  return isAgeBand(band) ? AGE_BAND_DISPLAY[band] : null;
}
