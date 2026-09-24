import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PLAY } from "./mine.constants";

/**
 * ONE WORD FOR OFFERING SOMEBODY A GAME: PLAY.
 *
 * The same link, to the same set-up screen against the same person, was
 * "Challenge" on the members list and the people here now, "Ask for a game" on
 * a player's page, and "Play" beside a computer and a buddy. John, 2026-09-24:
 * "does Challenge and Play mean the same thing??? If so, why use 2 different
 * words. Play is shorter. Test for this!"
 *
 * So this fails the build on two things:
 *
 * - "challenge" in anything a reader is shown: a string, or the text of a
 *   page. The code still says `challenge` for the field, the test id and the
 *   award's key, and comments may explain history; neither is read on the site.
 * - a `ChallengeButton` given a label that does not start with "Play". A plain
 *   offer passes no label at all; a rematch or a fork says what it carries, as
 *   "Play again as Black" and "Play from move 12" do.
 *
 * An exception is a line here with its reason beside it: a proper name, and
 * two sentences of history that use the word in another sense.
 */

const EXCEPTIONS: readonly { file: string; text: string; why: string }[] = [
  {
    file: "src/lib/famous/famousGames.data.ts",
    text: "Google DeepMind Challenge Match",
    why: "the event's own name, printed as the record gives it",
  },
  {
    file: "src/app/about/about.shots.ts",
    text: "Google DeepMind Challenge Match",
    why: "the same event's name, in the caption of the Famous games screenshot",
  },
  {
    file: "src/app/about/about.constants.tsx",
    text: "You challenged the player above you",
    why: "how the old turn-based sites' ladders worked, in their own word; nothing here is offered by it",
  },
  {
    file: "src/app/about/about.more.tsx",
    text: "the strongest challenges coming from",
    why: "rivals in renju's history, not an offer of a game",
  },
];

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(path);
  }
  return out;
}

/** The source with its comments blanked, keeping line numbers. */
function withoutComments(source: string): string {
  const blank = (text: string) => text.replace(/[^\n]/g, " ");
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .split("\n")
    .map((line) => line.replace(/(^|[\s;,{}()])\/\/.*$/, "$1"))
    .join("\n");
}

const WORD = /\b[Cc]halleng(e|es|ed|er|ers|ing)\b/;

/** A string literal, or JSX text between tags, that a reader could be shown. */
function shownText(line: string): string[] {
  const literals = [...line.matchAll(/"([^"\n]*)"|'([^'\n]*)'|`([^`\n]*)`/g)].map((m) => m[1] ?? m[2] ?? m[3] ?? "");
  const rest = line.replace(/"[^"\n]*"|'[^'\n]*'|`[^`\n]*`/g, '""');
  // Prose left outside quotes is JSX text: the word between words, or alone
  // between tags. Code names it only as a bare identifier (`challenge ?`,
  // `{ challenge = false }`), which is never followed by another word.
  const prose = [
    ...rest.matchAll(/(?:^\s*|[A-Za-z][,.;:!?]? |[.;:!?] )[Cc]halleng\w* [a-z]\w*/g),
    ...rest.matchAll(/(?:^|>)\s*[Cc]halleng\w*\s*(?:$|<)/g),
  ].map(() => line.trim());
  // A literal that is one bare word is a key, a field or a test id, not copy.
  return [...literals.filter((text) => /\s/.test(text) || /^Challeng/.test(text)), ...prose];
}

const FILES = filesUnder("src").map((path) => ({ path, source: readFileSync(path, "utf8") }));

describe("the word for offering a game", () => {
  it("is Play, the default label of the one button that offers one", () => {
    expect(PLAY).toBe("Play");
    const button = FILES.find(({ path }) => path.endsWith(join("mine", "ChallengeButton.tsx")));
    expect(button?.source).toMatch(/label = PLAY,/);
  });

  it("is never Challenge in anything a reader is shown", () => {
    const found: string[] = [];
    for (const { path, source } of FILES) {
      withoutComments(source)
        .split("\n")
        .forEach((line, index) => {
          if (/console\.(log|warn|error|info)\(/.test(line)) return;
          for (const text of shownText(line)) {
            if (!WORD.test(text)) continue;
            if (EXCEPTIONS.some((ok) => path === ok.file && text.includes(ok.text))) continue;
            found.push(`${path}:${index + 1}: "${text.trim()}"`);
          }
        });
    }
    expect(
      found,
      'Challenge and Play are the same act here, and the site says Play (PLAY in src/components/mine/mine.constants.ts). ' +
        "Reword each of these; if one truly is not about offering a game, add it to EXCEPTIONS with the reason.",
    ).toEqual([]);
  });

  it("starts with Play on every button that offers a game", () => {
    const found: string[] = [];
    for (const { path, source } of FILES) {
      for (const match of source.matchAll(/<ChallengeButton\b[^>]*?\/>/g)) {
        const label = /\blabel=\{?\s*([`"][^`"]*)/.exec(match[0])?.[1];
        if (label === undefined || /^[`"]Play\b/.test(label)) continue;
        const line = source.slice(0, match.index).split("\n").length;
        found.push(`${path}:${line}: label ${label}…`);
      }
    }
    expect(
      found,
      "A ChallengeButton offering a plain game passes no label, so it says Play. One carrying more (a rematch, a fork) " +
        'starts with "Play" and says what it carries.',
    ).toEqual([]);
  });
});
