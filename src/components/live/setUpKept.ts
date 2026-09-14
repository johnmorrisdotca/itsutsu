import { gamesPlayedBy } from "@/lib/bots/bots.constants";
import { DEFAULT_SETTINGS, boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { SET_UP_ARRIVAL_PARAMS, SET_UP_PARAMS } from "@/lib/gomoku/slugs";

import { ANYONE } from "./opponentOptions";
import { silentDraft } from "./plainDraft";
import { applyRulesChange, type RulesDraft } from "./rulesDraft";
import { draftParams } from "./setUpAddress";
import { boardAsked, type SetUpAsked } from "./setUpAsked";
import type { KeptBase, SetUpParam } from "./setUp.types";

/**
 * THE SET-UP SCREEN KEEPS ITS CHOICES IN ITS OWN ADDRESS.
 *
 * John, with Checkers chosen on /games/new: "We need Memory when viewing Gaming
 * pages... a refresh loses the Checkers selections..." The screen held every
 * choice in React state and nothing else, so a reload, a Back from the doorstep
 * or a copied link opened the ordinary game again.
 *
 * The address already knew how to carry a whole draft — the doorstep and its
 * "Change something" do (`setUpAddress.ts` writes, `setUpAsked.ts` reads). This
 * module points the same two halves at the set-up screen itself: the screen
 * starts FROM its address (`keptDraft`), and every choice is written back INTO
 * it (`keptParams`, written by `useKeptAddress`).
 *
 * WHAT IS LEFT OUT, AND WHY IT IS SAFE TO LEAVE OUT. A choice that equals what
 * the screen would open with for silence is not written, so a plain game stays a
 * plain address — /games/new?game=checkers, not a dozen parameters. That is only
 * safe if "silence" is computed the one way the server computes it, so it is:
 * `silentFor` and `silentVariant` here are what `setUpFrom` opens with too. For a
 * rematch or a fork silence is the game as it was played, so a changed rule is
 * written and an unchanged one is not.
 */

/** Only these settings are a fork's own; the rest come with the position. */
const FORK_OWN: readonly string[] = [
  SET_UP_PARAMS.pace,
  SET_UP_PARAMS.clock,
  SET_UP_PARAMS.penalty,
  SET_UP_PARAMS.rated,
  SET_UP_PARAMS.resign,
];

/**
 * The game this screen opens at when the address does not name one.
 *
 * The same order `setUpFrom` decides it in: the game being repeated or carried
 * on from, then the game the path names, then the one game a named specialist
 * program plays, then the site's default. `gamesPlayedBy` answers nothing for a
 * person, which is the server's "not a computer player" said without a row.
 */
export function silentVariant(base: KeptBase, against: string | null): RuleVariant {
  if (base.asPlayed !== null) return base.asPlayed.variant as RuleVariant;
  if (base.pathVariant !== null) return base.pathVariant;
  return (against === null ? undefined : gamesPlayedBy(against)[0]) ?? (DEFAULT_SETTINGS.variant as RuleVariant);
}

/** What silence opens a game at, for this reader: the game as played, or their own usual board and clock. */
export function silentFor(base: KeptBase, variant: RuleVariant): RulesDraft {
  return base.asPlayed !== null
    ? applyRulesChange(base.asPlayed, { variant })
    : silentDraft({ variant, defaults: base.defaults });
}

/**
 * A DRAFT WITH WHATEVER THE ADDRESS ACTUALLY SAID LAID OVER IT.
 *
 * The five parameters this screen started with were a head start on a form
 * somebody was still going to fill in. The doorstep needs the other thing: an
 * address that carries a FINISHED draft, both so that the page after this one
 * can state it and so that "change something" lands back here with every answer
 * still made. A round trip that dropped a field would put a game somebody had
 * not agreed to in front of them, looking exactly like one they had.
 *
 * Each field is laid over only where the address said something — `AskedRules`
 * keeps "said nothing" and "said this" apart precisely so this can. And it goes
 * through `applyRulesChange`, so a game and a board that cannot sit together are
 * brought into line here, the same way they are when somebody moves a control.
 *
 * A FORK IS THE EXCEPTION, and it is the same exception the creation route
 * makes. The board, the game, the obstacles, the opening and the handicap come
 * with the POSITION and are not anybody's to change — replaying the copied moves
 * onto another board would not be that position. So only the pace settings are
 * honoured, which is exactly the set `FORK_PACE_SETTINGS` names and the route
 * already lets a caller settle.
 *
 * Moved here from `setUpFrom.ts` so the browser can run it too: the screen now
 * starts from its address on the client as well, which is what a Back into it
 * needs — see `keptDraft`.
 */
export function askedOver(initial: RulesDraft, want: SetUpAsked, forked = false): RulesDraft {
  const said = want.rules;
  const pace: Partial<RulesDraft> = {
    ...(want.pace !== null ? { moveTimeMs: want.pace.ms } : {}),
    ...(said.clockMode !== null ? { clockMode: said.clockMode } : {}),
    ...(said.timeoutPenalty !== null ? { timeoutPenalty: said.timeoutPenalty } : {}),
    ...(said.allowResign !== null ? { allowResign: said.allowResign } : {}),
    ...(said.rated !== null ? { rated: said.rated } : {}),
  };
  if (forked) return applyRulesChange(initial, pace);

  /*
   * A BOARD ONLY WHERE THE GAME BEING ASKED FOR ACTUALLY OFFERS IT. Snapping
   * instead would quietly move somebody from their usual 15×15 to 9×9 because a
   * link had a typo in it; an unreadable board is silence, and silence is the
   * member's own standing board.
   */
  const variant = said.variant ?? (initial.variant as RuleVariant);
  const board = boardAsked(want, variant);

  return applyRulesChange(initial, {
    ...(said.variant !== null ? { variant: said.variant } : {}),
    ...(board !== null ? { size: board } : {}),
    ...(said.obstacles !== null ? { obstacles: said.obstacles } : {}),
    ...(said.opening !== null ? { opening: said.opening } : {}),
    ...(said.handicap !== null ? { handicap: said.handicap } : {}),
    ...pace,
  });
}

/**
 * THE DRAFT THE SCREEN STARTS WITH, READ OFF ITS ADDRESS.
 *
 * On the server this is what `setUpFrom` hands over. In the browser it is asked
 * again from the address as it is NOW — because a Back into this screen is
 * answered from the router's cache, which holds the page as it was first
 * rendered, before any choice moved the address. Starting from the props would
 * put the old game back under an address that names the new one.
 */
export function keptDraft(base: KeptBase, asked: SetUpAsked): RulesDraft {
  return askedOver(silentFor(base, silentVariant(base, asked.against)), asked, base.forked);
}

/** The board the address settled, which is a choice rather than a default — see `SetUpFrom.boardChosen`. */
export function keptBoardChosen(base: KeptBase, asked: SetUpAsked, draft: RulesDraft): number | null {
  return base.forked ? null : boardAsked(asked, draft.variant as RuleVariant);
}

/**
 * THE SCREEN'S CHOICES AS THE ADDRESS WILL CARRY THEM, with what silence would
 * give back left out.
 *
 * - The GAME only where the screen chooses one, and only where it is not the
 *   game silence opens at.
 * - The BOARD where somebody clicked one this game offers — a clicked board is a
 *   choice, and a chosen board is the one a seat on the noticeboard may not move
 *   (`matchSeat`) — or where the draft's board is not the one silence gives.
 * - Every other rule where it differs from silence; on a fork, only the rules
 *   that are the new game's own.
 * - The OPPONENT by member id. On a rematch silence is the person played, so
 *   choosing somebody else is written, and so is choosing nobody: `anyone`.
 */
export function keptParams(
  base: KeptBase,
  {
    rules,
    boardChosen,
    against,
    chooseGame,
  }: { rules: RulesDraft; boardChosen: number | null; against: string | null; chooseGame: boolean },
): SetUpParam[] {
  const variant = rules.variant as RuleVariant;
  const who = base.forked
    ? null
    : base.asPlayed !== null
      ? against === base.silentOpponent
        ? null
        : (against ?? ANYONE)
      : against;
  const quiet = silentFor(base, variant);
  const still = draftParams(quiet);

  const out: SetUpParam[] = [];
  for (const [at, [name, value]] of draftParams(rules).entries()) {
    if (base.forked && !FORK_OWN.includes(name)) continue;
    if (name === SET_UP_PARAMS.game) {
      if (chooseGame && variant !== silentVariant(base, base.asPlayed === null ? who : null)) out.push([name, value]);
      continue;
    }
    if (name === SET_UP_PARAMS.board) {
      const held = boardChosen !== null && boardSizesFor(variant).includes(boardChosen);
      if (held || rules.size !== quiet.size) out.push([name, String(held ? boardChosen : rules.size)]);
      continue;
    }
    if (value !== still[at][1]) out.push([name, value]);
  }
  if (who !== null) out.push([SET_UP_PARAMS.against, who]);
  return out;
}

/**
 * The address to write: this path, what the screen was OPENED from (a rematch,
 * a fork) kept as it arrived, and the choices after it. Anything else in the old
 * query — a value this screen could not read — is not carried on.
 */
export function keptHref(pathname: string, search: string, params: readonly SetUpParam[]): string {
  const was = new URLSearchParams(search);
  const next = new URLSearchParams();
  for (const name of SET_UP_ARRIVAL_PARAMS) {
    const value = was.get(name);
    if (value !== null) next.set(name, value);
  }
  for (const [name, value] of params) next.set(name, value);
  const query = next.toString();
  return query === "" ? pathname : `${pathname}?${query}`;
}

/** A browser's search params in the shape a page's `searchParams` has, repeated keys as arrays. */
export function queryRecord(query: Pick<URLSearchParams, "keys" | "getAll">): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const name of new Set(query.keys())) {
    const all = query.getAll(name);
    out[name] = all.length === 1 ? all[0] : all;
  }
  return out;
}

