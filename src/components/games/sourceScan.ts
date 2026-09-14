/**
 * Reading this site's own source for the shapes its coverage gates look for.
 *
 * Shared by `gameLinks.coverage.test.ts` (a game's name leads to the game) and
 * `gamePictures.coverage.test.ts` (a game named in a list shows its picture).
 * Both have to answer the same three questions — what is a comment, where is a
 * game's name printed, and is it inside a control — and two copies of those
 * answers would drift into two different ideas of "a game's name", which is
 * the one thing two gates about game names must not disagree on.
 *
 * Pure string functions: the gates do the reading of files.
 */

/**
 * The file with its comments blanked out, character for character.
 *
 * EVERY CHECK READS THIS RATHER THAN THE FILE, and it was a hole rather than a
 * nicety: `GamePicker.tsx` explains its own exception in prose that quotes the
 * idiom — "this one goes through `<Paired en={copy.label}>` as a prop" — so a
 * matcher found the SENTENCE ABOUT a game name and reported the file. A gate
 * that reads the explanation of the rule as a breach of it is a gate people
 * delete. Worse in the other direction: the same file's prose mentions "an <a>
 * inside the <label>" with no closing tag, which is enough to make a
 * tag-counting check believe every name after it sits inside a form control.
 *
 * Blanked rather than removed, so every offset is still an offset into the
 * real file and the line a failure names is the line somebody has to open.
 * `//` is only a comment where the character before it is not a word character
 * or a colon — `https://` is an address, not a comment.
 */
export function code(source: string): string {
  const blank = (text: string) => text.replace(/[^\n]/g, " ");
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^\w:])\/\/[^\n]*/g, (match, lead: string) => lead + blank(match.slice(lead.length)));
}

/**
 * Whether the position sits inside an open `<tag`, looking back no further than
 * a tag and its attributes can span — so an element four earlier cannot vouch
 * for something nowhere near it.
 */
export function inside(tag: string, source: string, at: number): boolean {
  const before = source.slice(Math.max(0, at - 400), at);
  const open = before.lastIndexOf(`<${tag}`);
  if (open === -1) return false;
  return open > before.lastIndexOf(`</${tag}>`);
}

/**
 * Whether this sits inside a form control — an `<option>`, `<label>` or
 * `<button>`, where choosing IS the way to the thing named.
 *
 * UNBOUNDED, unlike `inside`: "I am inside a `<label>`" is true however much
 * markup intervenes, and in `GamePicker` the label opens forty lines above the
 * name it is for. Walked as a depth rather than two totals, because a
 * SELF-CLOSING control closes itself (`<option … />` in a datalist) and a pair
 * of totals would read one stray tag as exempting the rest of the file.
 */
const CONTROL_TAG = /<(\/?)(option|label|button)\b([^>]*)>/g;

export function insideControl(source: string, at: number): boolean {
  let depth = 0;
  for (const match of source.slice(0, at).matchAll(CONTROL_TAG)) {
    const [, closing, , attributes] = match;
    if (closing === "/") depth -= 1;
    else if (!attributes.trimEnd().endsWith("/")) depth += 1;
  }
  return depth > 0;
}

/**
 * Which local names in a file hold a GAME's display copy, at one position.
 *
 * Read backwards from where the name is printed to the nearest binding of it,
 * because `copy` is not one thing: `GameBrowser.tsx` uses that name for a
 * game's row and then for an OPENING's forty lines later.
 *
 * Two ways a binding is a game, and no third:
 *
 *   - assigned from `RULE_VARIANT_DISPLAY[…]`, the table of games. Assigned
 *     from any other `…_DISPLAY[…]` it is something else — an opening, a
 *     status, a tier.
 *   - bound as a callback parameter over a list AND read for its `.variant`
 *     somewhere in the file: a row carrying a variant key beside its label is a
 *     game however the list was typed.
 */
export function isGameName(source: string, expression: string, at: number): boolean {
  if (/^variantLabel\(/.test(expression)) return true;
  if (/^RULE_VARIANT_DISPLAY\[/.test(expression)) return true;
  const held = /^([A-Za-z_$][\w$]*)\.label$/.exec(expression)?.[1];
  if (held === undefined) return false;
  const before = source.slice(0, at);
  let table: string | null = null;
  let assignedAt = -1;
  for (const match of before.matchAll(new RegExp(`\\b${held}\\s*=\\s*([A-Za-z_$][\\w$]*)\\s*\\[`, "g"))) {
    table = match[1];
    assignedAt = match.index;
  }
  let paramAt = -1;
  for (const match of before.matchAll(new RegExp(`[(,]\\s*${held}\\s*(?:,|\\)|=>|:)`, "g"))) {
    paramAt = match.index;
  }
  if (paramAt > assignedAt) return new RegExp(`\\b${held}\\.variant\\b`).test(source);
  return table === "RULE_VARIANT_DISPLAY";
}

/**
 * A name and its kanji written through `<Paired en={…} kanji={…}>`, which is how
 * the site writes a name in a label position since it has had two languages.
 */
export const PAIRED_NAME = /<Paired\b[^>]{0,240}?\ben=\{\s*([^{}]{1,80}?)\s*\}/g;

/**
 * Every place a file prints a game's name into the page by hand — that is, not
 * through `GameName`, whose call sites a gate finds for itself.
 *
 * `${...}` is left out on purpose: a name inside a template string is a name
 * inside a SENTENCE — a hover note, a page title, a line of advice.
 */
export function namesPrinted(source: string): number[] {
  const patterns = [/(?<!\$)\{\s*variantLabel\(/g, /(?<!\$)\{\s*RULE_VARIANT_DISPLAY\[[^\]]+\]\.label\s*\}/g];
  const found: number[] = [];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) found.push(match.index);
  }
  for (const match of source.matchAll(PAIRED_NAME)) {
    if (isGameName(source, match[1], match.index)) found.push(match.index);
  }
  return found;
}
