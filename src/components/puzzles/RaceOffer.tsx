"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

/**
 * The other way to fill a race's empty seat: offer it to a buddy by name, who
 * is told in their inbox and finds it on My games (`offerRace`). Beside the
 * seat link, never instead of it — a person who is not a buddy is still sent
 * the link. With no buddies it says where they come from.
 */
export function RaceOffer({ id, buddies, offeredTo }: { id: string; buddies: readonly { id: string; name: string }[]; offeredTo: string | null }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [chosen, setChosen] = useState(offeredTo ?? buddies[0]?.id ?? "");
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  if (buddies.length === 0) {
    return (
      <p className="text-xs text-muted" data-testid="race-offer-none">
        Or offer it to a buddy by name, once you have one: add them from their page.
      </p>
    );
  }

  const offer = async () => {
    setSending(true);
    setProblem(null);
    try {
      const answered = await fetch(`/api/puzzles/races/${id}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: chosen }),
      });
      if (!answered.ok) {
        const body = (await answered.json().catch(() => null)) as { error?: string } | null;
        setProblem(body?.error ?? "The site could not offer the race.");
      } else {
        router.refresh();
      }
    } catch {
      setProblem("The site could not be reached.");
    }
    setSending(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm" data-testid="race-offer" {...readyMark(hydrated)}>
      <label className="flex items-center gap-2">
        <span className="text-muted">Or offer it to a buddy</span>
        <select value={chosen} onChange={(event) => setChosen(event.target.value)} className="rounded-md border border-rule bg-paper px-2 py-1" data-testid="race-offer-choose">
          {buddies.map((buddy) => (
            <option key={buddy.id} value={buddy.id}>
              {buddy.name}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={offer} disabled={sending || chosen === ""} data-testid="race-offer-send">
        {sending ? "Offering…" : offeredTo === null ? "Offer the seat" : "Offer it instead"}
      </button>
      {problem !== null ? <span className="text-shu">{problem}</span> : null}
    </div>
  );
}
