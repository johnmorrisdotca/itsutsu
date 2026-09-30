// Relative and free of the rules, like `cardGames.constants.ts`: the party constants import this, and the browser specs import those.
import type { VariantCopy } from "../gomoku/variants.constants";

import type { CardGameKind } from "./cardGames.constants";

/**
 * WHAT EACH FAMILY CARD GAME TELLS A TABLE: its name, the Japanese beside it,
 * where it comes from, and its rules as the site plays them — the rules
 * modules beside this (`hearts/hearts.ts` and the rest) are the same rules in
 * code, and a line here that stopped being true of them would be a bug.
 *
 * Every one is a traditional game nobody owns, played here under its everyday
 * name. President is the one with a ruder name at many tables, which this site
 * does not use. The kanji is what Japanese players call each game.
 */
export const CARD_GAME_DISPLAY: Record<CardGameKind, VariantCopy> = {
  hearts: {
    label: "Hearts",
    kanji: "ハーツ",
    tagline: "Take no hearts and never the queen of spades — or take every one of them and shoot the moon.",
    origin:
      "A trick-taking game played in North America since the 1880s, the last of a family of games going back to the Spanish and French Reversis, in which the aim is to win as few points as possible. It came free with desktop computers for years, which is how most people learned it. Nobody owns it.",
    alsoKnownAs: ["Black Lady", "Black Maria"],
    country: "US",
    wikipedia: "Hearts (card game)",
    rules: [
      "Three or four players. The whole pack is dealt out, thirteen each; with three, the two of diamonds is taken out first and each holds seventeen.",
      "Before each deal's play, each player passes three cards: to the left, then to the right, then across, then keeping them, round and round (with three at the table: left, right, keep).",
      "The two of clubs leads the first trick. Follow suit if you can; if you cannot, play anything. The highest card of the suit led takes the trick and leads the next. Aces are high.",
      "Every heart taken is a point against you, and the queen of spades is thirteen. No points may be played to the first trick, and hearts may not be led until one has been thrown on another suit.",
      "Take all twenty-six points in one deal and you shoot the moon: you score nothing, and every other player twenty-six.",
      "When somebody reaches the game's total — 50 for a short game, 100 for the usual one — the lowest score wins.",
    ],
    board:
      "Four players is the classic table; three works too. Choose 100 points for an evening and 50 for a quicker game. Any seat can be a computer, so one person can play three of them.",
  },
  bigTwo: {
    label: "Big Two",
    kanji: "大老二",
    tagline: "Be first to play out every card, beating each play on the table with a bigger one of the same size — where the two is king.",
    origin:
      "A shedding game from southern China, played across Hong Kong, Taiwan and Southeast Asia and named for its highest card. It is known by a dozen names; nobody owns it. 大老二 (dà lǎo èr, \"big old two\") is its name in Taiwan.",
    alsoKnownAs: ["Deuces", "Choh Dai Di", "Pusoy Dos", "Tiến lên"],
    country: "CN",
    wikipedia: "Big two",
    rules: [
      "Two to four players, thirteen cards each. With three, each holds seventeen and the last card goes to whoever holds the three of diamonds.",
      "The ranks run 3 lowest to 2 highest (3 4 5 6 7 8 9 10 J Q K A 2), and within a rank the suits run diamonds, clubs, hearts, spades: the three of diamonds is the lowest card and the two of spades the highest.",
      "Whoever holds the lowest card dealt leads, and that first play must include it. A play is one card, a pair, three of a kind, or five cards making a straight, a flush, a full house, four of a kind with any fifth card, or a straight flush, in that order from lowest.",
      "Round the table, each player beats the play on the table with a higher play of the same number of cards, or passes. A pass holds until the trick is over; when everybody else has passed, the last to play leads anything they like.",
      "The first player out of cards wins the deal. Every other player is charged a point for each card left — double for ten or more, treble for thirteen or more — and after the game's deals, the fewest points wins.",
    ],
    board: "Four is the usual table, and two or three play just as well. Choose one deal for a quick game, three for the usual one, five for a long one.",
  },
  president: {
    label: "President",
    kanji: "大富豪",
    tagline: "Get rid of your cards before everybody else, and the President takes the Beggar's best cards next round.",
    origin:
      "A shedding game played round the world under many names, as Daifugō 大富豪 (\"the grand millionaire\") across Japan, and at many a North American table under a name this site does not use. Its titles, and the cards handed up to the winner, are what make it a game for a group. Nobody owns it.",
    alsoKnownAs: ["Daifugō", "Scum", "Capitalism"],
    country: "JP",
    wikipedia: "President (card game)",
    rules: [
      "Three to eight players, the whole pack dealt round, so some may hold a card more. Twos are high and threes low, and suits do not count.",
      "The lead is one card, or two, three or four of one rank. Round the table, each player plays the same number of cards of a higher rank, or passes. A pass holds until the trick is over; when everybody else has passed, the last to play leads again.",
      "The first player out is the President, then the Vice-President, and the last is the Beggar; the Vice-Beggar is second last, and everybody between is a Citizen.",
      "From the second round, before play, the Beggar hands the President their two best cards and gets back two of the President's choosing, and the Vice-Beggar and the Vice-President swap one the same way (at a table of three, one card between President and Beggar). Then the Beggar leads.",
      "Each round scores a point for every player who went out after you. After the game's rounds, the most points wins.",
    ],
    board: "Four to six is the liveliest table; it seats three to eight. Choose three rounds for a short game, five or seven for a longer one.",
  },
  goFish: {
    label: "Go Fish",
    kanji: "魚釣り",
    tagline: "Ask for a rank you hold, and make books of four — and when they have none, go fish.",
    origin:
      "A children's card game of the English-speaking world, and for many the first card game they ever learned. It is played with an ordinary pack everywhere, and nobody owns it.",
    alsoKnownAs: ["Fish", "Go Fishing"],
    wikipedia: "Go Fish",
    rules: [
      "Two to six players: seven cards each for two or three, five for four or more. The rest are spread face down as the pond.",
      "On your turn, ask one player for a rank you hold yourself. If they have any, they hand you every one, and you ask again.",
      "If they have none, they say \"Go fish\" and you draw from the pond. Draw the rank you asked for and you show it and ask again; draw anything else and your turn is over.",
      "Four of a rank is a book, laid down at once. A player whose hand runs out draws a card when their turn comes, and sits out once the pond is empty too.",
      "When all thirteen books are down, whoever has the most wins; players level on the most share the win.",
    ],
    board: "Three players is the usual table; it seats two to six. The game is one deal, played until every book is down.",
  },
  crazyEights: {
    label: "Crazy Eights",
    kanji: "クレイジーエイト",
    tagline: "Match the suit or the rank, play an eight to call any suit, and be first to empty your hand.",
    origin:
      "A shedding game played in Britain and North America since the middle of the twentieth century, and the game the commercial colour-card games are built on. It is played with an ordinary pack, and nobody owns it.",
    alsoKnownAs: ["Swedish Rummy", "Eights", "Switch"],
    wikipedia: "Crazy Eights",
    rules: [
      "Two to seven players: seven cards each for two, five for more. The top card of the stock is turned up to start the discard pile; an eight turned up goes back under the stock.",
      "On your turn, play a card that matches the top card's suit or its rank. Eights are wild: play one on anything, and name the suit that must follow.",
      "If you cannot play, draw one card. If it can be played you may play it; otherwise your turn is over. When the stock runs out, the discards under the top card are shuffled into a new one; when there are none left either, a player who cannot play passes.",
      "The first player out of cards wins the hand and scores what everybody else still holds: fifty for an eight, ten for a king, queen or jack, one for an ace, and the face value of the rest. A hand where every player passes in turn is blocked, and goes to whoever holds the least.",
      "The first to the game's total — 50, 100 or 200 points — wins.",
    ],
    board: "Three or four is the usual table; it seats two to seven. Choose 100 points for the usual game, 50 for a quick one and 200 for a long one.",
  },
  spades: {
    label: "Spades",
    kanji: "スペード",
    tagline: "Bid the tricks you and your partner will take, then take exactly that many — spades are always trumps.",
    origin:
      "A partnership trick-taking game from the United States of the 1930s, a simpler cousin of Bridge and Whist in which spades are always trumps and each player bids for themselves. It spread through the armed forces in the Second World War and has been one of the most played card games in North America ever since. Nobody owns it.",
    country: "US",
    wikipedia: "Spades (card game)",
    rules: [
      "Four players in two partnerships, partners sitting across from each other. The whole pack is dealt, thirteen each, and the deal moves one seat round each time.",
      "From the dealer's left, each player bids how many tricks they expect to take, one to thirteen, or nil for none at all. A partnership's contract is its two bids added.",
      "The dealer's left leads the first trick. Follow suit if you can; if you cannot, play anything. Spades are trumps: the highest spade takes the trick, or else the highest card of the suit led. Aces are high. Spades may not be led until one has been played on another suit, unless you hold nothing else.",
      "Make your contract and score ten points for every trick bid and one for every trick over, which is a bag; take fewer and lose ten for every trick bid. Every ten bags a partnership gathers cost it a hundred points.",
      "Nil scores a hundred if its bidder takes no trick at all, and costs a hundred if they take even one; their partner's bid stands on its own, and any trick the nil bidder takes is a bag.",
      "The first partnership to the game's total — 200, 300 or the usual 500 — wins; a partnership that sinks to minus that total loses. Level at the end, and another deal is played.",
    ],
    board: "Always four, two against two: one person and three computers, two people as partners against two computers, or four people round one device. Choose 500 for the usual game, 300 or 200 for a quicker one.",
  },
  ginRummy: {
    label: "Gin Rummy",
    kanji: "ジンラミー",
    tagline: "Draw, throw, and turn your ten cards into sets and runs — then knock, or go gin with nothing left over.",
    origin:
      "A two-player rummy game from the United States, said to have been worked out in 1909 by the whist teacher Elwood Baker and his son as a faster cousin of the older game of Knock Rummy. It swept Hollywood in the 1930s and 1940s, and has been the classic two-player card game of North America ever since. Nobody owns it.",
    alsoKnownAs: ["Gin"],
    country: "US",
    wikipedia: "Gin rummy",
    rules: [
      "Two players, ten cards each. The rest is the stock, and its top card is turned up to start the discard pile.",
      "On your turn, draw one card, from the top of the stock or the top of the discard pile, then throw one card onto the pile. A card just taken from the pile may not go straight back.",
      "Melds are three or four cards of one rank, or three or more in a row in one suit, with the ace low. Every card in no meld is deadwood: an ace counts one, a jack, queen or king ten, and the rest their number.",
      "With ten or fewer points of deadwood you may knock: throw your card face down and lay your hand out. The other player lays out theirs and lays off any card that fits your melds. You score the difference in deadwood; if they have as little as you or less, they undercut you and score the difference and 25.",
      "Knock with no deadwood at all and it is gin: you score 25 and all their deadwood, and they may lay nothing off. If the stock runs down to two cards with nobody out, the hand is drawn and nobody scores.",
      "The first to the game's total — 50, 100 or 150 points — wins.",
    ],
    board: "Always two: one person against the computer, or two people passing one device. Choose 100 points for the usual game, 50 for a quick one and 150 for a long one.",
  },
  euchre: {
    label: "Euchre",
    kanji: "ユーカー",
    tagline: "Make trumps with your partner and take three of the five tricks — where the jacks are the highest cards of all.",
    origin:
      "A partnership trick game with a short pack, played in the United States since the early nineteenth century and brought, most likely, by German settlers in Pennsylvania from an Alsatian game called Juckerspiel. It is the game the Joker was added to the pack for, as a top trump. Still the great card game of Ontario, Michigan, Ohio and Indiana. Nobody owns it.",
    alsoKnownAs: ["Eucre", "Uker"],
    country: "US",
    wikipedia: "Euchre",
    rules: [
      "Four players in two partnerships, partners across the table, with the twenty-four cards from nine to ace. Five each; the top card of the four left over is turned up.",
      "From the dealer's left, each player may order that card's suit as trumps, or pass. If it is ordered, the dealer picks the card up and throws one away. If all four pass, the card is turned down and each may name another suit, or pass; the dealer, last, must name one.",
      "In trumps, the jack is the highest card (the right bower), then the other jack of the same colour (the left bower, a trump and no longer of its own suit), then ace, king, queen, ten and nine. In the other suits, ace is high.",
      "The dealer's left leads. Follow suit if you can; if you cannot, play anything. The highest trump takes the trick, or else the highest card of the suit led.",
      "The partnership that made trumps scores one for three or four tricks and two for all five. Take two or fewer and it is euchred: the other partnership scores two.",
      "The first partnership to the game's total — 5 for a quick game, or the usual 10 — wins.",
    ],
    board: "Always four, two against two: one person and three computers, two people as partners against two computers, or four people round one device. Choose 10 points for the usual game, 5 for a quick one.",
  },
  cribbage: {
    label: "Cribbage",
    kanji: "クリベッジ",
    tagline: "Lay two to the crib, peg fifteens, pairs and runs as the cards go down, then count your hand — first to 121 wins.",
    origin:
      "An English game of the early seventeenth century, credited to the poet Sir John Suckling, who is said to have made it out of an older game called Noddy. It is scored with pegs on a board of holes, so the score moves round in front of both players as the cards go down. Played in every English-speaking country, and the one card game allowed aboard American submarines. Nobody owns it.",
    alsoKnownAs: ["Crib"],
    country: "GB",
    wikipedia: "Cribbage",
    rules: [
      "Two players, six cards each. Each lays two away face down to the crib, which belongs to the dealer; then the top of the pack is cut and turned up as the starter. A jack cut scores the dealer two, his heels.",
      "The pegging: from the dealer's other hand, lay a card at a time in turn, calling the running count, which may not pass thirty-one. Fifteen scores two and thirty-one two; a pair two, three alike six and four alike twelve; a run of three or more, in any order, a point a card.",
      "If you cannot play without passing thirty-one, you say go and the other player plays on while they can. Whoever laid the last card scores one for the go, and the count starts again from nought. The last card of all scores one.",
      "The show: each hand of four, with the starter, scores two for every set of cards adding up to fifteen, two for every pair, a point a card for every run, four for four of a suit in the hand (five with the starter), and one for the jack of the starter's suit, his nobs. The crib is the dealer's, and scores a flush only when all five are one suit.",
      "The other player shows first, then the dealer, then the dealer's crib, and the deal passes. The first to the game's total, 121 or 61, wins the moment they reach it, even partway through the show.",
    ],
    board: "Always two: one person against the computer, or two people passing one device. Choose 121 for the usual game, twice round the board, or 61 for once round.",
  },
};