/**
 * THE PARTS OF AN ADDRESS THE SCREEN COULD NOT USE, by their address names.
 *
 * `setUpAsked` answers an unreadable value with "nobody said", which is the
 * safe direction — but it said so to nobody, and a reader who followed a link
 * naming a 99×99 board then saw their usual board with no hint that the link
 * had asked for anything. So each parameter that was present and did not become
 * the draft is named, and the screen says so (`SET_UP_UNREAD`). A value that was
 * read but could not sit with the game — an opening that game does not have — is
 * named too, because it did not become the draft either.
 *
 * Not on a fork for the rules that come with the position: those are ignored on
 * purpose, and "Change something" writes them.
 */
export function unreadAsked(
  asked: Record<string, string | string[] | undefined>,
  want: SetUpAsked,
  draft: RulesDraft,
  forked: boolean,
): string[] {
  const said = want.rules;
  const checks: [string, boolean][] = [
    [SET_UP_PARAMS.game, !forked && said.variant === null],
    [SET_UP_PARAMS.board, !forked && want.board !== draft.size],
    [SET_UP_PARAMS.blocks, !forked && said.obstacles !== draft.obstacles],
    [SET_UP_PARAMS.opening, !forked && said.opening !== draft.opening],
    [SET_UP_PARAMS.pace, want.pace === null],
    [SET_UP_PARAMS.clock, said.clockMode === null],
    [SET_UP_PARAMS.penalty, said.timeoutPenalty === null],
    [SET_UP_PARAMS.rated, said.rated === null],
    [SET_UP_PARAMS.resign, said.allowResign === null],
    [SET_UP_PARAMS.handicap, !forked && said.handicap === null],
  ];
  return checks.filter(([name, unread]) => asked[name] !== undefined && unread).map(([name]) => name);
}
