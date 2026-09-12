import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * RecordTable already wraps whatever a caller hands its `empty` prop in
 * `<td data-testid="${testId}-empty">` (see RecordTable.tsx). A caller that
 * ALSO stamps a `-empty` testid inside that content is pre-unification
 * debris — markup an `empty` prop carried before RecordTable existed, left
 * behind when the page adopted the shared table.
 *
 * `Directory.tsx`'s RecordTable `testId` is "directory", so its inner span
 * and RecordTable's own `<td>` land on the identical string
 * "directory-empty" — two elements a `getByTestId` would have to choose
 * between. That collision is another branch's fix. `Ladder.tsx` and
 * `ComputerPlayers.tsx` carry the same leftover shape; their outer id
 * happens to end in "-table-empty" rather than "-empty" today, which is
 * exactly what keeps the two strings apart and the fault latent rather than
 * visible — an unrelated rename of that suffix, the same kind of change
 * Directory.tsx's own history shows this codebase making, would collide
 * with no warning. A spec asserting on either inner id would find one
 * element today; a spec asserting on the OUTER id, once that suffix ever
 * moves, would find two.
 *
 * Crude on purpose, in the shape this codebase already checks .tsx files
 * with (see ComputerPlayers.coverage.test.ts, playerRecord.coverage.test.ts):
 * read the source and look for the shape that went wrong, rather than
 * rendering the table against a database.
 */

const FILES = ["src/components/players/Ladder.tsx", "src/components/players/ComputerPlayers.tsx"];

describe("a RecordTable caller does not restate RecordTable's own -empty testid", () => {
  it("has files to check, so a passing run means something", () => {
    expect(FILES.length).toBeGreaterThan(0);
  });

  for (const path of FILES) {
    it(`${path} does not carry its own -empty testid inside the content it hands RecordTable's \`empty\` prop`, () => {
      const source = readFileSync(path, "utf8");
      const at = source.indexOf("empty={");
      expect(at, `${path} should pass RecordTable an \`empty\` prop`).toBeGreaterThan(-1);
      // To the end of the file rather than a matched closing brace: neither
      // file has any other testid after its `empty` prop, and a hand-parsed
      // brace count is more code than the shape it is checking.
      const afterEmptyProp = source.slice(at);
      expect(afterEmptyProp).not.toMatch(/data-testid="[^"]*-empty"/);
    });
  }
});
