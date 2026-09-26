"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { PanelRow, PanelState, PanelSwitch } from "@/components/admin/ControlPanel";
import { TONE_CLASS } from "@/components/ui/ui.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { setTestMode } from "@/lib/testMode/testMode.actions";

/**
 * TEST MODE'S ROW IN THE ADMIN PANEL: a line saying what it does, the state,
 * and WazaDB's switch, like every other row of the Modes group. A client
 * component because the switch calls a Server Function; `TestModeControl` reads
 * the stored answer on the server and hands it in as `on`. A failed write puts
 * the switch back and says why.
 *
 * A flip refreshes this page only (`router.refresh()`), which redraws the
 * banner in the layout above it: the only reader Test Mode changes anything
 * for is the one pressing it, so nothing else's cache is thrown away.
 */
export function TestModeToggle({ on }: { on: boolean }) {
  const router = useRouter();
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
        return;
      }
      router.refresh();
    });
  }

  return (
    <div {...readyMark(hydrated)} data-testid="test-mode-control">
      <PanelRow
        label="Test mode"
        kanji="試験"
        tone={checked ? "on" : "plain"}
        busy={pending}
        testId="site-test-mode"
        data={{ "data-test-mode": checked ? "on" : "off" }}
        blurb="Shows the simulated test members in every list, board and count — to you only, here and on the live site alike. Nobody else ever sees them."
        note={
          <>
            {problem === null ? null : (
              <span className={`mr-2 rounded-lg border px-2 py-0.5 ${TONE_CLASS.alarm}`} role="alert" data-testid="test-mode-problem">
                {problem}
              </span>
            )}
            <Link href="/admin/player-journeys" className="underline underline-offset-2" data-testid="test-mode-journeys">
              A year of 1000 players, projected →
            </Link>
          </>
        }
        control={
          <>
            <PanelState tone={checked ? "on" : "plain"}>{checked ? "On" : "Off"}</PanelState>
            <PanelSwitch on={checked} label="Test mode" onToggle={flip} disabled={pending} testId="test-mode-switch" />
          </>
        }
      />
    </div>
  );
}
