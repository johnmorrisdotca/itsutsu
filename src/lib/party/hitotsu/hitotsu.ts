// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { HITOTSU_CAUGHT, HITOTSU_CHALLENGE_LOST, HITOTSU_CLASSIC, HITOTSU_COLOURS, HITOTSU_ONE_HAND, HITOTSU_SIZES } from "./hitotsu.constants";
import type { HitotsuCard, HitotsuColour, HitotsuGame, HitotsuMove, HitotsuNews, HitotsuOptions } from "./hitotsu.types";
import {
  DRAW_TWO,
  REVERSE,
  SKIP,
  WILD_FOUR,
  colourOf,
  faceOf,
  hitotsuPoints,
  identical,
  isDrawCard,
  isNumber,
  isWild,
  reshuffledHitotsu,
  shuffledHitotsu,
  sortHitotsu,
} from "./hitotsuDeck";

/**
 * HITOTSU 一つ: the rules, and nothing else. Our own game of the colour-card
 * shedding kind, grown from Crazy Eights, with its own deck (`hitotsuDeck.ts`).
 *
 * Two to eight players, seven cards each (five in party mode). The first
 * number card turned up starts the pile. On your turn play a card of the
 * colour or the number (or the symbol) on top, or a wild; or draw one, which
 * you may play at once if it goes. A Skip skips the next player; a Reverse
 * turns the direction of play (between two, it skips); a Draw Two makes the
 * next player take two and lose their turn; a Wild calls the colour; a Wild
 * Draw Four calls it and makes the next player take four and lose their turn.
 * Going down to one card, call "Hitotsu!" — forget, and you take two.
 *
 * The first out wins the hand and scores what everybody else still holds:
 * face value for a number, twenty an action card, fifty a wild. A hand where
 * nobody can play or draw is blocked, and goes to whoever holds the least.
 * The first to the game's total wins; a game of one hand is over after it.
 *
 * The popular variants are options (`HitotsuOptions`), each a line on the
 * rules page. Pure: every function returns a new game and leaves the one given
 * alone.
 */

/** The most at a table: one colour a player, as every party table seats (`PARTY_MARBLES`). */
export const HITOTSU_MOST_PLAYERS = 8;

export function hitotsuTop(game: HitotsuGame): HitotsuCard {
  return game.discard[game.discard.length - 1];
}

/** The seat `steps` along from this one, in the direction of play. */
function along(game: HitotsuGame, seat: number, steps: number): number {
  const count = game.players.length;
  return (((seat + game.direction * steps) % count) + count) % count;
}

/** Whether a card may go on the pile on an ordinary turn: a wild always; otherwise the colour to follow, or the top card's face. */
export function hitotsuMatches(game: HitotsuGame, card: HitotsuCard): boolean {
  if (isWild(card)) return true;
  const top = hitotsuTop(game);
  return colourOf(card) === game.colour || (!isWild(top) && faceOf(card) === faceOf(top));
}

/** With no bluffing, a Wild Draw Four goes down only from a hand holding nothing of the colour to follow. */
function fourAllowed(game: HitotsuGame, hand: readonly HitotsuCard[]): boolean {
  return game.options.wildFour !== "strict" || !hand.some((card) => colourOf(card) === game.colour);
}

/** Whether a card may be stacked on the draw the player to move faces. */
function stacks(game: HitotsuGame, card: HitotsuCard): boolean {
  const { stacking } = game.options;
  if (stacking === "off") return false;
  const face = faceOf(card);
  if (game.pendingFace === DRAW_TWO) return face === DRAW_TWO || (stacking === "any" && face === WILD_FOUR);
  return face === WILD_FOUR || (stacking === "any" && face === DRAW_TWO && colourOf(card) === game.colour);
}

