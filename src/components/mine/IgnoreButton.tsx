"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";

/** Ignores a member, or stops. They cannot challenge you, and their messages in a game are hidden from you. */
export function IgnoreButton({ email, ignoring }: { email: string; ignoring: boolean }) {
  const router = useRouter();
  const [state, setState] = useState(ignoring);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const response = await fetch("/api/ignores", {
      method: state ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    if (response.ok) {
      setState(!state);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2 py-1 text-xs ${state ? "text-shu" : "text-muted"}`}
      title={state ? "Stop ignoring" : "Ignore: they cannot challenge you, and their messages are hidden"}
      data-testid="ignore-toggle"
    >
      {state ? "Ignored" : "Ignore"}
    </button>
  );
}
