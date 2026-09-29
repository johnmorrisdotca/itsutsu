/*
 * A BOARD AS IT IS DRAWN, AS ONE PICTURE — in the browser, from the page.
 *
 * The board games' wallpaper draws its positions from the moves (`mosaic.ts`),
 * because a board game is its moves. The other games — every puzzle, every
 * party table, every card game — are drawn by a component of their own each,
 * and a second drawing of each in SVG would be twenty pictures that drift from
 * the boards they copy. So this takes the board the reader is looking at: it
 * copies the element with the styles the browser worked out for it, lays the
 * copy inside an SVG (`foreignObject`), and has the browser paint that into a
 * canvas. What comes out is the board exactly as it is drawn, wood, cards,
 * lines and all.
 *
 * Called from a handler only, once somebody asks for a wallpaper. Nothing is
 * sent anywhere and the site is asked nothing, beyond the fonts and pictures
 * the page has already loaded, read again from this browser's cache.
 *
 * WHY A data: ADDRESS AND NOT A blob: ONE. A picture holding `foreignObject`
 * read from a blob: address marks the canvas as foreign in Chromium and
 * WebKit, and a marked canvas cannot be saved. Read from a data: address it
 * can be, in both (tried in each, 2026-09-29).
 */

/** The board as a picture: a PNG as a data: address, and the size it is drawn at on the page, in CSS pixels. */
export type BoardSnapshot = { url: string; width: number; height: number };

/** How many times the page's size the picture is painted at, so it stays sharp on a wallpaper. */
const MOST_SCALE = 3;

/** Fonts are carried into the picture only up to this much, so a board of kanji cannot make it enormous. */
const FONT_BUDGET_BYTES = 3_000_000;

const XHTML = "http://www.w3.org/1999/xhtml";

/**
 * Written down even when they match the default: a value that reads the same
 * can mean something else once a neighbour differs. A border's width reads
 * "0px" both where there is no border and where a stylesheet set a solid one
 * of nothing — so with the style copied and the width left out, the copy
 * grows the default three-pixel border round every square.
 */
const ALWAYS = /^(border|outline|column-rule)|(^|-)(width|height)$/;

/** What paints a shape inside an SVG, copied onto each one whatever it says. */
const SVG_PAINT = [
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-dasharray",
  "stroke-linecap",
  "stroke-linejoin",
  "opacity",
  "color",
  "font-family",
  "font-size",
  "font-weight",
  "text-anchor",
  "visibility",
  "filter",
] as const;

