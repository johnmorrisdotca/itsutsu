import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { markup, type MarkupRenderer } from "./markup";

const renderers: Record<string, MarkupRenderer> = {
  em: (content) => createElement("em", null, content),
  game: (content, argument) => createElement("a", { href: `/games/${argument}` }, content),
};

const html = (text: string, parts: Record<string, string> = {}) =>
  renderToStaticMarkup(createElement(Fragment, null, markup(text, renderers, parts)));

describe("markup", () => {
  it("turns a tag into the node its renderer makes, with its argument", () => {
    expect(html("Play <game reversi>Othello</game> now")).toBe('Play <a href="/games/reversi">Othello</a> now');
  });

  it("nests, and fills a {name} between the tags", () => {
    expect(html("<game ninuki><em>Pente</em></game> in {year}", { year: "1977" })).toBe('<a href="/games/ninuki"><em>Pente</em></a> in 1977');
  });

  it("leaves a tag nobody supplied standing as it is written", () => {
    expect(html("a <jp>五</jp> b")).toBe("a &lt;jp&gt;五&lt;/jp&gt; b");
  });

  it("leaves text with no tags exactly as it was", () => {
    expect(html("Nothing to see.")).toBe("Nothing to see.");
  });
});
