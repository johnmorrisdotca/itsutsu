"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";

/**
 * Adds or removes one member from the viewer's buddy list, in place.
 *
 * By member id. It was by address, which wrote the address into the markup of
 * every row this sits on, and could not name a member who came in with an
 * invite code at all.
 */
export function BuddyButton({ memberId, isBuddy }: { memberId: string; isBuddy: boolean }) {
  const router = useRouter();
  const [buddy, setBuddy] = useState(isBuddy);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const response = await fetch("/api/buddies", {
      method: buddy ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    setBusy(false);
    if (response.ok) {
      setBuddy(!buddy);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2 py-1 text-xs`}
      title={buddy ? "Remove from your buddies" : "Add to your buddies"}
      data-testid="buddy-toggle"
    >
      {buddy ? "★ Buddy" : "☆ Buddy"}
    </button>
  );
}
