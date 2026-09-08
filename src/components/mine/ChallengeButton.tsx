"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";

/**
 * Starts a game against a named member and goes to it. The other seat is
 * theirs from the start, so the game is in their list before they have seen
 * it; there is nothing to accept.
 */
export function ChallengeButton({
  email,
  variant = "freestyle",
  label = "Challenge",
  strong = false,
}: {
  email: string;
  variant?: string;
  label?: string;
  strong?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function challenge() {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/games/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge: email, variant }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "That game could not be started.");
      setBusy(false);
      return;
    }
    const to = response.headers.get("Location");
    if (to !== null) router.push(to);
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={challenge}
        disabled={busy}
        className={`${BUTTON_BASE} ${strong ? BUTTON_STRONG : BUTTON_QUIET} px-3 py-1 text-xs`}
        data-testid="challenge"
      >
        {label}
      </button>
      {error !== null ? <span className="text-xs text-shu">{error}</span> : null}
    </span>
  );
}
