import { KEY_MAX } from "./backlog.constants.ts";

/**
 * A stable kebab-case key for a title.
 *
 * Titles are typed by people and get edited afterwards; the key is what a
 * commit message, a note and `pnpm release:take --done` hold on to, so it is
 * derived once at the moment an item is added and never again. A title with no
 * Latin letters at all — a request typed in Japanese — still needs a key, so
 * one is made from the moment it arrived rather than refusing the request.
 *
 * Its own module, beside `backlog.ts` rather than inside it, because `pnpm task`
 * runs under Node's own type stripping, which resolves only imports that name
 * their file. What it makes is always a slug Sumilabu's board accepts:
 * lower-case letters and digits joined by single hyphens.
 */

const KEBAB = /[^a-z0-9]+/g;

export function keyFromTitle(title: string, now: Date = new Date()): string {
  const slug = title.toLowerCase().replace(KEBAB, "-").replace(/^-+|-+$/g, "").slice(0, KEY_MAX);
  const trimmed = slug.replace(/-+$/g, "");
  return trimmed === "" ? `item-${now.getTime().toString(36)}` : trimmed;
}

/** The key tried after `key` was taken: a numbered neighbour, kept inside the cap. */
export function neighbourKey(key: string, attempt: number): string {
  const suffix = `-${attempt}`;
  return `${key.slice(0, KEY_MAX - suffix.length).replace(/-+$/g, "")}${suffix}`;
}
