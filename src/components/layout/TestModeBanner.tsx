import { showsTestMembers } from "@/lib/testMode/testMode";

/**
 * SHOWN ON EVERY PAGE WHILE TEST MODE IS ON, so the operator can never forget
 * they are looking at a site with 1000 simulated members mixed into every
 * list — John: "so that I always know". In the root layout
 * (`src/app/layout.tsx`) rather than on any one page, which is the only way
 * "every page" is actually true rather than a promise that drifts the day a
 * new page is added and nobody remembers this banner.
 *
 * `showsTestMembers()` already answers `false` for anyone who is not the
 * signed-in admin without touching the database (`isAdminRequest` verifies
 * the session cookie first), so this costs an ordinary visitor nothing.
 */
export async function TestModeBanner() {
  if (!(await showsTestMembers())) return null;

  return (
    <div
      role="status"
      data-testid="test-mode-banner"
      className="w-full bg-ochre px-4 py-1.5 text-center text-xs font-medium text-paper"
    >
      Test Mode is on — simulated test members are mixed into every list, board and count you see.
    </div>
  );
}
