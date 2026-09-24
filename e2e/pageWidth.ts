import type { Page } from "@playwright/test";

/**
 * What a page's width looks like to somebody reading it, measured in the
 * browser rather than read from the source.
 *
 * Two things are measured, because John has found both by eye, over and over,
 * and nothing caught either:
 *
 * - THE FRAME: the left and right edges of everything the page draws under
 *   the site's header — every block of text, every card, border, picture and
 *   control. Two pages whose frames differ are two pages that change width as
 *   a reader moves between them.
 * - CAPPED TEXT: a paragraph that wraps while a `max-width` somewhere between
 *   it and the frame holds it well short of the box it sits in. That is text
 *   stopping at 55% of the page with room to spare — the games page's notes,
 *   the XP page's introduction. A cap that is on purpose says so in the code
 *   with `data-width-reason="…"` on the capping element, and is then left
 *   alone.
 *
 * Both are measured from the layout the browser actually drew, so it does not
 * matter how a page arrived at its width — a constant, a class typed by hand,
 * a wrapper three components down. Whatever the cause, the edges are the
 * edges.
 */

/** One element holding text short of its container with a `max-width`. */
export type CappedText = {
  /** A CSS-ish path to the capping element, enough to find it in the source. */
  element: string;
  /** Its class list, which is usually where the `max-w-…` is. */
  classes: string;
  /** The computed `max-width` doing the capping. */
  maxWidth: string;
  width: number;
  /** The content width of the box it sits in, which it could have filled. */
  available: number;
  /** The start of the first wrapped paragraph it caps, to find it on the page. */
  sample: string;
};

export type PageWidthReading = {
  /** Left and right edge of everything drawn under the header, in CSS pixels. */
  left: number;
  right: number;
  /** What reaches each edge, so a report can say which element to look at. */
  atLeft: string;
  atRight: string;
  capped: CappedText[];
};

/**
 * A capped block narrower than this share of the room it has is reported.
 * John's examples stop at 50–75%; a few per cent short is a rounding of a
 * grid, not a column that stops half way.
 */
export const CAPPED_TEXT_RATIO = 0.9;

/**
 * The site's own masthead and footer, which every page draws at the frame's
 * width and so say nothing about the page under them.
 */
export const SITE_CHROME = "header[data-chrome], footer[data-chrome]";

/**
 * Measures the page as it stands. Wait for the page to be drawn first — this
 * reads the layout once and does not wait for anything itself.
 */
