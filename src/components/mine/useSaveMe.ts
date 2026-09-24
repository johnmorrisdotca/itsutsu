"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Saving part of one's own account with `PATCH /api/me`, which takes any
 * subset of its fields: the Profile form sends who you are, the Settings form
 * how the site behaves for you, and each says Saved or why not in the same
 * words. One hook so the two forms cannot come to save differently.
 */
export function useSaveMe() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(body: Record<string, unknown>): Promise<boolean> {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "That could not be saved.");
      return false;
    }
    setSaved(true);
    router.refresh();
    return true;
  }

  return { busy, saved, error, save, changed: () => setSaved(false) };
}