/** The cards the player to move may play now: on a draw, what stacks; after drawing, the card drawn if it goes. */
export function hitotsuPlayable(game: HitotsuGame): HitotsuCard[] {
  if (game.phase === "over" || game.toPlay === null) return [];
  const hand = game.hands[game.toPlay];
  if (game.pending > 0) return hand.filter((card) => stacks(game, card));
  const from = game.drawn !== null ? [game.drawn] : hand;
  return from.filter((card) => hitotsuMatches(game, card) && (faceOf(card) !== WILD_FOUR || fourAllowed(game, hand)));
}

/** Whether playing this card from this hand swaps or turns hands (sevens and zeros), so the call is not asked. */
function movesHands(game: HitotsuGame, card: HitotsuCard): boolean {
  return game.options.sevenZero && (faceOf(card) === "7" || faceOf(card) === "0");
}

/** Every way of playing one card from a seat: the colour a wild calls, the seat a seven swaps with, and the call, where each applies. */
function waysToPlay(game: HitotsuGame, seat: number, card: HitotsuCard): { colour?: HitotsuColour; swap?: number; call?: boolean }[] {
  const hand = game.hands[seat];
  const colours: (HitotsuColour | undefined)[] = isWild(card) ? [...HITOTSU_COLOURS] : [undefined];
  const swaps: (number | undefined)[] =
    game.options.sevenZero && faceOf(card) === "7" && hand.length > 1 ? game.players.flatMap((_, at) => (at === seat ? [] : [at])) : [undefined];
  const calls: (boolean | undefined)[] = hand.length === 2 && !movesHands(game, card) ? [true, undefined] : [undefined];
  return colours.flatMap((colour) =>
    swaps.flatMap((swap) =>
      calls.map((call) => ({ ...(colour === undefined ? {} : { colour }), ...(swap === undefined ? {} : { swap }), ...(call === undefined ? {} : { call }) })),
    ),
  );
}

/** Whether a card can still be drawn: from the stock, or from the discards under the top card shuffled into one. */
function canDraw(game: HitotsuGame): boolean {
  return game.stock.length > 0 || game.discard.length > 1;
}

/** Every move the player to move may make now; none once the game is over. Cards played out of turn are `hitotsuJumpIns`. */
export function hitotsuMoves(game: HitotsuGame): HitotsuMove[] {
  if (game.phase === "over" || game.toPlay === null) return [];
  const seat = game.toPlay;
  const plays = hitotsuPlayable(game).flatMap((card) => waysToPlay(game, seat, card).map((way): HitotsuMove => ({ play: card, ...way })));
  if (game.challenge !== null) return [...plays, { take: true }, { challenge: true }];
  if (game.pending > 0) return [...plays, { take: true }];
  if (game.drawn !== null) return [...plays, { pass: true }];
  if (canDraw(game)) return [...plays, { draw: true }];
  return plays.length > 0 ? plays : [{ pass: true }];
}

/**
 * JUMPING IN: with the option on, any other player holding a card identical
 * to the one on top — same colour, same face, never a wild — may play it out
 * of turn, and play goes on from them. Not on a draw waiting to be taken, a
 * challenge waiting to be made, or while the player to move decides about a
 * card they drew.
 */
export function hitotsuJumpIns(game: HitotsuGame): HitotsuMove[] {
  if (!game.options.jumpIn || game.phase === "over" || game.toPlay === null) return [];
  if (game.pending > 0 || game.challenge !== null || game.drawn !== null) return [];
  const top = hitotsuTop(game);
  if (isWild(top)) return [];
  return game.hands.flatMap((hand, seat) =>
    seat === game.toPlay ? [] : hand.filter((card) => identical(card, top)).flatMap((card) => waysToPlay(game, seat, card).map((way): HitotsuMove => ({ jump: card, seat, ...way }))),
  );
}

/** Two moves the same: every field alike, a call not made counted as no call. */
function sameMove(a: HitotsuMove, b: HitotsuMove): boolean {
  const flat = (move: HitotsuMove) => JSON.stringify(Object.entries(move).filter(([key, value]) => value !== undefined && !(key === "call" && value === false)).sort(([x], [y]) => x.localeCompare(y)));
  return flat(a) === flat(b);
}