export async function readPageWidth(page: Page): Promise<PageWidthReading> {
  return page.evaluate(([ratio, CHROME]) => {
    const root = document.querySelector("main") ?? document.body;

    const visible = (el: Element) => {
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) return false;
      if (style.position === "fixed") return false;
      const rect = el.getBoundingClientRect();
      // sr-only content is one pixel square and clipped; it is not drawn.
      return rect.width > 2 && rect.height > 2;
    };

    const inChrome = (el: Element) => el.closest(CHROME) !== null;

    /** A rect cut down to what the scroll boxes around it let be seen. */
    const clipped = (el: Element) => {
      let left = el.getBoundingClientRect().left;
      let right = el.getBoundingClientRect().right;
      for (let up = el.parentElement; up && up !== document.documentElement; up = up.parentElement) {
        const style = getComputedStyle(up);
        if (style.overflowX !== "visible") {
          const box = up.getBoundingClientRect();
          left = Math.max(left, box.left);
          right = Math.min(right, box.right);
        }
        if (style.position === "fixed") return null;
      }
      return right - left > 2 ? { left, right } : null;
    };

    const contentBox = (el: Element) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        left: rect.left + parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth),
        right: rect.right - parseFloat(style.paddingRight) - parseFloat(style.borderRightWidth),
      };
    };

    const isInline = (el: Element) => getComputedStyle(el).display.startsWith("inline") && el.tagName !== "svg";

    const hasPaint = (el: Element) => {
      const style = getComputedStyle(el);
      const transparent = (colour: string) => colour === "transparent" || /rgba\([^)]*,\s*0\)$/.test(colour);
      if (!transparent(style.backgroundColor) || style.backgroundImage !== "none") return true;
      return (["Top", "Right", "Bottom", "Left"] as const).some(
        (side) =>
          parseFloat(style.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0 &&
          style.getPropertyValue(`border-${side.toLowerCase()}-style`) !== "none" &&
          !transparent(style.getPropertyValue(`border-${side.toLowerCase()}-color`)),
      );
    };

    const REPLACED = new Set(["IMG", "svg", "CANVAS", "VIDEO", "IFRAME", "INPUT", "SELECT", "TEXTAREA", "BUTTON"]);

    let left = Infinity;
    let right = -Infinity;
    let atLeft: Element | null = null;
    let atRight: Element | null = null;
    const take = (edges: { left: number; right: number } | null, el: Element) => {
      if (!edges) return;
      if (edges.left < left) [left, atLeft] = [edges.left, el];
      if (edges.right > right) [right, atRight] = [edges.right, el];
    };

    // Boxes a reader sees: painted ones, and pictures and controls.
    for (const el of root.querySelectorAll("*")) {
      if (inChrome(el) || !visible(el)) continue;
      if (el.closest("svg") && el.tagName !== "svg") continue;
      if (REPLACED.has(el.tagName) || hasPaint(el)) take(clipped(el), el);
    }

    // Blocks of text, measured by the box the text lays out in, not by how
    // far this particular sentence happened to run.
    const blocks = new Set<Element>();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent?.trim()) continue;
      let block = node.parentElement;
      while (block && block !== root && isInline(block)) block = block.parentElement;
      if (!block || inChrome(block) || !visible(block) || block.closest("svg")) continue;
      blocks.add(block);
    }
    for (const block of blocks) {
      const box = contentBox(block);
      const cut = clipped(block);
      if (cut) take({ left: Math.max(box.left, cut.left), right: Math.min(box.right, cut.right) }, block);
    }

    // Wrapped text held short of its container by a max-width.
    const describe = (el: Element) => {
      const parts: string[] = [];
      for (let at: Element | null = el; at && at !== root && parts.length < 4; at = at.parentElement) {
        const id = at.id ? `#${at.id}` : "";
        const testId = at.getAttribute("data-testid");
        parts.unshift(`${at.tagName.toLowerCase()}${id}${testId ? `[data-testid=${testId}]` : ""}`);
      }
      return parts.join(" > ");
    };
    const wraps = (block: Element) => {
      const range = document.createRange();
      range.selectNodeContents(block);
      const tops = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)));
      return tops.size > 1;
    };
    const capped = new Map<Element, { sample: string; available: number }>();
    for (const block of blocks) {
      if (!wraps(block)) continue;
      for (let el: Element | null = block; el && el !== root; el = el.parentElement) {
        if (el.closest("[data-width-reason]")) break;
        const style = getComputedStyle(el);
        if (style.maxWidth === "none" || !el.parentElement) continue;
        const room = contentBox(el.parentElement);
        const available = room.right - room.left;
        const width = el.getBoundingClientRect().width;
        if (width < available * ratio && !capped.has(el)) {
          capped.set(el, { sample: (block.textContent ?? "").trim().slice(0, 60), available });
        }
      }
    }

    const named = (el: Element | null) =>
      el === null ? "nothing" : `${describe(el)} (class "${el.getAttribute("class") ?? ""}")`;
    return {
      left: Math.round(left),
      right: Math.round(right),
      atLeft: named(atLeft),
      atRight: named(atRight),
      capped: [...capped].map(([el, { sample, available }]) => ({
        element: describe(el),
        classes: el.getAttribute("class") ?? "",
        maxWidth: getComputedStyle(el).maxWidth,
        width: Math.round(el.getBoundingClientRect().width),
        available: Math.round(available),
        sample,
      })),
    };
  }, [CAPPED_TEXT_RATIO, SITE_CHROME] as const);
}
