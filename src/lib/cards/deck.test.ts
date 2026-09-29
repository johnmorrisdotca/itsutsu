import { describe, expect, it } from "vitest";

import { CARD_ALPHABET, DECK_SIZE } from "./cards.constants";
import {
  cardAt,
  cardCode,
  cardFromCode,
  cardFromId,
  cardId,
  cardIndex,
  cardName,
  cardShortName,
  colourOf,
  dealAll,
  dealRound,
  freshDeck,
  isWholeDeck,
  readCards,
  shuffledDeck,
  sortedHand,
  take,
  writeCards,
} from "./deck";

describe("the deck", () => {
  it("holds fifty-two different cards, thirteen of each suit", () => {
    const deck = freshDeck();
    expect(deck).toHaveLength(DECK_SIZE);
    expect(new Set(deck.map(cardCode)).size).toBe(DECK_SIZE);
    for (const suit of ["spades", "hearts", "diamonds", "clubs"]) expect(deck.filter((card) => card.suit === suit)).toHaveLength(13);
  });

  it("writes every card as one letter and reads it back", () => {
    expect(CARD_ALPHABET).toHaveLength(DECK_SIZE);
    for (const card of freshDeck()) {
      expect(cardFromCode(cardCode(card))).toEqual(card);
      expect(cardAt(cardIndex(card))).toEqual(card);
    }
    expect(cardFromCode("?")).toBeNull();
    expect(cardFromCode("AB")).toBeNull();
    expect(() => cardAt(52)).toThrow();
  });

  it("gives every card the two-character id card players write, and reads it back", () => {
    expect(cardId({ suit: "spades", rank: 12 })).toBe("QS");
    expect(cardId({ suit: "hearts", rank: 10 })).toBe("TH");
    expect(cardId({ suit: "clubs", rank: 1 })).toBe("AC");
    for (const card of freshDeck()) expect(cardFromId(cardId(card))).toEqual(card);
    expect(cardFromId("qs")).toEqual({ suit: "spades", rank: 12 });
    expect(cardFromId("1S")).toBeNull();
    expect(cardFromId("QSX")).toBeNull();
  });

  it("writes a deal as a string and refuses one with a stranger in it", () => {
    const deck = shuffledDeck(7);
    expect(readCards(writeCards(deck))).toEqual(deck);
    expect(isWholeDeck(writeCards(deck))).toBe(true);
    expect(isWholeDeck(writeCards(deck).slice(1))).toBe(false);
    expect(isWholeDeck("A".repeat(52))).toBe(false);
    expect(readCards("AB!")).toBeNull();
  });

  it("names a card for the corner and for a screen reader", () => {
    expect(cardShortName({ suit: "hearts", rank: 12 })).toBe("Q♥");
    expect(cardShortName({ suit: "clubs", rank: 10 })).toBe("10♣");
    expect(cardName({ suit: "spades", rank: 1 })).toBe("ace of spades");
    expect(colourOf({ suit: "diamonds", rank: 3 })).toBe("red");
    expect(colourOf({ suit: "clubs", rank: 3 })).toBe("black");
  });
});

describe("the shuffle", () => {
  it("is fixed by its seed, and different seeds deal different orders", () => {
    expect(shuffledDeck(42)).toEqual(shuffledDeck(42));
    expect(writeCards(shuffledDeck(42))).not.toBe(writeCards(shuffledDeck(43)));
    expect(isWholeDeck(writeCards(shuffledDeck(42)))).toBe(true);
  });

  it("moves every card somewhere over many seeds, so no place is stuck", () => {
    const seen = Array.from({ length: DECK_SIZE }, () => new Set<number>());
    for (let seed = 1; seed <= 400; seed += 1) shuffledDeck(seed).forEach((card, at) => seen[at].add(cardIndex(card)));
    for (const place of seen) expect(place.size).toBeGreaterThan(40);
  });
});

describe("dealing", () => {
  it("deals round the table, one at a time, and leaves the rest", () => {
    const deck = freshDeck();
    const { hands, rest } = dealRound(deck, 4, 5);
    expect(hands.map((hand) => hand.length)).toEqual([5, 5, 5, 5]);
    expect(hands[0][0]).toEqual(deck[0]);
    expect(hands[1][0]).toEqual(deck[1]);
    expect(hands[0][1]).toEqual(deck[4]);
    expect(rest).toHaveLength(32);
    expect(() => dealRound(deck, 4, 14)).toThrow();
  });

  it("deals the whole deck, the first hands taking the odd cards", () => {
    expect(dealAll(freshDeck(), 4).map((hand) => hand.length)).toEqual([13, 13, 13, 13]);
    expect(dealAll(freshDeck(), 5).map((hand) => hand.length)).toEqual([11, 11, 10, 10, 10]);
  });

  it("takes from the top and leaves what it was given alone", () => {
    const deck = freshDeck();
    const before = writeCards(deck);
    const { taken, rest } = take(deck, 3);
    expect(taken).toEqual(deck.slice(0, 3));
    expect(rest).toHaveLength(49);
    expect(writeCards(deck)).toBe(before);
  });

  it("sorts a hand by suit and then rank, with the rank order a game chooses", () => {
    const hand = [
      { suit: "clubs", rank: 2 },
      { suit: "spades", rank: 1 },
      { suit: "spades", rank: 13 },
    ] as const;
    expect(sortedHand(hand).map(cardShortName)).toEqual(["A♠", "K♠", "2♣"]);
    expect(sortedHand(hand, (rank) => (rank === 1 ? 14 : rank)).map(cardShortName)).toEqual(["K♠", "A♠", "2♣"]);
  });
});
