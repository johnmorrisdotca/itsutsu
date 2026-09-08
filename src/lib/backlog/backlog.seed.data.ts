import { BACKLOG_KINDS, BACKLOG_STATUSES } from "./backlog.constants";
import type { BacklogKind, BacklogStatus } from "./backlog.types";

/**
 * The board's opening position.
 *
 * Everything here was asked for in conversation and lived nowhere else, which
 * is the whole reason the board exists: a request raised in a chat window is
 * gone the moment the window is. These rows are that backlog, written down
 * once, with the finished ones kept so the board shows what "done" looks like
 * rather than starting as one long column of wants.
 *
 * Each row carries its own `key`, so seeding is idempotent, and the store only
 * writes this set into a board that is still empty: an item somebody dropped
 * must not reappear on the next render. Editing a row here after that changes
 * nothing already seeded — by then the item belongs to the board, and the
 * board, not this file, is the source of truth.
 */
export type BacklogSeedItem = {
  key: string;
  title: string;
  detail: string;
  kind: BacklogKind;
  status: BacklogStatus;
  askedBy: string;
};

export const BACKLOG_SEED: readonly BacklogSeedItem[] = [
  {
    key: "features-board",
    title: "A features board that can be added to and taken from",
    detail:
      "Somewhere every request lives after the conversation that raised it: what was asked for, what is planned, what is being built, what is in. This page. Once it is deployed, the rule is that work comes from here.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.building,
    askedBy: "John",
  },
  {
    key: "work-comes-from-the-board",
    title: "Make it the rule that work only comes from this board",
    detail:
      "Nothing gets built off a chat message any more. A request is written here first, moved to planned, and only then picked up — so what is being worked on is always readable by anyone, not just whoever was in the conversation.",
    kind: BACKLOG_KINDS.chore,
    status: BACKLOG_STATUSES.proposed,
    askedBy: "John",
  },
  {
    key: "distraction-free-viewing-mode",
    title: "A distraction-free mode that is remembered between visits",
    detail:
      "A way to strip the page back to the board and the moves — no nav, no panels, no side matter — and have that choice stick, so it does not have to be set again on the next game or the next day.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.proposed,
    askedBy: "John",
  },
  {
    key: "plain-text-list-of-every-game",
    title: "A plain-text list of every game, not one game at a time",
    detail:
      "The replay can already copy one game out as text (0.41.0). Wanted: the whole record in one plain-text listing — every game, its players, its result, its date — that can be selected, copied and kept outside the site.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.proposed,
    askedBy: "John",
  },
  {
    key: "go-as-a-game-family",
    title: "Go 囲碁 as a game family of its own",
    detail:
      "The board is already a go board. Territory, capture, ko and passing are a family that does not exist here yet, and it is the game the site's furniture is borrowed from. Full New Game Gate: rules copy, screenshot, family, tests, simulator checks.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.proposed,
    askedBy: "John",
  },
  {
    key: "checkers-as-a-game-family",
    title: "Checkers as a game family of its own",
    detail:
      "Draughts on the squares: stepping, jumping, forced captures, crowning. Halma (0.50.0) proved a piece-moving game fits the engine; checkers is the next one, with capture and promotion on top.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.proposed,
    askedBy: "John",
  },
  {
    key: "keyboard-navigation-on-the-move-scrubber",
    title: "Keyboard navigation on the move scrubber",
    detail:
      "Landed in 0.50.3: the arrow keys walk the record, on a replay and on the board, so a game can be read through without a hand on the pointer.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.done,
    askedBy: "John",
  },
  {
    key: "weekly-days-off-deadline-exemption",
    title: "A recurring weekly day off that deadlines honour",
    detail:
      "Distinct from the away range on the profile (0.45.0), which is a date span out of a yearly allowance. This is standing: name the days of the week you do not play, and deadlines in games that honour vacation skip them every week, without spending the allowance.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.proposed,
    askedBy: "John",
  },
  {
    key: "also-known-as-on-rules-pages",
    title: "An also-known-as section on every rules page",
    detail:
      "Most of these games are sold under several names, and a player arrives knowing one of them. List the other names a game goes by on its rules page, so somebody searching for the name they know lands in the right place. lib/legacy/gameAliases.ts already holds outside names for matching imported records — that table is where the copy starts.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.proposed,
    askedBy: "John",
  },
  {
    key: "wikipedia-link-and-origin-flag-on-rules-pages",
    title: "A Wikipedia link and a country of origin on rules pages",
    detail:
      "Each rules page already says where a game comes from in prose. Wanted alongside it: the flag of the country it came from, and a link out to the Wikipedia article, so the page can be checked against something outside the site.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.proposed,
    askedBy: "John",
  },
  {
    key: "standing-game-option-defaults-per-account",
    title: "Standing game options kept against the account",
    detail:
      "Board size, clock, rated or not, the advanced switches — set them once on the profile and every new game starts there, instead of setting the same options on every game on every device.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.proposed,
    askedBy: "John",
  },
  {
    key: "remembered-board-skin-per-account",
    title: "A board skin remembered against the account, not the browser",
    detail:
      "Kaya, shin-kaya, washi, sumi, matcha, the stone sets and the grid styles are chosen per game and kept in this browser's session. Wanted: the choice belongs to the member, so a phone and a laptop show the same board.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.proposed,
    askedBy: "John",
  },
  {
    key: "direct-messages-that-honour-the-ignore-list",
    title: "Direct messages between members, honouring the ignore list",
    detail:
      "Messages today live inside a shared game. Wanted: member to member, off the board, with the ignore list (0.40.0) applying in full — an ignored member cannot open a thread, and nothing they send is shown.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.proposed,
    askedBy: "John",
  },
  {
    key: "champions-page-per-game-ladders",
    title: "A champions page with a ladder for every game",
    detail: "Landed in 0.47.0: the best-rated player at each game, and each game's own ladder beneath it.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.done,
    askedBy: "John",
  },
  {
    key: "away-days-hold-deadlines",
    title: "Away days that hold a deadline open",
    detail: "Landed in 0.45.0: a range on the profile, three days a year, and deadlines wait for it unless the game ignores vacation.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.done,
    askedBy: "John",
  },
  {
    key: "halma-the-first-race-game",
    title: "Halma, a game with no lines in it",
    detail: "Landed in 0.50.0: the race across the board, on 16×16, 10×10 or 8×8, with jump chains and shaded camps.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.done,
    askedBy: "John",
  },
  {
    key: "ignore-a-member",
    title: "Ignore a member, and mute an opponent in one game",
    detail: "Landed in 0.40.0, and the ground the direct messages item stands on: an ignored member cannot challenge you and their messages are hidden.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.done,
    askedBy: "John",
  },
];