/** A same-origin file as a data: address, or null when it cannot be read. */
async function dataUrlOf(url: string): Promise<string | null> {
  try {
    const answer = await fetch(url, { cache: "force-cache" });
    if (!answer.ok) return null;
    const blob = await answer.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Every `url(…)` in a style value, each read into a data: address. */
async function inlineUrls(value: string, cache: Map<string, Promise<string | null>>): Promise<string> {
  const found = [...value.matchAll(/url\((['"]?)([^'")]+)\1\)/g)];
  let out = value;
  for (const match of found) {
    const address = match[2]!;
    if (address.startsWith("data:") || address.startsWith("#")) continue;
    if (!cache.has(address)) cache.set(address, dataUrlOf(address));
    const data = await cache.get(address)!;
    out = out.replace(match[0], data === null ? "none" : `url("${data}")`);
  }
  return out;
}

/** What a tag looks like with nothing said about it, from a page of its own, so only what differs is written down. */
function baselines(): { of: (tag: string) => CSSStyleDeclaration; done: () => void } {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;left:-10000px;top:0;width:10px;height:10px;visibility:hidden;border:0";
  document.body.append(frame);
  const inner = frame.contentDocument!;
  const known = new Map<string, CSSStyleDeclaration>();
  return {
    of: (tag) => {
      const seen = known.get(tag);
      if (seen !== undefined) return seen;
      const element = inner.createElement(tag);
      inner.body.append(element);
      const style = frame.contentWindow!.getComputedStyle(element);
      known.set(tag, style);
      return style;
    },
    done: () => frame.remove(),
  };
}

/**
 * The style an element is drawn with, written out: every property whose value
 * is neither the tag's own default nor already what it inherits from its
 * parent, so the copy looks the same outside the page's stylesheets.
 */
function styleText(style: CSSStyleDeclaration, base: CSSStyleDeclaration, parent: CSSStyleDeclaration | null): string {
  const parts: string[] = [];
  for (let i = 0; i < style.length; i += 1) {
    const name = style[i]!;
    const value = style.getPropertyValue(name);
    if (!ALWAYS.test(name) && value === base.getPropertyValue(name) && (parent === null || value === parent.getPropertyValue(name))) continue;
    parts.push(`${name}:${value}`);
  }
  return parts.join(";");
}

/** A `::before` or `::after` worth copying: one with something in it. */
function pseudoText(element: Element, which: "::before" | "::after"): string | null {
  const style = getComputedStyle(element, which);
  const content = style.getPropertyValue("content");
  if (content === "none" || content === "normal" || content === "") return null;
  const parts: string[] = [];
  for (let i = 0; i < style.length; i += 1) {
    const name = style[i]!;
    parts.push(`${name}:${style.getPropertyValue(name)}`);
  }
  return parts.join(";");
}

/** The page's own @font-face rules for the families the copy uses, each file read in, within the budget. */
async function fontFaces(families: Set<string>, cache: Map<string, Promise<string | null>>): Promise<string> {
  const rules: CSSFontFaceRule[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let list: CSSRuleList;
    try {
      list = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSFontFaceRule) {
        const family = rule.style.getPropertyValue("font-family").replace(/['"]/g, "").trim();
        if (families.has(family)) rules.push(rule);
      }
    }
  }
  let spent = 0;
  const out: string[] = [];
  for (const rule of rules) {
    const text = rule.cssText;
    if (spent > FONT_BUDGET_BYTES) break;
    const inlined = await inlineUrls(text, cache);
    spent += inlined.length;
    out.push(inlined);
  }
  return out.join("\n");
}

/** The first family of a font stack, as a @font-face names it. */
function firstFamily(stack: string): string {
  return (stack.split(",")[0] ?? "").replace(/['"]/g, "").trim();
}

/** The colour the page is painted behind an element: its own, or the nearest ancestor's that is not see-through. */
function groundBehind(element: Element): string {
  for (let at: Element | null = element; at !== null; at = at.parentElement) {
    const colour = getComputedStyle(at).backgroundColor;
    if (colour !== "" && colour !== "transparent" && !/rgba\(.*,\s*0\)$/.test(colour)) return colour;
  }
  return getComputedStyle(document.body).backgroundColor || "#ffffff";
}

/**
 * The board, painted: `element` copied with its styles into an SVG and drawn
 * into a canvas at up to `scale` times its size on the page.
 */
export async function snapshotBoard(element: HTMLElement, scale = MOST_SCALE): Promise<BoardSnapshot> {
  const box = element.getBoundingClientRect();
  const width = Math.max(1, Math.round(box.width));
  const height = Math.max(1, Math.round(box.height));
  const base = baselines();
  const cache = new Map<string, Promise<string | null>>();
  const families = new Set<string>();
  const pseudo: string[] = [];
  let mark = 0;

  async function copy(node: Node, parentStyle: CSSStyleDeclaration | null): Promise<Node | null> {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent ?? "");
    if (!(node instanceof Element)) return null;
    const style = getComputedStyle(node);
    if (style.display === "none") return null;
    const tag = node.tagName.toLowerCase();
    if (tag === "script" || tag === "dialog") return null;
    // A canvas cannot be copied as it stands: it becomes the picture it holds.
    if (node instanceof HTMLCanvasElement) {
      const image = document.createElementNS(XHTML, "img") as HTMLImageElement;
      try {
        image.src = node.toDataURL("image/png");
      } catch {
        return null;
      }
      image.setAttribute("style", styleText(style, base.of("img"), parentStyle));
      return image;
    }
    const clone = node.cloneNode(false) as Element;
    const inSvg = node instanceof SVGElement;
    if (!inSvg || tag === "svg") {
      let text = styleText(style, base.of(inSvg ? "span" : tag), parentStyle);
      if (text.includes("url(")) text = await inlineUrls(text, cache);
      clone.setAttribute("style", text);
    } else {
      // Inside a drawing, what paints it — often set by a class, which the copy no longer has a stylesheet for.
      const painted = SVG_PAINT.map((name) => `${name}:${style.getPropertyValue(name)}`).join(";");
      clone.setAttribute("style", `${painted};${node.getAttribute("style") ?? ""}`);
    }
    families.add(firstFamily(style.fontFamily));
    if (node instanceof HTMLImageElement && node.currentSrc !== "" && !node.currentSrc.startsWith("data:")) {
      const data = await dataUrlOf(node.currentSrc);
      if (data !== null) {
        clone.setAttribute("src", data);
        clone.removeAttribute("srcset");
      }
    }
    if (node instanceof SVGImageElement) {
      const href = node.getAttribute("href") ?? node.getAttribute("xlink:href");
      if (href !== null && !href.startsWith("data:")) {
        const data = await dataUrlOf(href);
        if (data !== null) clone.setAttribute("href", data);
      }
    }
    for (const which of ["::before", "::after"] as const) {
      const text = pseudoText(node, which);
      if (text === null) continue;
      if (!clone.hasAttribute("data-wp")) clone.setAttribute("data-wp", String((mark += 1)));
      pseudo.push(`[data-wp="${clone.getAttribute("data-wp")}"]${which}{${text.includes("url(") ? await inlineUrls(text, cache) : text}}`);
    }
    for (const child of Array.from(node.childNodes)) {
      const made = await copy(child, inSvg ? parentStyle : style);
      if (made !== null) clone.append(made);
    }
    return clone;
  }

  let copied: Node | null;
  try {
    copied = await copy(element, null);
  } finally {
    base.done();
  }
  if (!(copied instanceof Element)) throw new Error("nothing to draw");
  // Placed where the page placed it inside its own box, not where it sat on the page.
  const rootStyle = copied.getAttribute("style") ?? "";
  copied.setAttribute("style", `${rootStyle};margin:0;position:relative;left:0;top:0;transform:none;width:${width}px;height:${height}px;box-sizing:border-box`);
  const fonts = await fontFaces(families, cache);
  const ground = groundBehind(element);
  const body = new XMLSerializer().serializeToString(copied);
  const styles = `<style>${fonts}\n${pseudo.join("\n")}</style>`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}" viewBox="0 0 ${width} ${height}">` +
    `<foreignObject x="0" y="0" width="${width}" height="${height}">` +
    `<div xmlns="${XHTML}" style="width:${width}px;height:${height}px;background:${ground}">${styles}${body}</div>` +
    `</foreignObject></svg>`;

  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode();
  // Pictures inside a foreignObject can arrive a moment after the picture itself says it is ready.
  await new Promise((resolve) => window.setTimeout(resolve, 60));
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext("2d");
  if (context === null) throw new Error("no 2d context");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { url: canvas.toDataURL("image/png"), width, height };
}
