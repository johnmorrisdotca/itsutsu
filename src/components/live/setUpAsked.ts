import {
  HANDICAP_RULES,
  NO_HANDICAP,
  OBSTACLE_LAYOUTS,
  SECOND_STONE_EXCLUSIONS,
  STONES,
  boardSizesFor,
} from "@/lib/gomoku/gomoku.constants";
import type { Handicap, HandicapRule, OpeningRule, RuleVariant, Stone } from "@/lib/gomoku/gomoku.types";
import {
  NO_HANDICAP_ASKED,
  NO_PACE,
  RATED_WORDS,
  RESIGN_WORDS,
  SET_UP_PARAMS,
  variantFor,
} from "@/lib/gomoku/slugs";
import {
  MOVE_TIME_OPTIONS,
  SHARED_OPENINGS,
  TIMEOUT_PENALTIES,
} from "@/lib/history/gameSettingsSchema";

/** The most moves an address may name, matching the creation route's own ceiling. */
const MOVE_CEILING = 4096;

/** The paces the clock row offers, widened so an arbitrary number can be looked up in it. */
const PACES_OFFERED: readonly (number | null)[] = MOVE_TIME_OPTIONS;

/** As long an id as the creation route will accept for a game or a member. */
const ID_LIMIT = 64;

/**
 * WHAT AN ADDRESS ASKED THE SETUP SCREEN TO START FROM.
 *
 * Pure, and separate from the reading of any row, for the reason every parse on
 * this site is: a query string is somebody's typing. Every field here can be
 * edited in a browser bar, so each is checked against what the site actually
 * offers rather than trusted — a pace that is not one of the paces, a board that
 * is not a number, a move number past any game ever played. None of those is an
 * error worth a page: the screen simply has not been told that thing.
 *
 * A field that cannot be read comes back as "nothing was said", never as a
 * plausible value. That distinction is the whole of this module's care, and it
 * is why the pace is wrapped rather than nullable: `null` alone would have to
 * mean both "play with no clock" and "nobody mentioned the clock", and the
 * screen does opposite things with those two — keep it, or fall back to what
 * this member usually plays at.
 */
export type SetUpAsked = {
  /** A member id, for the opponent. */
  against: string | null;
  /** A finished game to play again. */
  rematch: string | null;
  /** A game and a position to carry out of it. */
  from: { id: string; move: number } | null;
  /** A board size somebody has already chosen. */
  board: number | null;
  /** Wrapped, because "no clock" and "nobody said" are different answers. */
  pace: { ms: number | null } | null;
  /**
   * THE REST OF A SETTLED GAME, where the address carries a whole one.
   *
   * Every field is null for "nobody said", and a value only where the address
   * named something the site actually offers. Nothing here is defaulted: a
   * default written in this module would be a choice nobody made, arriving at
   * the screen indistinguishable from a real one — and the screen has a real
   * answer for silence already, which is the member's own standing preference
   * or the game's own first board.
   */
  rules: AskedRules;
  /** A game to sit down at rather than make a second one beside. */
  sit: string | null;
};

/**
 * The rules an address named, each one separately absent.
 *
 * A partial of `RulesDraft` would say the same thing in fewer words and hide
 * the whole point: these are not a draft with gaps, they are a list of things
 * that either were or were not said. The two cases are different everywhere
 * this is read.
 */
export type AskedRules = {
  variant: RuleVariant | null;
  obstacles: string | null;
  opening: OpeningRule | null;
  clockMode: string | null;
  timeoutPenalty: string | null;
  rated: boolean | null;
  allowResign: boolean | null;
  handicap: Handicap | null;
};

