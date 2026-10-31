// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { CARD_GAME_RULES } from "../../cardGames/cardGameRules";
import { CARD_GAME_LIST, CARD_GAME_SPECS, type CardGameKind } from "../../cardGames/cardGames.constants";
import type { CardGameRules } from "../../cardGames/cardGames.types";

import { COMPUTER_SEAT_NAME } from "./online.constants";
import type { OnlineRules } from "./online.types";
import { NO_SEED, freshTableSeed, readSeen, writeSeen } from "./onlineSeen";

/**
 * THE ELEVEN FAMILY CARD GAMES AT A TABLE ON SEVERAL DEVICES, one row made one way:
 * Toranpu's own rules, the very ones the table on one device plays, and one thing the
 * tables of Hitotsu and Mexican Train do not have.
 *
 * NO BROWSER RECEIVES ANOTHER PERSON'S CARDS. Hitotsu's and Mexican Train's tables send
 * every seat the whole game, and only the page keeps the other hands out of sight, so a
 * person reading the page's data can see them; their game is its seed and its moves,
 * and every hand can be made again from those. Here the stored text never leaves the
 * server. A seat is sent the game as it stands (`seatState`, in the way Gunjin's is),
 * with the seed and the moves gone and every card that seat could not see at a real
 * table replaced by a back (`HIDDEN`), one for one, so a hand's size is still known and
 * the rules read a hand the same. What each game keeps from whom is `SECRETS`, one line
 * a game, so a new game has to say; `onlineCards.test.ts` plays every game at every
 * table and looks for a stranger's card anywhere in what each seat is sent.
 *
 * A COMPUTER'S CARDS. Computers move in a browser, never on the server, and to choose
 * its move a computer has to hold its cards. So the browser that works out a computer's
 * turn is sent that computer's view of the game, on that turn only (`computerStateFor`).
 * A person reading the page's data could see a computer's hand; nobody's data ever holds
 * another person's.
 *
 * THE SEED IS THE SERVER'S. It draws it at the start, so nobody chooses the deal.
 */

/** A card face down: a hand's place, with nothing about the card in it. Toranpu's rules hold a card as a string and read one only when it is played. */
export const HIDDEN = "??";

const covered = (cards: readonly string[] | null | undefined): string[] => (cards ?? []).map(() => HIDDEN);

/** Every hand but this seat's, face down. */
const otherHands = (hands: readonly (readonly string[])[], seat: number) => hands.map((hand, at) => (at === seat ? hand : covered(hand)));

/** Every seat's list but this seat's, face down: what has been passed or set aside. */
const otherLists = (lists: readonly (readonly string[] | null)[], seat: number) => lists.map((list, at) => (at === seat || list === null ? list : covered(list)));

type Loose = Record<string, unknown> & { hands: readonly (readonly string[])[]; toPlay: number | null };

/**
 * WHAT EACH GAME KEEPS FROM A SEAT, past the seed and the moves: read from each game's
 * state in Toranpu. What a real table shows stays: the trick, the cards played, the
 * discard pile, a turned card, what is announced, and a finished hand's result.
 */
const SECRETS: Record<CardGameKind, (game: Loose, seat: number) => Partial<Loose>> = {
  // The three passed are the passer's own, and the receiver's once they arrive.
  hearts: (game, seat) => ({ hands: otherHands(game.hands, seat), passing: otherLists(game.passing as (string[] | null)[], seat), received: otherLists(game.received as string[][], seat) }),
  spades: (game, seat) => ({ hands: otherHands(game.hands, seat) }),
  euchre: (game, seat) => ({ hands: otherHands(game.hands, seat) }),
  // The kept hands and the crib are face down until the show, which is in `results`, and the cut until it is turned up.
  cribbage: (game, seat) => ({
    hands: otherHands(game.hands, seat),
    kept: otherLists(game.kept as string[][], seat),
    crib: covered(game.crib as string[]),
    cut: game.starter === null ? HIDDEN : game.cut,
  }),
  ohHell: (game, seat) => ({ hands: otherHands(game.hands, seat) }),
  // A card drawn from the stock is the drawer's until they play it.
  crazyEights: (game, seat) => ({ hands: otherHands(game.hands, seat), stock: covered(game.stock as string[]), drawn: game.toPlay === seat || game.drawn === null ? game.drawn : HIDDEN }),
  goFish: (game, seat) => ({ hands: otherHands(game.hands, seat), stock: covered(game.stock as string[]) }),
  bigTwo: (game, seat) => ({ hands: otherHands(game.hands, seat) }),
  // A card given in the exchange is known to the two who swapped it.
  president: (game, seat) => ({
    hands: otherHands(game.hands, seat),
    swaps: (game.swaps as { from: number; to: number; cards: string[] }[]).map((swap) => (swap.from === seat || swap.to === seat ? swap : { ...swap, cards: covered(swap.cards) })),
  }),
  // A card taken from the stock is the taker's, as a card taken from the pile is everybody's (`picked` keeps those).
  ginRummy: (game, seat) => ({ hands: otherHands(game.hands, seat), stock: covered(game.stock as string[]), taken: game.toPlay === seat || game.taken === null ? game.taken : HIDDEN }),
  // Every pile face down, the player's own too: nobody knows the order of their own cards in War. What was turned is `last`, and a card laid face down in a war stays so.
  war: (game) => {
    const last = game.last as { laid: { card: string; down: boolean }[] } | null;
    return { hands: game.hands.map(covered), last: last === null ? null : { ...last, laid: last.laid.map((one) => (one.down ? { ...one, card: HIDDEN } : one)) } };
  },
};