/** One card off the stock into a seat's hand, turning the discards under the top card over first if the stock is empty; null when there is none. */
function takeOne(game: HitotsuGame, seat: number): { game: HitotsuGame; card: HitotsuCard } | null {
  let { stock, discard, turnovers } = game;
  if (stock.length === 0) {
    if (discard.length <= 1) return null;
    turnovers += 1;
    stock = reshuffledHitotsu(discard.slice(0, -1), game.seed, 1000 * (game.hand + 1) + turnovers);
    discard = discard.slice(-1);
  }
  const [card, ...rest] = stock;
  const hands = game.hands.map((hand, at) => (at === seat ? sortHitotsu([...hand, card]) : hand));
  return { game: { ...game, hands, stock: rest, discard, turnovers }, card };
}

/** A seat takes this many cards, or as many as are left. */
function drawInto(game: HitotsuGame, seat: number, count: number): HitotsuGame {
  let state = game;
  for (let taken = 0; taken < count; taken += 1) {
    const got = takeOne(state, seat);
    if (got === null) break;
    state = got.game;
  }
  return state;
}

function dealHand(base: Omit<HitotsuGame, "hands" | "stock" | "discard" | "colour" | "direction" | "toPlay" | "drawn" | "pending" | "pendingFace" | "challenge" | "passes" | "turnovers" | "phase" | "news">): HitotsuGame {
  const seats = base.players.length;
  const deck = shuffledHitotsu(base.seed, base.hand);
  const dealt = seats * base.options.deal;
  const hands = Array.from({ length: seats }, (_, seat) => sortHitotsu(deck.filter((_, at) => at < dealt && at % seats === seat)));
  let stock = deck.slice(dealt);
  // The first number card turned up starts the pile; anything else goes back under the stock.
  while (!isNumber(stock[0])) stock = [...stock.slice(1), stock[0]];
  const [start, ...rest] = stock;
  return {
    ...base,
    phase: "playing",
    hands,
    stock: rest,
    discard: [start],
    colour: colourOf(start)!,
    direction: 1,
    toPlay: base.hand % seats,
    drawn: null,
    pending: 0,
    pendingFace: null,
    challenge: null,
    passes: 0,
    turnovers: 0,
    news: [],
  };
}

export function startHitotsu(size: number, players: readonly string[], seed = 1, options: HitotsuOptions = HITOTSU_CLASSIC, computers?: readonly boolean[]): HitotsuGame | null {
  if (!(HITOTSU_SIZES as readonly number[]).includes(size)) return null;
  if (players.length < 2 || players.length > HITOTSU_MOST_PLAYERS) return null;
  return dealHand({
    size,
    players: [...players],
    computers: Array.from({ length: players.length }, (_, seat) => computers?.[seat] === true),
    seed,
    options: { ...options },
    moves: [],
    hand: 0,
    scores: new Array<number>(players.length).fill(0),
    results: [],
  });
}

/** The hand is over: the winners score everything the others hold, and either the game is over or the next hand is dealt. */
function endHand(game: HitotsuGame, winners: number[], blocked: boolean): HitotsuGame {
  const points = game.hands.reduce((sum, hand, seat) => (winners.includes(seat) ? sum : sum + hand.reduce((held, card) => held + hitotsuPoints(card), 0)), 0);
  const scores = game.scores.map((score, seat) => (winners.includes(seat) ? score + points : score));
  const finished = { ...game, scores, results: [...game.results, { winners, points, blocked }] };
  if (game.size === HITOTSU_ONE_HAND || Math.max(...scores) >= game.size) {
    return { ...finished, phase: "over", toPlay: null, drawn: null, pending: 0, pendingFace: null, challenge: null };
  }
  return { ...dealHand({ ...finished, hand: game.hand + 1 }), news: game.news };
}

