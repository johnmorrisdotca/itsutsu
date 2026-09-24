"use client";

import { useState } from "react";

import { Select } from "@/components/ui/Controls";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, INPUT_CLASS } from "@/components/ui/ui.constants";
import { isAgeBand, needsConsent } from "@/lib/social/ageBand";
import {
  AGE_BAND_DISPLAY,
  AGE_BAND_LIST,
  CONSENT_LIMITS,
  PARENT_RELATIONSHIPS,
  PARENT_RELATIONSHIP_DISPLAY,
  PARENT_RELATIONSHIP_LIST,
} from "@/lib/social/ageBand.constants";

import { ADMIN_AGE_COPY } from "./admin.constants";
import type { MemberAgeControlProps } from "./admin.types";

/**
 * The operator sets a member's age band from the row: for the members who
 * joined before the question existed, and for a child whose parent consented
 * by hand. Under 13 opens the two fields the consent row needs and nothing
 * else; the server (`PATCH /api/members`) applies the same rule the member's
 * own form meets, and logs the act without the parent's name.
 */
export function MemberAgeControl({ member, busy, onSet }: MemberAgeControlProps) {
  const [pending, setPending] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<string>(PARENT_RELATIONSHIPS.parent);

  async function choose(value: string) {
    if (!isAgeBand(value)) return;
    if (needsConsent(value) && member.consent === null) {
      setPending(value);
      return;
    }
    setPending(null);
    await onSet({ id: member.id, ageBand: value });
  }

  async function record() {
    if (pending === null) return;
    await onSet({ id: member.id, ageBand: pending, consent: { name, relationship, agreed: true } });
    setPending(null);
    setName("");
  }

  return (
    <span className="flex flex-wrap items-center gap-2" data-testid="member-age-control">
      <Select
        value={member.ageBand ?? ""}
        onChange={(event) => void choose(event.target.value)}
        disabled={busy}
        aria-label={ADMIN_AGE_COPY.selectTitle}
        title={ADMIN_AGE_COPY.selectTitle}
        data-testid="member-age-select"
      >
        <option value="" disabled>
          {ADMIN_AGE_COPY.unsaid}
        </option>
        {AGE_BAND_LIST.map((band) => (
          <option key={band} value={band}>
            {AGE_BAND_DISPLAY[band].label}
          </option>
        ))}
      </Select>
      {pending !== null ? (
        <span className="flex w-full flex-col gap-2 rounded-lg border border-rule bg-ivory/60 p-3 text-xs" data-testid="member-age-consent">
          <span>{ADMIN_AGE_COPY.consentLead}</span>
          <label className="flex flex-col gap-1">
            <span>{ADMIN_AGE_COPY.consentName}</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={CONSENT_LIMITS.name}
              className={INPUT_CLASS}
              data-testid="member-age-consent-name"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>{ADMIN_AGE_COPY.consentRelationship}</span>
            <Select value={relationship} onChange={(event) => setRelationship(event.target.value)}>
              {PARENT_RELATIONSHIP_LIST.map((option) => (
                <option key={option} value={option}>
                  {PARENT_RELATIONSHIP_DISPLAY[option]}
                </option>
              ))}
            </Select>
          </label>
          <span className="flex gap-2">
            <button type="button" onClick={() => void record()} disabled={busy} className={`${BUTTON_BASE} ${BUTTON_STRONG} px-3 py-1.5`} data-testid="member-age-record">
              {ADMIN_AGE_COPY.record}
            </button>
            <button type="button" onClick={() => setPending(null)} className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3 py-1.5`}>
              {ADMIN_AGE_COPY.cancel}
            </button>
          </span>
        </span>
      ) : null}
    </span>
  );
}
