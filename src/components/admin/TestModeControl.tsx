import { preferencesFor } from "@/lib/preferences/memberPreferences";

import { TestModeToggle } from "./TestModeToggle";

/**
 * TEST MODE IN THE ADMIN PANEL'S MODES GROUP: the stored answer, read on the
 * server with the same `preferencesFor()` every page that respects a member's
 * preferences makes, handed to the row that draws it (`TestModeToggle`).
 * Rendered by the admin page and passed into `AdminSite`, a client component,
 * as its `modes` slot.
 */
export async function TestModeControl() {
  const prefs = await preferencesFor();
  return <TestModeToggle on={prefs.testMode === true} />;
}