/** The game as this seat may see it. */
export function seenByCardSeat(kind: CardGameKind, game: object, seat: number): object {
  return { ...game, ...SECRETS[kind](game as Loose, seat), seed: NO_SEED, moves: [] };
}

/** A card game's move as a browser sent it, for its shape only: a small object of cards, seats, numbers and yeses. Whether it may be made, and whether the cards are the mover's, is the rules'. */
export function readCardMove(sent: unknown): object | null {
  if (typeof sent !== "object" || sent === null || Array.isArray(sent)) return null;
  const entries = Object.entries(sent);
  if (entries.length === 0 || entries.length > 2) return null;
  const small = (value: unknown): boolean => (typeof value === "string" && value.length <= 8) || value === true || (Number.isInteger(value) && Math.abs(value as number) <= 100);
  const fine = entries.every(([key, value]) => /^[a-z]{2,8}$/.test(key) && (small(value) || (Array.isArray(value) && value.length <= 13 && value.every((one) => typeof one === "string" && one.length <= 8))));
  return fine ? (sent as object) : null;
}

type CardState = { players: readonly string[]; moves: readonly unknown[] };

function cardOnline(kind: CardGameKind): OnlineRules<CardState, object> {
  const rules = CARD_GAME_RULES[kind] as unknown as CardGameRules<CardState, object>;
  const spec = CARD_GAME_SPECS[kind];
  return {
    sizes: spec.sizes,
    counts: Array.from({ length: spec.mostPlayers - spec.fewestPlayers + 1 }, (_, at) => spec.fewestPlayers + at),
    start: (size, count, extra) => {
      const flags = Array.from({ length: count }, (_, seat) => extra?.computers?.includes(seat) === true);
      // A table of blank names: the names are the seats', written in for a page by `named`.
      return count < spec.fewestPlayers || count > spec.mostPlayers ? null : rules.start(size, new Array<string>(count).fill(""), undefined, freshTableSeed(), flags);
    },
    encode: rules.encode,
    // The stored text on the server; on a browser, the text the seat was sent (the server never decodes that one).
    decode: (text) => rules.decode(text) ?? readSeen<CardState>(kind, text),
    toPlay: (game) => (rules.over(game) ? null : rules.toPlay(game)),
    winners: (game) => (rules.over(game) ? rules.winners(game) : []),
    moveCount: (game) => game.moves.length,
    readMove: readCardMove,
    // A package's rules, asked about something a browser sent: a move they cannot read at all is one they refuse.
    play: (game, move) => {
      try {
        return rules.over(game) ? null : rules.play(game, move);
      } catch {
        return null;
      }
    },
    named: (game, names) => ({ ...game, players: game.players.map((was, seat) => names[seat] ?? was) }),
    seatState: (state, seat) => {
      const game = rules.decode(state);
      return game === null ? "" : writeSeen(kind, seenByCardSeat(kind, game, seat));
    },
    // The table's own computer player, one level of it, sitting as "Computer"; its move is the worker's, from that seat's view.
    computers: {
      levels: ["computer"],
      seat: () => ({ memberId: null, name: COMPUTER_SEAT_NAME }),
      levelOf: (seat) => (seat.memberId === null ? "computer" : null),
    },
  };
}

/** Each card game's rules for a table on several devices. */
export const CARD_GAMES_ONLINE = Object.fromEntries(CARD_GAME_LIST.map((kind) => [kind, cardOnline(kind)])) as Record<CardGameKind, OnlineRules<CardState, object>>;
