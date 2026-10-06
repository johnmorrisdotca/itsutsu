import { createElement, Fragment, type ReactNode } from "react";

import { weave } from "./weave";

/**
 * A paragraph with links and emphasis standing inside it, as ONE phrase.
 *
 * `weave` puts a node where a `{name}` stands, which is right for a figure or a single link. A paragraph of prose
 * that names six games, an outside site and a page of this one cannot be six placeholders and six little phrases:
 * the reader's language decides where each link falls, and what its words are. So a phrase may carry a few tags,
 *
 *   `<game reversi>Othello</game>`   a renderer called `game`, given the argument `reversi` and its content
 *   `<em>gomoku narabe</em>`         a renderer called `em`, given no argument
 *
 * and `markup` turns the translated text into nodes, calling the renderer each tag names. Tags nest. A `{name}` in
 * the text between them is filled from `parts`, as `weave` does. A tag nobody supplied a renderer for stands as it is
 * written, which is a bug that reads as a bug, the way `weave` leaves a missing `{name}`.
 *
 * Pure and free of the DOM, so a server page and a client component both use it. A tag is a letter-only name, so the
 * placeholder check (`{letters}`) and the phrase-key rule are not touched by it.
 */
export type MarkupRenderer = (content: ReactNode, argument: string | null) => ReactNode;

const TAG = /<(\/?)([a-z]+)(?: ([^<>]*))?>/g;

type Token = { kind: "text"; text: string } | { kind: "open"; name: string; argument: string | null; raw: string } | { kind: "close"; name: string; raw: string };

function tokens(text: string): Token[] {
  const out: Token[] = [];
  let last = 0;
  for (const match of text.matchAll(TAG)) {
    if (match.index > last) out.push({ kind: "text", text: text.slice(last, match.index) });
    out.push(match[1] === "/" ? { kind: "close", name: match[2], raw: match[0] } : { kind: "open", name: match[2], argument: match[3] ?? null, raw: match[0] });
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

export function markup(
  text: string,
  renderers: Readonly<Record<string, MarkupRenderer>>,
  parts: Readonly<Record<string, ReactNode>> = {},
): ReactNode {
  const list = tokens(text);
  let at = 0;

  function parse(until: string | null): ReactNode[] {
    const nodes: ReactNode[] = [];
    while (at < list.length) {
      const token = list[at];
      if (token.kind === "text") {
        nodes.push(createElement(Fragment, { key: at }, weave(token.text, parts)));
        at += 1;
      } else if (token.kind === "close") {
        if (token.name === until) {
          at += 1;
          return nodes;
        }
        // A closing tag nothing opened: left as written.
        nodes.push(createElement(Fragment, { key: at }, token.raw));
        at += 1;
      } else {
        const render = Object.hasOwn(renderers, token.name) ? renderers[token.name] : undefined;
        const start = at;
        at += 1;
        if (render === undefined) {
          nodes.push(createElement(Fragment, { key: start }, token.raw));
          continue;
        }
        const inside = parse(token.name);
        nodes.push(createElement(Fragment, { key: start }, render(inside, token.argument)));
      }
    }
    return nodes;
  }

  return parse(null);
}
