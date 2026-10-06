import { jaText, type JaCases, type JaLine, type JaNode, type JaTextCases, type JaTextNode } from "./copyJa.types";
import type { Locale } from "./i18n.types";

/**
 * A table of English copy that belongs to data, read in the reader's language.
 *
 * The English table keeps its own file and its own shape: the names, the
 * numbers, the class lists and the keys that are not words. Its Japanese is an
 * OVERLAY of the same shape (`JaOverlay<typeof ENGLISH>`) that holds only the
 * sentences, each as `["日本語", "literal English"]`, and sits under
 * `src/lib/i18n/dictionaries/` beside the other Japanese copy. A sentence with
 * no overlay is read as it is in English, which the coverage tests refuse
 * (`copyTableAudit.ts`), so a table can never be half in Japanese without a
 * test saying which line.
 *
 * Why an overlay and not a second full table: a puzzle's tables carry colours,
 * sizes and limits beside their words, and the words are the only thing a
 * language changes. A second copy of the rest is a second place to forget a
 * number (AGENTS.md, "Types And Constants Pattern").
 */

/**
 * What a Japanese overlay of an English value looks like. A string is a line;
 * a function that makes a string is a line with `{0}`, `{1}` where its arguments
 * go, or a choice of lines by an argument's value (`JaNode`); a list is a list
 * of the same length; an object holds whichever of its keys are words.
 */
export type JaOverlay<T> = T extends string
  ? JaLine
  : T extends (...args: never[]) => string
    ? JaNode
    : T extends readonly (infer U)[]
      ? readonly JaOverlay<U>[]
      : T extends object
        ? { [K in keyof T]?: JaOverlay<T[K]> }
        : never;

/** The same overlay as the reader is given it: the sentences alone, with no back-translation. */
export type JaTextOverlay<T> = T extends string
  ? string
  : T extends (...args: never[]) => string
    ? JaTextNode
    : T extends readonly (infer U)[]
      ? readonly JaTextOverlay<U>[]
      : T extends object
        ? { [K in keyof T]?: JaTextOverlay<T[K]> }
        : never;

const MADE = new WeakMap<object, WeakMap<object, unknown>>();

function isLine(value: unknown): value is JaLine {
  return Array.isArray(value) && value.length === 2 && typeof value[0] === "string" && typeof value[1] === "string";
}

/** A choice of lines by an argument's value. */
export function isCases(value: unknown): value is JaCases | JaTextCases {
  return typeof value === "object" && value !== null && !Array.isArray(value) && typeof (value as { by?: unknown }).by === "number" && typeof (value as { is?: unknown }).is === "object";
}

/** A line, or the text of one, or a choice between them: what a function's Japanese is. */
function isNode(value: unknown): value is JaNode | JaTextNode {
  return typeof value === "string" || isLine(value) || isCases(value);
}

/** A template with the call's arguments where `{0}`, `{1}` stand. */
export function fillLine(template: string, args: readonly unknown[]): string {
  return template.replace(/\{(\d+)\}/g, (whole, at: string) => (Number(at) < args.length ? String(args[Number(at)]) : whole));
}

/** What a function's Japanese says for these arguments, or `undefined` where it has nothing for them. */
export function pickLine(node: JaNode | JaTextNode, args: readonly unknown[]): string | undefined {
  if (typeof node === "string") return fillLine(node, args);
  if (isLine(node)) return fillLine(node[0], args);
  const chosen = node.is[String(args[node.by])] ?? node.other;
  return chosen === undefined ? undefined : pickLine(chosen, args);
}

function lay(english: unknown, ja: unknown): unknown {
  if (ja === undefined) return english;
  if (typeof english === "string") return typeof ja === "string" ? ja : isLine(ja) ? jaText(ja) : english;
  if (typeof english === "function") {
    if (!isNode(ja)) return english;
    return (...args: unknown[]) => pickLine(ja, args) ?? (english as (...rest: unknown[]) => unknown)(...args);
  }
  if (Array.isArray(english)) {
    if (!Array.isArray(ja)) return english;
    return english.map((item, at) => lay(item, (ja as unknown[])[at]));
  }
  if (typeof english === "object" && english !== null) {
    if (typeof ja !== "object" || ja === null) return english;
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(english)) out[key] = lay(value, (ja as Record<string, unknown>)[key]);
    return out;
  }
  return english;
}

/**
 * The English table with the Japanese overlay laid over its sentences, made
 * once and handed back, so a client component that asks on every render gets
 * the same object each time. The overlay is the authored one (a test's) or the
 * text a reader is given (`jaText().puzzles`): both lay the same way.
 */
export function overlay<T>(english: T, ja: JaOverlay<T> | JaTextOverlay<T> | undefined): T {
  if (ja === undefined || typeof english !== "object" || english === null) return lay(english, ja) as T;
  let byOverlay = MADE.get(english as object);
  if (byOverlay === undefined) {
    byOverlay = new WeakMap();
    MADE.set(english as object, byOverlay);
  }
  const key = ja as object;
  if (byOverlay.has(key)) return byOverlay.get(key) as T;
  const made = lay(english, ja) as T;
  byOverlay.set(key, made);
  return made;
}

/** The English table for an English reader, the overlaid one for a Japanese one. */
export function tableIn<T>(english: T, ja: () => JaOverlay<T> | JaTextOverlay<T>, locale: Locale): T {
  return locale === "ja" ? overlay(english, ja()) : english;
}

/** One Japanese line of a table, with where it sits: `a.b[2].c`, and `a.c{0}` for the line a function says when its argument reads 0. */
export type OverlayLine = { path: string; line: JaLine };

/** Every line of an overlay, in order, for the review sheet and the tests. */
export function overlayLines(ja: unknown, path = ""): OverlayLine[] {
  if (isLine(ja)) return [{ path, line: ja }];
  if (isCases(ja)) {
    const cases = ja as JaCases;
    return [
      ...Object.entries(cases.is).flatMap(([value, node]) => overlayLines(node, `${path}{${value}}`)),
      ...(cases.other === undefined ? [] : overlayLines(cases.other, `${path}{other}`)),
    ];
  }
  if (Array.isArray(ja)) return ja.flatMap((item, at) => overlayLines(item, `${path}[${at}]`));
  if (typeof ja === "object" && ja !== null) {
    // `review` and `ask` are about the lines, not lines.
    return Object.entries(ja)
      .filter(([key]) => key !== "review" && key !== "ask")
      .flatMap(([key, value]) => overlayLines(value, path === "" ? key : `${path}.${key}`));
  }
  return [];
}