/** A draw card has gone down: the next player faces it — to stack on, challenge or take — or, with no stacking, takes it and is skipped. */
function drawCardPlayed(game: HitotsuGame, seat: number, face: string, bluffed: boolean, before: number): HitotsuGame {
  const pending = before + (face === DRAW_TWO ? 2 : 4);
  const next = along(game, seat, 1);
  const pendingFace = face === DRAW_TWO ? DRAW_TWO : WILD_FOUR;
  if (face === WILD_FOUR && game.options.wildFour === "challenge" && before === 0) {
    return { ...game, pending, pendingFace, challenge: { by: seat, bluffed }, toPlay: next };
  }
  if (game.options.stacking !== "off") return { ...game, pending, pendingFace, challenge: null, toPlay: next };
  const drew = drawInto({ ...game, pending: 0, pendingFace: null, challenge: null }, next, pending);
  return { ...drew, toPlay: along(drew, seat, 2), news: [...drew.news, { kind: "took", seat: next, count: pending }] };
}

/** A card goes down from a seat, in turn or jumping in, and does what it does. */
function place(game: HitotsuGame, seat: number, card: HitotsuCard, way: { colour?: HitotsuColour; swap?: number; call?: boolean }, jumped: boolean): HitotsuGame {
  const face = faceOf(card);
  const before = game.pending;
  const bluffed = game.hands[seat].some((held) => held !== card && colourOf(held) === game.colour);
  const hands = game.hands.map((hand, at) => (at === seat ? hand.filter((held) => held !== card) : hand));
  const news: HitotsuNews[] = jumped ? [{ kind: "jump", seat }] : [];
  let state: HitotsuGame = { ...game, hands, discard: [...game.discard, card], colour: way.colour ?? colourOf(card)!, drawn: null, passes: 0, news, toPlay: seat, pending: before, challenge: null };
  if (hands[seat].length === 0) {
    // Out. A draw card played last is still taken by the next player, and counts against them.
    if (isDrawCard(card)) {
      const victim = along(state, seat, 1);
      const count = before + (face === DRAW_TWO ? 2 : 4);
      state = drawInto(state, victim, count);
      state = { ...state, news: [...state.news, { kind: "took", seat: victim, count }] };
    }
    return endHand({ ...state, pending: 0, pendingFace: null }, [seat], false);
  }
  if (hands[seat].length === 1 && way.call !== true && !movesHands(game, card)) {
    state = drawInto(state, seat, HITOTSU_CAUGHT);
    state = { ...state, news: [...state.news, { kind: "caught", seat }] };
  }
  if (face === SKIP) return { ...state, toPlay: along(state, seat, 2), news: [...state.news, { kind: "skipped", seat: along(state, seat, 1) }] };
  if (face === REVERSE) {
    if (state.players.length === 2) return { ...state, toPlay: along(state, seat, 2), news: [...state.news, { kind: "skipped", seat: along(state, seat, 1) }] };
    const turned: HitotsuGame = { ...state, direction: state.direction === 1 ? -1 : 1 };
    return { ...turned, toPlay: along(turned, seat, 1), news: [...state.news, { kind: "reversed" }] };
  }
  if (isDrawCard(card)) return drawCardPlayed(state, seat, face, bluffed, before);
  if (movesHands(game, card) && face === "7" && way.swap !== undefined) {
    const mine = state.hands[seat];
    const theirs = state.hands[way.swap];
    const swapped = state.hands.map((hand, at) => (at === seat ? theirs : at === way.swap ? mine : hand));
    return { ...state, hands: swapped, toPlay: along(state, seat, 1), news: [...state.news, { kind: "swap", seat, with: way.swap }] };
  }
  if (movesHands(game, card) && face === "0") {
    const passed = state.hands.map((_, at) => state.hands[along(state, at, -1)]);
    return { ...state, hands: passed, toPlay: along(state, seat, 1), news: [...state.news, { kind: "rotate", direction: state.direction }] };
  }
  return { ...state, toPlay: along(state, seat, 1) };
}