/** One value from a query, or null where it is absent or repeated into an array. */
function one(asked: Record<string, string | string[] | undefined>, key: string): string | null {
  const value = asked[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" || trimmed.length > ID_LIMIT ? null : trimmed;
}

/** A whole number in a query, or null for anything that is not one. */
function whole(asked: Record<string, string | string[] | undefined>, key: string): number | null {
  const raw = one(asked, key);
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
}

export function readSetUpAsked(
  asked: Record<string, string | string[] | undefined>,
): SetUpAsked {
  const from = one(asked, SET_UP_PARAMS.from);
  const move = whole(asked, SET_UP_PARAMS.move);
  const board = whole(asked, SET_UP_PARAMS.board);
  const pace = one(asked, SET_UP_PARAMS.pace);
  const paceMs = pace === null ? null : Number(pace);

  return {
    against: one(asked, SET_UP_PARAMS.against),
    rematch: one(asked, SET_UP_PARAMS.rematch),
    /*
     * A fork with no readable move is not a fork from move nought — that is a
     * different game, and one somebody would notice. It is a fork this screen
     * was not told enough about, so it is no fork at all.
     */
    from:
      from === null || move === null || move < 0 || move > MOVE_CEILING
        ? null
        : { id: from, move },
    board: board !== null && board > 0 ? board : null,
    /*
     * Only a pace the site offers. `MOVE_TIME_OPTIONS` is the list the clock
     * row is built from, so anything else would put the select on a value it
     * is not offering — which shows as the first option and means the address
     * was ignored without saying so.
     */
    pace:
      pace === NO_PACE
        ? { ms: null }
        : pace !== null && Number.isInteger(paceMs) && PACES_OFFERED.includes(paceMs)
          ? { ms: paceMs }
          : null,
    rules: readAskedRules(asked),
    sit: one(asked, SET_UP_PARAMS.sit),
  };
}

/**
 * THE BOARD AN ADDRESS SETTLED at the game being set up, or null for "nobody
 * said".
 *
 * Said in one place because it was being decided in two — `setUpFrom` asked it
 * to pre-fill the draft, `askedOver` asked it again to lay the address over one
 * — and now in three, since the screen has to know whether the board in its
 * draft is a CHOICE or a DEFAULT. Three copies of one condition is two chances
 * for it to drift, and the third caller is the one that makes the difference
 * visible: a board that is only a default may be moved by what is on the
 * noticeboard, and a board somebody settled may not.
 *
 * Null for a size this game does not offer, rather than the game's first board:
 * `boardSizesFor` is what the picker draws, and an address naming something
 * outside it has said nothing readable about the board. Snapping instead would
 * move somebody from their usual 15×15 to 9×9 because a link had a typo in it.
 */
export function boardAsked(want: SetUpAsked, variant: RuleVariant): number | null {
  return want.board !== null && boardSizesFor(variant).includes(want.board) ? want.board : null;
}

/**
 * The rules an address named, each checked against what the site offers.
 *
 * Same care as everything above, for the same reason: this is read off an
 * address somebody can edit. A value that is not one of the site's own is not
 * a rule the screen has been told — it is a rule the screen has not been told,
 * and those are two different answers with two different fallbacks.
 */
function readAskedRules(asked: Record<string, string | string[] | undefined>): AskedRules {
  const game = one(asked, SET_UP_PARAMS.game);
  const opening = one(asked, SET_UP_PARAMS.opening);
  const blocks = one(asked, SET_UP_PARAMS.blocks);
  const clock = one(asked, SET_UP_PARAMS.clock);
  const penalty = one(asked, SET_UP_PARAMS.penalty);
  const rated = one(asked, SET_UP_PARAMS.rated);
  const resign = one(asked, SET_UP_PARAMS.resign);

  return {
    /*
     * By SLUG, the way the path names a game. The draft holds the variant key
     * and an address holds the slug — /games/new?game=misere-five rather than
     * ?game=misereFive — because an address is read by people, and because the
     * slug table exists so that renaming a variant key cannot move a page.
     */
    variant: game === null ? null : variantFor(game),
    obstacles:
      blocks !== null && Object.values(OBSTACLE_LAYOUTS).includes(blocks as never) ? blocks : null,
    opening:
      opening !== null && SHARED_OPENINGS.includes(opening as OpeningRule)
        ? (opening as OpeningRule)
        : null,
    clockMode: clock === "move" || clock === "game" ? clock : null,
    timeoutPenalty:
      penalty !== null && TIMEOUT_PENALTIES.includes(penalty as never) ? penalty : null,
    /*
     * Three states, not two. The word the site uses, or nothing — never `false`
     * standing in for an absent parameter, which is how a rated game would
     * become a friendly one by an address forgetting to mention it.
     */
    rated: rated === RATED_WORDS.rated ? true : rated === RATED_WORDS.friendly ? false : null,
    allowResign: resign === RESIGN_WORDS.yes ? true : resign === RESIGN_WORDS.no ? false : null,
    handicap: readHandicap(one(asked, SET_UP_PARAMS.handicap)),
  };
}

/**
 * A handicap said in one word: the colour carrying it, then the restrictions,
 * then the size of the centre its second stone must leave — `black-overline-3`.
 *
 * ONE UNREADABLE TOKEN THROWS THE WHOLE THING AWAY, rather than keeping the
 * half that parsed. A handicap is a set of restrictions on one player, and half
 * of one is a game neither side agreed to; answering "nobody said" sends the
 * screen back to its own default, which is the ordinary game. That is the safe
 * direction — it can only ever under-state — and the statement a reader is
 * shown comes from the same parse, so the words and the game cannot disagree.
 */
function readHandicap(raw: string | null): Handicap | null {
  if (raw === null) return null;
  /*
   * "Nobody is carrying one", said out loud — which is a different answer from an
   * absent parameter and has to be, or taking a handicap off on the doorstep and
   * pressing Change something would hand it straight back. See `NO_HANDICAP_ASKED`.
   */
  if (raw === NO_HANDICAP_ASKED) return NO_HANDICAP;
  const parts = raw.split("-").filter((part) => part !== "");
  const [colour, ...rest] = parts;
  if (colour !== STONES.black && colour !== STONES.white) return null;

  const handicap: Handicap = { ...NO_HANDICAP, stone: colour as Stone };
  for (const part of rest) {
    if (/^\d+$/.test(part)) {
      const reach = Number(part);
      if (!SECOND_STONE_EXCLUSIONS.includes(reach as never)) return null;
      handicap.secondStoneExclusion = reach;
      continue;
    }
    if (!HANDICAP_RULES.includes(part as HandicapRule)) return null;
    handicap[part as HandicapRule] = true;
  }
  return handicap;
}
