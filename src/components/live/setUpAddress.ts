import { HANDICAP_RULES } from "@/lib/gomoku/gomoku.constants";
import type { Handicap } from "@/lib/gomoku/gomoku.types";
import {
  NO_HANDICAP_ASKED,
  NO_PACE,
  RATED_WORDS,
  RESIGN_WORDS,
  SET_UP_PARAMS,
  beginPath,
  setUpPath,
  slugFor,
} from "@/lib/gomoku/slugs";
import type { RulesDraft } from "./rulesDraft";

/**
 * WRITING A SETTLED GAME INTO AN ADDRESS.
 *
 * The reading half is `setUpAsked.ts`; this is the writing half, and the two
 * are a pair. `readSetUpAsked(draftParams(draft))` gives the draft back — that
 * is the property the doorstep rests on, it is tested, and it is why "change
 * something" can promise every choice is still made.
 *
 * WHY AN ADDRESS AT ALL, rather than a store or a cookie. The doorstep is the
 * page between choosing a game and playing one, and it must survive a reload,
 * a second tab and a link sent to somebody — because a person who has just
 * been asked to confirm something is exactly the person who will reload it,
 * read it twice, or leave it for a minute. A draft in a store would leave that
 * page meaning nothing on arrival; a draft in a cookie would make one address
 * mean different things to two readers and leave nothing for a spec to name.
 * The same reasoning `SET_UP_PARAMS` was introduced with, one page further on.
 *
 * EVERY FIELD IS WRITTEN, ALWAYS, even the ordinary ones. An absent parameter
 * means "nobody said", and the screens answer silence by falling back — to a
 * member's usual clock, to the handicap a rematched game carried. So a draft
 * with gaps in it is a draft whose gaps get filled in by something else, and
 * the choice that gets reversed is invisible: the address looks fine and the
 * game is not the one that was agreed. A statement has no gaps.
 */

/** One rule of a game, as an address says it. */
type Param = [name: string, value: string];

/**
 * The whole of a draft, as query parameters.
 *
 * `open` is deliberately not here. Whether a seat is posted is not a rule of
 * the game — it is decided by whether anybody has been named to play it, which
 * the `against`, `rematch`, `from` and `sit` parameters already say. Carrying
 * it as well would give two answers to one question, and `creationFor`
 * overrules this one anyway.
 */
export function draftParams(draft: RulesDraft): Param[] {
  return [
    [SET_UP_PARAMS.game, slugFor(draft.variant)],
    [SET_UP_PARAMS.board, String(draft.size)],
    [SET_UP_PARAMS.blocks, draft.obstacles],
    [SET_UP_PARAMS.opening, draft.opening],
    [SET_UP_PARAMS.pace, draft.moveTimeMs === null ? NO_PACE : String(draft.moveTimeMs)],
    [SET_UP_PARAMS.clock, draft.clockMode],
    [SET_UP_PARAMS.penalty, draft.timeoutPenalty],
    [SET_UP_PARAMS.rated, draft.rated ? RATED_WORDS.rated : RATED_WORDS.friendly],
    [SET_UP_PARAMS.resign, draft.allowResign ? RESIGN_WORDS.yes : RESIGN_WORDS.no],
    [SET_UP_PARAMS.handicap, handicapWord(draft.handicap)],
  ];
}

/**
 * A handicap in one hyphenated word: the colour, its restrictions, and the
 * half-width of the centre its second stone must leave.
 *
 * Hyphens rather than commas or colons because those are percent-encoded and
 * this ends up in an address bar that a person may read out. The exclusion goes
 * last and is the only numeric token, which is what lets the reader tell it
 * from a rule name without a second separator.
 */
function handicapWord(handicap: Handicap): string {
  if (handicap.stone === null) return NO_HANDICAP_ASKED;
  const parts = [handicap.stone as string, ...HANDICAP_RULES.filter((rule) => handicap[rule])];
  if (handicap.secondStoneExclusion > 0) parts.push(String(handicap.secondStoneExclusion));
  return parts.join("-");
}

/**
 * What a draft came FROM, where it came from something: a person named, a
 * finished game being repeated, a position being carried, a posted seat being
 * taken. None of it is a rule of the game, and all of it has to travel.
 */
export type SetUpKnown = {
  against?: string | null;
  rematch?: string | null;
  from?: { id: string; move: number } | null;
  /** A seat on the noticeboard this will take rather than post a second one. */
  sit?: string | null;
};

function knownParams(known: SetUpKnown): Param[] {
  const out: Param[] = [];
  if (known.against) out.push([SET_UP_PARAMS.against, known.against]);
  if (known.rematch) out.push([SET_UP_PARAMS.rematch, known.rematch]);
  if (known.from) {
    out.push([SET_UP_PARAMS.from, known.from.id]);
    out.push([SET_UP_PARAMS.move, String(known.from.move)]);
  }
  if (known.sit) out.push([SET_UP_PARAMS.sit, known.sit]);
  return out;
}

function withQuery(base: string, params: Param[]): string {
  const query = new URLSearchParams();
  for (const [name, value] of params) query.set(name, value);
  const asked = query.toString();
  return asked === "" ? base : `${base}?${asked}`;
}

/**
 * THE DOORSTEP'S OWN ADDRESS: /games/<game>/begin, and the game in full.
 *
 * The game is in the path because on this page it is settled — the doorstep is
 * a statement about one particular game, and identity goes in the path here.
 * The `game` parameter rides along anyway, because the way back points the same
 * query at /games/new, where the game is a choice again and needs filling in.
 * One query, read by both pages, so there is nothing to keep in step.
 */
export function beginLink(draft: RulesDraft, known: SetUpKnown = {}): string {
  return withQuery(beginPath(draft.variant), [...draftParams(draft), ...knownParams(known)]);
}

/**
 * THE WAY BACK. Not a browser back — a link, so it works from an address
 * somebody reloaded, bookmarked or was sent.
 *
 * WHERE IT GOES IS A RULE RATHER THAN A FLAG. A fork carries a POSITION, and a
 * position belongs to the game it was played in: offering to make a Reversi
 * position a Halma one is a control whose answer the creation route is right to
 * throw away. So a fork goes back to the address that names its game, and
 * everything else goes to /games/new, where the game is still a choice.
 *
 * That second branch is the one worth arguing for. Somebody who chose Reversi
 * on the setup screen and then pressed Change something has just chosen the
 * game — it is the likeliest thing they want to change, and a "change
 * something" that cannot change it is the dead end this site has a gate about.
 * Nothing is lost by it either: the game they picked arrives chosen, in the
 * `game` parameter, along with every other answer.
 */
export function changeLink(draft: RulesDraft, known: SetUpKnown = {}): string {
  const params = [...draftParams(draft), ...knownParams(known)];
  return known.from
    ? withQuery(setUpPath(draft.variant), params)
    : withQuery("/games/new", params);
}
