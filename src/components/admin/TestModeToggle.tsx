"use client";

import { useState, useTransition } from "react";

import { TONE_CLASS } from "@/components/ui/ui.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { setTestMode } from "@/lib/testMode/testMode.actions";

/**
 * THE ON/OFF CONTROL ITSELF, split from `TestModeControl.tsx` because that
 * one is a server component (it reads the stored preference with no request
 * from the browser) and this one has to be a client component to call the
 * Server Function on a click. `on` is the value the server rendered with;
 * this only ever moves from there, and a failed write puts it back.
 */
export function TestModeToggle({ on }: { on: boolean }) {
  const [checked, setChecked] = useState(on);
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const hydrated = useHydrated();

  function flip() {
    const next = !checked;
    setChecked(next);
    setProblem(null);
    startTransition(async () => {
      const result = await setTestMode(next);
      if (!result.ok) {
        setChecked(!next);
        setProblem(result.problem);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1" {...readyMark(hydrated)}>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        {checked ? "On" : "Off"}
        <input
          type="checkbox"
          checked={checked}
          disabled={pending}
          onChange={flip}
          aria-label="Test Mode"
          data-testid="test-mode-switch"
          className="size-4 accent-ink disabled:cursor-not-allowed"
        />
      </label>
      {problem !== null ? (
        <p className={`rounded-lg border px-2 py-1 text-xs ${TONE_CLASS.alarm}`} role="alert" data-testid="test-mode-problem">
          {problem}
        </p>
      ) : null}
    </div>
  );
}