/** Draw on an ordinary turn: one card, or until one goes with draw-until-you-can-play. A card that goes may be played at once. */
function drawTurn(game: HitotsuGame, seat: number): HitotsuGame | null {
  let state = { ...game, news: [] as HitotsuNews[] };
  let drawn: HitotsuCard | null = null;
  let count = 0;
  do {
    const got = takeOne(state, seat);
    if (got === null) break;
    state = got.game;
    count += 1;
    if (hitotsuMatches(state, got.card) && (faceOf(got.card) !== WILD_FOUR || fourAllowed(state, state.hands[seat]))) drawn = got.card;
  } while (game.options.drawToMatch && drawn === null);
  if (count === 0) return null;
  const said: HitotsuNews[] = [{ kind: "drew", seat, count }];
  if (drawn !== null) return { ...state, drawn, passes: 0, news: said };
  return { ...state, toPlay: along(state, seat, 1), drawn: null, passes: 0, news: said };
}

/** A turn passed: keeping the card just drawn, or with nothing to play and nothing to draw — every player in a row, and the hand is blocked. */
function passTurn(game: HitotsuGame, seat: number): HitotsuGame {
  if (game.drawn !== null) return { ...game, drawn: null, toPlay: along(game, seat, 1), passes: 0, news: [] };
  const passes = game.passes + 1;
  if (passes < game.players.length) return { ...game, passes, toPlay: along(game, seat, 1), news: [] };
  const held = game.hands.map((hand) => hand.reduce((sum, card) => sum + hitotsuPoints(card), 0));
  const least = Math.min(...held);
  return endHand({ ...game, news: [] }, held.flatMap((points, at) => (points === least ? [at] : [])), true);
}

/** The draw waiting is taken, and the turn is lost. */
function takeDraw(game: HitotsuGame, seat: number): HitotsuGame {
  const drew = drawInto({ ...game, pending: 0, pendingFace: null, challenge: null, news: [] }, seat, game.pending);
  return { ...drew, toPlay: along(drew, seat, 1), news: [{ kind: "took", seat, count: game.pending }] };
}

/**
 * A Wild Draw Four challenged. If whoever played it held a card of the colour
 * it went on, they take the four and the challenger plays on; if not, the
 * challenger takes six and loses the turn.
 */
function challengeFour(game: HitotsuGame, seat: number): HitotsuGame {
  const { by, bluffed } = game.challenge!;
  const base = { ...game, pending: 0, pendingFace: null, challenge: null, news: [] };
  if (bluffed) {
    const drew = drawInto(base, by, game.pending);
    return { ...drew, toPlay: seat, news: [{ kind: "challenge", seat, by, guilty: true }, { kind: "took", seat: by, count: game.pending }] };
  }
  const count = game.pending + HITOTSU_CHALLENGE_LOST - 4;
  const drew = drawInto(base, seat, count);
  return { ...drew, toPlay: along(drew, seat, 1), news: [{ kind: "challenge", seat, by, guilty: false }, { kind: "took", seat, count }] };
}

export function playHitotsu(game: HitotsuGame, move: HitotsuMove): HitotsuGame | null {
  const seat = game.toPlay;
  if (game.phase === "over" || seat === null) return null;
  let next: HitotsuGame | null = null;
  if ("jump" in move) {
    if (hitotsuJumpIns(game).some((offered) => sameMove(offered, move))) next = place(game, move.seat, move.jump, move, true);
  } else if (hitotsuMoves(game).some((offered) => sameMove(offered, move))) {
    if ("play" in move) next = place(game, seat, move.play, move, false);
    else if ("draw" in move) next = drawTurn(game, seat);
    else if ("pass" in move) next = passTurn(game, seat);
    else if ("take" in move) next = takeDraw(game, seat);
    else next = challengeFour(game, seat);
  }
  return next === null ? null : { ...next, moves: [...game.moves, move] };
}

/** Once the game is over: whoever went out in a game of one hand; otherwise the highest score, level on it sharing the win. */
export function hitotsuWinners(game: HitotsuGame): number[] {
  if (game.phase !== "over") return [];
  if (game.size === HITOTSU_ONE_HAND) return game.results[game.results.length - 1]?.winners ?? [];
  const top = Math.max(...game.scores);
  return game.scores.flatMap((score, seat) => (score === top ? [seat] : []));
}
