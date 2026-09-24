import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { playerPath } from "../src/lib/rating/playerKey";
import { memberContext, memberIdFor, removeMember } from "./members";
import { suiteOperator } from "./operator";
import { ready } from "./support";

/**
 * WHAT CHANGES FOR A MEMBER UNDER 13 (PRIV-03), read the way people meet it.
 *
 * The spec brings its own child. As the child: a city and a line about
 * themselves, saved first, are gone once the age band is answered under 13
 * with a parent's consent, and a new city is refused; Profile and Settings say
 * why the fields are missing. As a stranger (the suite's operator): the
 * child's page offers no game and no message box and says why, and the
 * message route refuses. When the child adds the stranger as a buddy, both
 * open. Nothing here is about a row the spec did not make; the child goes in
 * `finally`, with the buddy row by cascade.
 */

process.loadEnvFile(".env");
const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("a child keeps nothing that says where they are, and only their own buddies can reach them", async ({ browser, baseURL, page }) => {
  const stamp = Date.now().toString(36);
  const child = { email: `child-${stamp}@example.test`, name: `Kid ${stamp}` };
  const context = await memberContext(browser, baseURL!, child);
  try {
    const childId = await memberIdFor(child.email);

    // Said before the band, then the band: under 13, with a parent's consent.
    expect((await context.request.patch("/api/me", { data: { city: "Vancouver", bio: "I like Go" } })).ok()).toBe(true);
    const band = await context.request.patch("/api/me", {
      data: { ageBand: "under_13", consent: { name: "Pat Example", relationship: "parent", agreed: true } },
    });
    expect(band.ok(), await band.text()).toBe(true);
    const row = await prisma.member.findUnique({ where: { id: childId }, select: { city: true, country: true, bio: true } });
    expect(row).toEqual({ city: "", country: "", bio: "" });

    // And none can be added.
    const refused = await context.request.patch("/api/me", { data: { city: "Vancouver" } });
    expect(refused.status()).toBe(422);

    // The child's own page says why the fields are not there.
    const own = await context.newPage();
    await own.goto("/me?view=profile");
    await ready(own, "profile-form");
    await expect(own.getByTestId("child-profile-note")).toBeVisible();
    await expect(own.getByTestId("profile-city")).toHaveCount(0);
    await own.goto("/me?view=settings");
    await ready(own, "settings-form");
    await expect(own.getByTestId("child-settings-note")).toBeVisible();
    await expect(own.getByRole("checkbox", { name: "Show when I am here" })).toHaveCount(0);

    // A stranger: no game, no message box, and the line saying why; the route refuses the same.
    await page.goto(playerPath(child.name, childId));
    const actions = page.getByTestId("player-actions");
    await expect(actions.getByTestId("child-closed")).toBeVisible();
    await expect(actions.getByTestId("challenge")).toHaveCount(0);
    await expect(actions.getByTestId("message-link")).toHaveCount(0);
    const written = await page.request.post("/api/messages", { data: { to: childId, text: "hello" } });
    expect(written.status()).toBe(403);
    expect(((await written.json()) as { reason?: string }).reason).toBe("child-buddies-only");

    // The child adds the stranger as a buddy, and both open.
    const operatorId = await memberIdFor(suiteOperator().email);
    await prisma.buddy.create({ data: { ownerId: childId, buddyId: operatorId } });
    await page.goto(playerPath(child.name, childId));
    await expect(actions.getByTestId("challenge")).toBeVisible();
    await expect(actions.getByTestId("child-closed")).toHaveCount(0);
    const now = await page.request.post("/api/messages", { data: { to: childId, text: "hello" } });
    expect(now.ok(), await now.text()).toBe(true);
  } finally {
    await context.close();
    await removeMember(child.email);
  }
});
