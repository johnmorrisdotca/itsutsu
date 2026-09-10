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
    status: BACKLOG_STATUSES.inProgress,
    askedBy: "John",
  },
  {
    key: "work-comes-from-the-board",
    title: "Make it the rule that work only comes from this board",
    detail:
      "Nothing gets built off a chat message any more. A request is written here first, moved to planned, and only then picked up — so what is being worked on is always readable by anyone, not just whoever was in the conversation.",
    kind: BACKLOG_KINDS.chore,
    status: BACKLOG_STATUSES.open,
    askedBy: "John",
  },
  {
    key: "distraction-free-viewing-mode",
    title: "A distraction-free mode that is remembered between visits",
    detail:
      "A way to strip the page back to the board and the moves — no nav, no panels, no side matter — and have that choice stick, so it does not have to be set again on the next game or the next day.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.open,
    askedBy: "John",
  },
  {
    key: "plain-text-list-of-every-game",
    title: "A plain-text list of every game, not one game at a time",
    detail:
      "The replay can already copy one game out as text (0.41.0). Wanted: the whole record in one plain-text listing — every game, its players, its result, its date — that can be selected, copied and kept outside the site.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.open,
    askedBy: "John",
  },
  {
    key: "go-as-a-game-family",
    title: "Go 囲碁 as a game family of its own",
    detail:
      "The board is already a go board. Territory, capture, ko and passing are a family that does not exist here yet, and it is the game the site's furniture is borrowed from. Full New Game Gate: rules copy, screenshot, family, tests, simulator checks.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.open,
    askedBy: "John",
  },
  {
    key: "checkers-as-a-game-family",
    title: "Checkers as a game family of its own",
    detail:
      "Draughts on the squares: stepping, jumping, forced captures, crowning. Halma (0.50.0) proved a piece-moving game fits the engine; checkers is the next one, with capture and promotion on top.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.open,
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
    status: BACKLOG_STATUSES.open,
    askedBy: "John",
  },
  {
    key: "also-known-as-on-rules-pages",
    title: "An also-known-as section on every rules page",
    detail:
      "Most of these games are sold under several names, and a player arrives knowing one of them. List the other names a game goes by on its rules page, so somebody searching for the name they know lands in the right place. lib/legacy/gameAliases.ts already holds outside names for matching imported records — that table is where the copy starts.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.open,
    askedBy: "John",
  },
  {
    key: "wikipedia-link-and-origin-flag-on-rules-pages",
    title: "A Wikipedia link and a country of origin on rules pages",
    detail:
      "Each rules page already says where a game comes from in prose. Wanted alongside it: the flag of the country it came from, and a link out to the Wikipedia article, so the page can be checked against something outside the site.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.open,
    askedBy: "John",
  },
  {
    key: "standing-game-option-defaults-per-account",
    title: "Standing game options kept against the account",
    detail:
      "Board size, clock, rated or not, the advanced switches — set them once on the profile and every new game starts there, instead of setting the same options on every game on every device.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.open,
    askedBy: "John",
  },
  {
    key: "remembered-board-skin-per-account",
    title: "A board skin remembered against the account, not the browser",
    detail:
      "Kaya, shin-kaya, washi, sumi, matcha, the stone sets and the grid styles are chosen per game and kept in this browser's session. Wanted: the choice belongs to the member, so a phone and a laptop show the same board.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.open,
    askedBy: "John",
  },
  {
    key: "direct-messages-that-honour-the-ignore-list",
    title: "Direct messages between members, honouring the ignore list",
    detail:
      "Messages today live inside a shared game. Wanted: member to member, off the board, with the ignore list (0.40.0) applying in full — an ignored member cannot open a thread, and nothing they send is shown.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.open,
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
  {
    key: "start-a-game-redesigned-as-one-sentence",
    title: "Start a game as one sentence, not five cards",
    detail:
      "The lobby offers auto-match, the waiting room, posting a seat and challenging a member as four separate cards, which is the same act said four ways. Wanted instead: one sentence over one board — play this game, at this pace, with anyone or whoever is here or a buddy — and the button says what will happen when it is pressed.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.inProgress,
    askedBy: "John",
  },
  {
    key: "hex-on-a-hexagonal-board",
    title: "Hex ヘックス, on a rhombus of hexagons",
    detail:
      "Connect your two opposite edges with an unbroken chain. A new board topology — six neighbours to a cell rather than four or eight — but no captures and no movement, so it is nearer Toroidal Five than Halma in size. A draw is impossible on a full board, which is a fact worth stating on its rules page. The swap rule we already have answers the first player's advantage.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.open,
    askedBy: "John",
  },
  {
    key: "a-game-that-ends-in-a-draw-by-move-count",
    title: "A draw when nobody has won by a share of the board",
    detail:
      "Some games can run forever between two careful players. A per-game setting, with two presets: no winner by half the board's points, or by three quarters of them, and the game is a draw. A fraction of the board rather than a fixed number, so it needs no arithmetic per size.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.open,
    askedBy: "John",
  },
  {
    key: "filters-on-the-waiting-room",
    title: "Filters on the waiting room, and a flag beside a name",
    detail:
      "Posted seats arrive as one list. Wanted: narrow them by the time limit, by the opponent's rating, and by what a missed deadline costs — and show each member's country as a small flag beside their name, as the older sites did.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.open,
    askedBy: "John",
  },
  {
    key: "how-long-finished-games-stay-in-my-list",
    title: "Choose how long a finished game stays in your own list",
    detail:
      "A member's own game list keeps every finished game forever, and fills up. Wanted: a setting for how many days a finished game stays there — a fortnight, say — with the record itself keeping everything as it always has.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.open,
    askedBy: "John",
  },
  {
    key: "seed-members-who-play-every-variant",
    title: "Seed ordinary members who play every game",
    detail:
      "Ratings, champions and the record are all empty on a new site, so nothing can be judged by looking at it. Wanted: a script that makes members of about average strength and has them play a handful of games of every variant, so the ladders and the lists have something honest in them.",
    kind: BACKLOG_KINDS.chore,
    status: BACKLOG_STATUSES.open,
    askedBy: "John",
  },
  {
    key: "gomoku-roku-needs-a-rules-source",
    title: "Gomoku Roku, once there is a rules source for it",
    detail:
      "A small-press hex-board game of five in a row that John found. It places and moves stones, so it is Halma-sized rather than a spec row, and the only site with the rules blocks us from reading them. Held until a source can be read rather than guessed at.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.open,
    askedBy: "John",
  },
  {
    key: "grand-reversi-on-a-bigger-board",
    title: "Grand Reversi 大リバーシ, the flipping game on ten by ten",
    detail: "Landed in 0.48.0: the board ItsYourTurn called Flipversi 10x10, thirty-six squares larger than the usual one.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.done,
    askedBy: "John",
  },
  {
    key: "the-plain-game-is-called-gomoku",
    title: "Call the plain game Gomoku, not Freestyle",
    detail: "Landed in 0.51.0: the plain name belongs to the plain game, as GoldToken has it, and the exact-five form became Tournament Gomoku. Labels only; no address changed.",
    kind: BACKLOG_KINDS.chore,
    status: BACKLOG_STATUSES.done,
    askedBy: "John",
  },
  {
    key: "every-game-on-one-page",
    title: "Every game and variant on one plain page",
    detail: "Landed in 0.51.0 at /games/all: every game, family by family, with what each one is and the names the other sites gave it.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.done,
    askedBy: "John",
  },
  {
    key: "every-name-is-a-link",
    title: "Every name the site prints leads to that player",
    detail: "Landed in 0.52.0: a member has a page from the day they join, the lists all link to it, and a test walks them and fails if any name is printed without a link.",
    kind: BACKLOG_KINDS.fix,
    status: BACKLOG_STATUSES.done,
    askedBy: "John",
  },
  {
    key: "clear-the-games-from-before-sign-in",
    title: "Clear the test games from before sign-in existed",
    detail: "Done on 2026-09-08: six games with no names on either seat, left over from before Google sign-in, were removed from the record.",
    kind: BACKLOG_KINDS.chore,
    status: BACKLOG_STATUSES.done,
    askedBy: "John",
  },
  {
    key: "artwork-from-real-games",
    title: "A visual tab on each game's page, made from real games of it",
    detail:
      "Each game's own page gets an artwork tab or section built from actual past games of that variant \u2014 a wallpaper or mosaic of real recent board states rather than a stock image. John's framing: \"it's like a visual tab for that game... would be really cool.\" The screenshots we already generate are one staged board each; this would be the real record made visible, and it would change as the game is played. Exploratory rather than urgent.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.open,
    askedBy: "John",
  },
  {
    key: "speak-more-than-one-language",
    title: "The site speaks more than one language",
    detail:
      "Full i18n \u2014 English, Spanish, Japanese, Chinese, German and the other majority languages, simple design, with wazadb.com as the model. Big enough to plan rather than start. John has settled the design question it turns on: the pattern is LOCALE + JP. The kanji stays put whatever language is chosen, and the English half beside it is the half that switches \u2014 \"Players \u5bfe\u5c40\u8005\" becomes \"Jugadores \u5bfe\u5c40\u8005\". The scope is exactly that: wherever English and kanji already sit side by side today IS the surface to translate. The kanji is his heritage and part of the site's voice, not decoration to be localised away \u2014 see the About page. One question is open and is his to answer when this is scoped: whether Chinese pairs with the kanji at all, or shows on its own. His words were \"if chinese perhaps just show CHIN\" \u2014 two Han scripts stacked may read as redundant rather than as flavour.",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.open,
    askedBy: "John",
  },
];
