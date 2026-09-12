import { expect, test, type Locator } from "@playwright/test";

import { GAME_COPY } from "../src/components/game/game.constants";
import { SET_UP_COPY } from "../src/components/live/live.constants";

import { memberContext } from "./members";
import { openMoreSettings, openSetUpPage, ready } from "./support";

/**
 * WHAT EACH CONTROL IS CALLED, AND WHAT IS MERELY SAID ABOUT IT.
 *
 * A `<label>` names its control, and everything inside the label is part of
 * that name. So a hint written inside one — which is where `Field` and
 * `Toggle` used to put theirs — became part of the name: a screen reader
 * announced two hundred characters of explanation as the name of a combo box,
 * and somebody driving the site by voice had to say the whole paragraph to
 * reach it. `aria-describedby` is the other half of the pair, and moving the
 * hint onto it is the difference between a control called "Handicap" and one
 * called "Handicap One colour plays under extra restrictions and…".
 *
 * IT HAS TO BE CHECKED BY NAME AND NOT BY READING THE MARKUP, because the
 * name is computed from the rendered tree by rules no source file states.
 * That is also what `exact: true` is doing on every one of these: without it
 * Playwright matches a SUBSTRING, so `name: "Show when I am here"` would find
 * the control whatever paragraph followed it, and this file would have been
 * green against the fault it exists to catch.
 *
 * Both halves are asserted for each control — the name is the label ALONE, and
 * the hint is still reachable as the description — because either one on its
 * own is satisfied by a control that says nothing about itself at all.
 */

/** The text a control is DESCRIBED by, followed through `aria-describedby`. */
async function descriptionOf(control: Locator): Promise<string> {
  const ids = await control.getAttribute("aria-describedby");
  expect(ids, "the control names no description").not.toBeNull();
  return control.evaluate(
    (el, list) =>
      list
        .split(/\s+/)
        .map(
          (id) =>
            el.ownerDocument.getElementById(id)?.textContent ??
            `«nothing on the page has the id ${id}»`,
        )
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    ids as string,
  );
}

test.describe("a control is named by its label", () => {
  test("the profile's checkboxes and its retention select are, and their hints are read after", async ({
    browser,
    baseURL,
  }) => {
    /*
     * Its own member. Nothing here writes anything — the page is only read —
     * but the operator's row on a developer's machine is the site owner's own
     * account, and a spec that signs in as it is a spec about this database's
     * history. See AGENTS.md, "A Spec Should Bring Its Own World".
     */
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `named-${stamp}@example.test`,
      name: `Named ${stamp}`,
    });
    const page = await context.newPage();
    await page.goto("/me?view=profile");
    /*
     * The form's own marker first. A name is computed from the rendered tree,
     * and the tree the server sent is replaced during hydration — asking
     * before then measures the markup rather than the page.
     */
    await ready(page, "profile-form");

    // Both checkboxes, which are the shared `Toggle`.
    for (const [label, hint] of [
      ["Show when I am here", "Listed on the players page while you are on the site."],
      ["Email me when it is my move", "One mail per turn, once mail is set up."],
    ]) {
      const box = page.getByRole("checkbox", { name: label, exact: true });
      await expect(box, `no checkbox is named exactly "${label}"`).toHaveCount(1);
      expect(await descriptionOf(box)).toContain(hint);
    }

    /*
     * The retention select, which is a column rather than a row and so is
     * labelled by hand rather than through `Field`. Same rule, kept the same
     * way: the note is beside the label and not inside it.
     */
    const label = "Keep finished games in my list for";
    const keep = page.getByRole("combobox", { name: label, exact: true });
    await expect(keep, `no select is named exactly "${label}"`).toHaveCount(1);
    expect(await descriptionOf(keep)).toContain("The record keeps every game whatever this says");

    await context.close();
  });

  test("so is a select inside the shared Field, on the screen that settles a game", async ({
    page,
  }) => {
    /*
     * The other half of the same change, and the reason it is worth a second
     * case: `Field` is handed its control as `children` rather than rendering
     * one, so the hint's id reaches the control through a context — a
     * different mechanism from `Toggle`'s, which could break on its own. Nine
     * panels across the site use it. Looking at the set-up screen creates
     * nothing.
     */
    await openSetUpPage(page, "gomoku");
    /*
     * The handicap lives in the fold, and a role query does not see a control
     * inside a shut `<details>` at all — which is worth knowing, because the
     * first version of this case asked before opening it and failed with
     * "no select is named exactly Handicap", the same message a broken name
     * would have given.
     */
    await openMoreSettings(page);
    const panel = page.getByTestId("set-up-handicap");
    await expect(panel).toBeVisible();
    const handicap = panel.getByRole("combobox", {
      name: GAME_COPY.handicap.label,
      exact: true,
    });
    await expect(handicap, `no select is named exactly "${GAME_COPY.handicap.label}"`).toHaveCount(1);
    expect(await descriptionOf(handicap)).toBe(SET_UP_COPY.handicapHint);
  });
});
