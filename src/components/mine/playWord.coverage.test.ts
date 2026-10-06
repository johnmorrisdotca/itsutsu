import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PHRASES, type PhraseKey } from "@/lib/i18n/i18n.constants";

/**
 * ONE WORD FOR OFFERING SOMEBODY A GAME: PLAY (`mine.play`).
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

/** Superghost's challenge is a move with that name, inside a game already going: nothing is offered by it. */
const GHOST_MOVE = "Superghost's challenge, the move the game's rules are named for, made at a table already playing — not an offer of a game";

/** Hitotsu's challenge of a Wild Draw Four: a move in its game, the published rules' own word for it, not an offer of a game. */
const FOUR_MOVE = "Hitotsu's challenge of a Wild Draw Four, a move in the game";

const EXCEPTIONS: readonly { file: string; text: string; why: string }[] = [
  { file: "src/components/party/party.constants.ts", text: "or Add after — or challenge.", why: GHOST_MOVE },
  { file: "src/components/party/party.constants.ts", text: "Challenge", why: `${GHOST_MOVE}: the button, "Challenge" and "Challenge Ann"` },
  { file: "src/components/party/party.constants.ts", text: "Nothing to challenge until somebody adds a letter.", why: GHOST_MOVE },
  { file: "src/components/party/party.constants.ts", text: "${challenger} challenged ${name}.", why: GHOST_MOVE },
  { file: "src/components/party/party.constants.ts", text: "so ${challenger} takes a letter.", why: GHOST_MOVE },
  { file: "src/lib/party/party.constants.ts", text: "you may challenge the player who added the last one", why: `${GHOST_MOVE}, in its rules` },
  { file: "src/lib/party/party.constants.ts", text: "the challenger loses the round", why: `${GHOST_MOVE}, in its rules` },
  { file: "src/lib/i18n/phrases.about.constants.ts", text: "DeepMind Challenge Match", why: "the name of the 2016 match between Lee Sedol and AlphaGo, in the About page's picture description" },
  { file: "src/lib/i18n/dictionaries/ja.drafted.about.constants.ts", text: "DeepMind Challenge Match", why: "the same picture description's back-translation, which quotes the match's own name" },
  { file: "src/lib/party/partyRulesPage.ts", text: "or press Challenge. When challenged,", why: `${GHOST_MOVE}, on its rules page` },
  { file: "src/components/party/hitotsu/hitotsu.constants.ts", text: "May be challenged", why: `${FOUR_MOVE}: the house rule's tile` },
  { file: "src/components/party/hitotsu/hitotsu.constants.ts", text: "the next player may challenge.", why: FOUR_MOVE },
  { file: "src/components/party/hitotsu/hitotsu.constants.ts", text: "Only with nothing of the colour; no challenge.", why: FOUR_MOVE },
  { file: "src/components/party/hitotsu/hitotsu.constants.ts", text: "take the four, or challenge", why: FOUR_MOVE },
  { file: "src/components/party/hitotsu/hitotsu.constants.ts", text: "Challenge", why: `${FOUR_MOVE}: the button` },
  { file: "src/components/party/hitotsu/hitotsuPresses.ts", text: "challenged ${name(news.by)}, who", why: `${FOUR_MOVE}: what happened, over the table` },
  { file: "src/lib/party/hitotsu/hitotsu.copy.ts", text: "but they may challenge it.", why: `${FOUR_MOVE}, in its rules` },
  { file: "src/lib/party/partyRulesPage.ts", text: "or Challenge a Wild Draw Four.", why: `${FOUR_MOVE}, on its rules page` },
  { file: "src/lib/party/partyRulesPage.ts", text: "and it cannot be challenged.", why: `${FOUR_MOVE}, on its rules page` },
  // Where the English moved to (ENJA-08): the table of what each party game says on its rules page, and the Japanese beside the English, whose back-translation keeps the game's own word.
  { file: "src/lib/party/partyTableWords.ts", text: "or press Challenge. When challenged,", why: `${GHOST_MOVE}, on its rules page` },
  { file: "src/lib/party/partyTableWords.ts", text: "or Challenge a Wild Draw Four.", why: `${FOUR_MOVE}, on its rules page` },
  { file: "src/lib/party/partyTableWords.ts", text: "and it cannot be challenged.", why: `${FOUR_MOVE}, on its rules page` },
  { file: "src/lib/i18n/phrases.party.constants.ts", text: "challenged {by}, who", why: `${FOUR_MOVE}: what happened, over the table` },
  { file: "src/lib/i18n/dictionaries/ja.drafted.party.constants.ts", text: "challenged {by}.", why: `${FOUR_MOVE}: the English back-translation of what happened, over the table` },
  { file: "src/lib/i18n/dictionaries/party.ja.games.constants.ts", text: "you may challenge the person who added the last one", why: `${GHOST_MOVE}, in its rules (the English back-translation)` },
  { file: "src/lib/i18n/dictionaries/party.ja.games.constants.ts", text: "the challenger loses the round", why: `${GHOST_MOVE}, in its rules (the English back-translation)` },
  { file: "src/lib/i18n/dictionaries/party.ja.games.constants.ts", text: "but may challenge it", why: `${FOUR_MOVE}, in its rules (the English back-translation)` },
  { file: "src/lib/i18n/dictionaries/party.ja.screens.constants.ts", text: "or challenge.", why: `${GHOST_MOVE} (the English back-translation)` },
  { file: "src/lib/i18n/dictionaries/party.ja.screens.constants.ts", text: "Challenge", why: `${GHOST_MOVE}: the button (the English back-translation)` },
  { file: "src/lib/i18n/dictionaries/party.ja.screens.constants.ts", text: "nothing to challenge until", why: `${GHOST_MOVE} (the English back-translation)` },
  { file: "src/lib/i18n/dictionaries/party.ja.screens.constants.ts", text: "challenged {0}.", why: `${GHOST_MOVE} (the English back-translation)` },
  { file: "src/lib/i18n/dictionaries/party.ja.tableWords.constants.ts", text: "When challenged, type the word", why: `${GHOST_MOVE}, on its rules page (the English back-translation)` },
  { file: "src/lib/i18n/dictionaries/party.ja.tableWords.constants.ts", text: "it cannot be challenged.", why: `${FOUR_MOVE}, on its rules page (the English back-translation)` },
  { file: "src/lib/i18n/dictionaries/party.ja.tables.constants.ts", text: "May be challenged", why: `${FOUR_MOVE}: the house rule's tile (the English back-translation)` },
  { file: "src/lib/i18n/dictionaries/party.ja.tables.constants.ts", text: "the next person may challenge.", why: `${FOUR_MOVE} (the English back-translation)` },
  { file: "src/lib/i18n/dictionaries/party.ja.tables.constants.ts", text: "no challenge.", why: `${FOUR_MOVE} (the English back-translation)` },
  { file: "src/lib/i18n/dictionaries/party.ja.tables.constants.ts", text: "take the four, or challenge", why: `${FOUR_MOVE} (the English back-translation)` },
  { file: "src/lib/i18n/dictionaries/party.ja.tables.constants.ts", text: "Challenge", why: `${FOUR_MOVE}: the button (the English back-translation)` },
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
    expect(PHRASES["mine.play"]).toBe("Play");
    const button = FILES.find(({ path }) => path.endsWith(join("mine", "ChallengeButton.tsx")));
    expect(button?.source).toMatch(/label \?\? say\.say\("mine\.play"\)/);
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
      'Challenge and Play are the same act here, and the site says Play ("mine.play" in src/lib/i18n/phrases.mine.constants.ts). ' +
        "Reword each of these; if one truly is not about offering a game, add it to EXCEPTIONS with the reason.",
    ).toEqual([]);
  });

  it("starts with Play on every button that offers a game", () => {
    const found: string[] = [];
    for (const { path, source } of FILES) {
      for (const match of source.matchAll(/<ChallengeButton\b[^>]*?\/>/g)) {
        const label = /\blabel=\{?\s*([`"][^`"]*)/.exec(match[0])?.[1];
        if (label === undefined || /^[`"]Play\b/.test(label)) continue;
        // A label said through a phrase whose English starts with Play (`${say.say("replay.forkLabel", …)}`) starts with Play.
        const phrase = /\blabel=\{`\$\{say\.say\("([\w.]+)"/.exec(match[0])?.[1];
        if (phrase !== undefined && /^Play\b/.test(PHRASES[phrase as PhraseKey] ?? "")) continue;
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
