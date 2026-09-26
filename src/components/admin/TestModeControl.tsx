import { preferencesFor } from "@/lib/preferences/memberPreferences";

import { TestModeToggle } from "./TestModeToggle";

/**
 * ONE SELF-CONTAINED ROW: "Test Mode", what it does, whether it is on, and
 * the switch. Meant to be dropped into the Admin panel's "Modes" group
 * wherever that panel is laid out — it reads and renders itself, and asks
 * nothing of whatever it sits inside.
 *
 * Server-rendered: the current state comes from `preferencesFor()`, the same
 * read every page that respects a member's preferences already makes, so
 * this costs the row nothing extra to open. Only the switch itself
 * (`TestModeToggle`) is a client component, because only it has to call a
 * Server Function when pressed.
 *
 * SAYS WHAT IT DOES IN ONE LINE, because the banner it turns on
 * (`TestModeBanner`, shown on every page while this is on) is the only other
 * place a reader is told — John, on the whole feature: "so that I always know".
 */
export async function TestModeControl() {
  const prefs = await preferencesFor();
  const on = prefs.testMode === true;

  return (
    <div className="flex items-start justify-between gap-4" data-testid="test-mode-control">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-ink">Test Mode</span>
        <span className="text-xs leading-snug text-muted">
          Shows the site&rsquo;s simulated test members in every list, board and count — for you only, on and off
          production alike. Nobody else ever sees them.
        </span>
      </div>
      <TestModeToggle on={on} />
    </div>
  );
}
