import { expect, test, type Locator } from "@playwright/test";

import { GAME_COPY } from "../src/components/game/game.constants";
import { SET_UP_COPY } from "../src/components/live/live.constants";
import { SEAT_DISPLAY, SEATS, STONE_DISPLAY } from "../src/lib/gomoku/gomoku.constants";

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

/**
 * The same rule where a component writes its own `<label>` rather than using
 * `Field` or `Toggle`. Each of these had the note inside the label, and each
 * is fixed by hand in the same shape — so each is checked by name, on the page
 * a reader meets it on, rather than trusted because the shared controls are.
 */
test.describe("a hand-written label names its control too", () => {
  test("the invite-code box at the door, for somebody with no session", async ({ browser, baseURL }) => {
    /*
     * A stranger, because the door is only ever seen by one: `/join` sends a
     * signed-in browser straight back out, and this file's context is the
     * operator's. `baseURL` by hand, because a context made here is not given
     * `use`. The code in the address is what shows the box without a click,
     * which is exactly what an invitation link does — it is filled in, never
     * sent.
     */
    const context = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();
    await page.goto("/join?code=hoshi-kuma-nami");
    await ready(page, "join-form");

    const label = "Invite code";
    const box = page.getByRole("textbox", { name: label, exact: true });
    await expect(box, `no box is named exactly "${label}"`).toHaveCount(1);
    expect(await descriptionOf(box)).toBe("Capitals, spaces or hyphens — any of them work.");

    await context.close();
  });

  test("the checkboxes on the operator's door", async ({ page }) => {
    /*
     * As the operator, which is this file's own context: both panels draw
     * nothing for anybody else. Looking at the tab mints no code and issues
     * no token.
     */
    await page.goto("/admin");
    await expect(page.getByTestId("admin-door")).toBeVisible();

    const onceLabel = "One person only";
    const once = page
      .getByTestId("admin-invites")
      .getByRole("checkbox", { name: onceLabel, exact: true });
    await expect(once, `no checkbox is named exactly "${onceLabel}"`).toHaveCount(1);
    expect(await descriptionOf(once)).toBe(
      "the code is spent as soon as it is used. Otherwise it stays good for anyone who has it.",
    );

    /*
     * The embed panel's box beside it never had a note inside its label: the
     * sentence IS its name, and nothing further is said about it. Held to
     * that name here because it is the next place a note would be added.
     */
    const dataLabel = "Also let it read games played and player names";
    const withData = page
      .getByTestId("admin-embeds")
      .getByRole("checkbox", { name: dataLabel, exact: true });
    await expect(withData, `no checkbox is named exactly "${dataLabel}"`).toHaveCount(1);
  });

  test("the invite note and the embed label, which had a placeholder and no label", async ({ page }) => {
    /*
     * A placeholder is not a label: it is gone the moment somebody types, and
     * a screen reader need not announce it as the box's name. Chromium does
     * fall back to it when nothing else names a box — read off this page
     * before the fix, the two were `textbox "Who is it for?"` and
     * `textbox "Which site is it for?"`, their placeholders and nothing else.
     * So the name asked for here is deliberately NOT the placeholder's words:
     * asked for those, the unlabelled boxes would have passed.
     *
     * The label is asserted visible as well as naming the box, because a
     * name only a screen reader hears leaves a sighted reader with the same
     * vanishing placeholder. Looking at the tab mints no code and issues no
     * token.
     */
    await page.goto("/admin");
    await expect(page.getByTestId("admin-door")).toBeVisible();

    for (const [panelId, label] of [
      ["admin-invites", "Who it is for"],
      ["admin-embeds", "Which site it is for"],
    ]) {
      const panel = page.getByTestId(panelId);
      const box = panel.getByRole("textbox", { name: label, exact: true });
      await expect(box, `no box is named exactly "${label}"`).toHaveCount(1);
      await expect(panel.locator("label", { hasText: label })).toBeVisible();
    }
  });

  test("the line on the door, on the site tab, which had a placeholder and no label", async ({ page }) => {
    /*
     * The same fault in the site settings: the note's box sits in a fieldset
     * whose legend names the GROUP, not the box, so the box was named by its
     * placeholder alone. Asked for by words that are not the placeholder, for
     * the reason above — and written out rather than imported from the copy,
     * because a name read from a key that does not exist yet is `undefined`,
     * and `name: undefined` matches any box at all. Reading the tab saves
     * nothing.
     */
    await page.goto("/admin?view=site");
    await ready(page, "admin-site");

    const label = "What the door says";
    const panel = page.getByTestId("site-setting-joinNotice");
    const box = panel.getByRole("textbox", { name: label, exact: true });
    await expect(box, `no box is named exactly "${label}"`).toHaveCount(1);
    await expect(panel.locator("label", { hasText: label })).toBeVisible();
  });

  test("the two name boxes beside the practice board, and the stone each seat holds is said after", async ({
    page,
  }) => {
    /*
     * The practice board is client-only (`ssr: false`), so this panel and its
     * handlers arrive in one commit and there is no server tree to be swapped
     * out under the question. Nothing here plays a stone or keeps a name.
     */
    await page.goto("/games/gomoku/play");

    const said: string[] = [];
    for (const seat of Object.values(SEATS)) {
      const label = SEAT_DISPLAY[seat].label;
      /*
       * `combobox`, not `textbox`: the box completes names from a datalist,
       * and a text input with a `list` is a combo box to the accessibility
       * tree.
       */
      const box = page.getByRole("combobox", { name: label, exact: true });
      await expect(box, `no name box is named exactly "${label}"`).toHaveCount(1);
      said.push(await descriptionOf(box));
    }
    /*
     * Which seat holds which stone is the game's to decide, and a swap moves
     * it, so this lists what it accepts rather than guessing an order: one
     * seat described by each stone.
     */
    expect(said.sort()).toEqual([STONE_DISPLAY.black.kanji, STONE_DISPLAY.white.kanji].sort());
  });
});
