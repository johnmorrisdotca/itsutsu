import { gameArtPath } from "@/lib/gomoku/artwork";
import { originFor, wikipediaUrl } from "@/lib/learn/origins";
import type { RulesPage } from "@/lib/learn/rulesPage";

import { mancalaBoardName } from "./mancala/mancala.constants";
import { trainSetName } from "@johnmorrisdotca/domino";
import { PARTY_DISPLAY, PARTY_SPECS } from "./party.constants";
import type { PartyKind, PartyLanguage, PartySpec } from "./party.types";
import { TENKA_WORLD_ROUNDS } from "./tenka/tenka.constants";
import { DICE_WAR_DICE, DICE_WAR_ROUND_GOALS, DICE_WAR_SIDES } from "./diceWar/diceWar.constants";
import { HITOTSU_ONE_HAND } from "@johnmorrisdotca/hitotsu";

/** "2–6 players", from the game's own spec rather than a second sentence that could drift. */
export function partyPlayersWords(kind: PartyKind): string {
  const spec = PARTY_SPECS[kind];
  return spec.fewestPlayers === spec.mostPlayers ? `${spec.mostPlayers} players` : `${spec.fewestPlayers}–${spec.mostPlayers} players`;
}

/** The languages a word game is offered in, in words: "English or Japanese". */
const LANGUAGE_WORDS: Record<PartyLanguage, string> = { english: "English", japanese: "Japanese" };

/** A list in words: "a", "a and b", "a, b and c" — or "a or b" when `or` says so. */
function listed(items: readonly string[], join = "and"): string {
  return items.length === 1 ? items[0] : `${items.slice(0, -1).join(", ")} ${join} ${items.at(-1)}`;
}

/**
 * WHAT A PARTY GAME'S SET-UP OFFERS BEYOND ITS PLAYERS, in words, from its
 * spec: "on 3×3, 4×4, 5×5 and 6×6 boxes"; "in English or Japanese, where a
 * word of 4 letters or more loses"; "by Kalah (the default) or Oware rules".
 * Each game says what its sizes count — for Mancala, which rules it is played
 * by (`MANCALA_BOARDS`).
 */
const OFFERED_WORDS: Record<PartyKind, (spec: PartySpec) => string> = {
  dotsAndBoxes: (spec) => `on ${listed(spec.sizes.map((size) => `${size}×${size}`))} boxes`,
  superghost: (spec) =>
    `in ${listed((spec.languages ?? []).map((language) => LANGUAGE_WORDS[language]), "or")}, where a word of ${listed(spec.sizes.map(String), "or")} letters or more loses`,
  mancala: (spec) =>
    `by ${listed(
      spec.sizes.map((size) => `${mancalaBoardName(size) ?? size}${size === spec.defaultSize ? " (the default)" : ""}`),
      "or",
    )} rules`,
  tenka: (spec) =>
    `on a map of the modern world, ${listed(
      spec.sizes.map((rounds) => (rounds === TENKA_WORLD_ROUNDS ? "to the last player standing" : `${rounds} rounds`)),
      "or",
    )}`,
  mexicanTrain: (spec) =>
    `with a ${listed(
      spec.sizes.map((size) => `${(trainSetName(size) ?? `double-${size}`).toLowerCase()}${size === spec.defaultSize ? " (the default)" : ""}`),
      "or",
    )} set`,
  diceWar: (spec) =>
    `with ${listed(DICE_WAR_DICE.map(String), "or")} dice each (d${DICE_WAR_SIDES[0]} to d${DICE_WAR_SIDES[DICE_WAR_SIDES.length - 1]}), to ${defaulted(spec, (size) => String(size), "or")} points, or for ${listed(DICE_WAR_ROUND_GOALS.map(String), "or")} rounds`,
  yacht: () => "with five dice and a sheet of thirteen boxes, alone or at a table",
  pachisi: () => "with two dice and four pawns each, round a cross of sixty-eight squares",
  hitotsu: (spec) => defaulted(spec, (size) => (size === HITOTSU_ONE_HAND ? "for one hand" : `to ${size} points`), "or"),
  // The family card games: how long a game lasts, in each one's own terms.
  hearts: (spec) => `to ${defaulted(spec, (size) => String(size), "or")} points`,
  bigTwo: (spec) => `over ${defaulted(spec, (size) => String(size), "or")} deals`,
  president: (spec) => `over ${defaulted(spec, (size) => String(size), "or")} rounds`,
  goFish: () => "in one deal, until every book is down",
  crazyEights: (spec) => `to ${defaulted(spec, (size) => String(size), "or")} points`,
  spades: (spec) => `to ${defaulted(spec, (size) => String(size), "or")} points`,
  ginRummy: (spec) => `to ${defaulted(spec, (size) => String(size), "or")} points`,
  euchre: (spec) => `to ${defaulted(spec, (size) => String(size), "or")} points`,
  cribbage: (spec) => `to ${defaulted(spec, (size) => String(size), "or")} points`,
  ohHell: (spec) => `over ${defaulted(spec, (size) => String(size), "or")} deals`,
  war: (spec) => `for ${defaulted(spec, (size) => String(size), "or")} turns at most`,
};

/** A game's sizes in words, the default one saying so: "50 or 100 (the usual game)". */
function defaulted(spec: PartySpec, word: (size: number) => string, join: string): string {
  return listed(
    spec.sizes.map((size) => `${word(size)}${size === spec.defaultSize && spec.sizes.length > 1 ? " (the usual game)" : ""}`),
    join,
  );
}

/** The boards, or the words, a party game's set-up offers: "on 3×3, 4×4, 5×5 and 6×6 boxes". */
export function partyBoardsWords(kind: PartyKind): string {
  return OFFERED_WORDS[kind](PARTY_SPECS[kind]);
}

/**
 * What each table says of itself on its rules page: how a turn is made on
 * it, and its house rules — the ways this site's table keeps the game, and
 * (`more`) any rule of the game's own the table has had to settle.
 */
const TABLE_WORDS: Record<PartyKind, { turn: string; house: string; more?: readonly string[] }> = {
  dotsAndBoxes: {
    turn: "The line at the top says whose turn it is, by name, colour and letter. Tap between two dots to draw; when you close a box it says so, and it is still your turn.",
    house: "Every claimed box carries its owner's letter as well as their colour, so nobody has to tell two colours apart to count.",
  },
  superghost: {
    turn: "The line at the top says whose turn it is, by name, colour and letter. Tap a letter on the keyboard, then Add before or Add after; or press Challenge. When challenged, type the word you had in mind and press Enter: the game checks it against its word list.",
    house:
      "The site checks every word against its own list: SCOWL's English words, and the readings of JMdict for Japanese. A word named that is not in the list is handed back to try again, rather than losing the round to a typo; say you cannot name one to give the round up. Each player's letters are written out beside their name, and a player who is out is struck through as well as greyed.",
  },
  mancala: {
    turn: "The line at the top names whose turn it is and which rules are being played. Tap one of your own pits, ringed in your colour, to sow it: the seeds fall one at a time, and the line beneath says what the last one did, another turn or how many were captured.",
    house: "Every pit and store shows how many seeds it holds as a number beside the seeds themselves, so nobody has to count them.",
  },
  tenka: {
    turn: "The bar under the map says whose turn it is and what comes next: Place, Attack, Fortify, End turn. Tap a territory to choose it — the ones it can reach light up — then tap where to go. On a phone the map comes close when you choose where to attack or move from; tap a continent's name under the map to look at it, pinch or scroll to zoom, drag to look round, and World to see it all again. A tap on the sea takes the nearest territory within a fingertip.",
    house: "Every territory shows its owner's letter as well as their colour, so nobody has to tell two colours apart to count. The neutral army is grey, with N.",
    more: [
      "Starting armies: forty each for two players (and forty for the neutral army), thirty-five each for three, thirty for four, twenty-five for five, twenty for six. They are placed at random to start quickly, or by hand, one at a time round the table, if you choose.",
      "The defender always throws as many dice as allowed — two with two armies or more, one with one — since more never hurts a defence. Dice are thrown by the game, not by a person, and a reloaded page throws nothing again: every die is kept with the game.",
      "A card shows a territory and one of three kinds: land, sea or air. A set that includes a territory you hold puts two more armies straight onto it. Cards traded in go back under the deck once it runs out.",
      "Choose Several devices at the set-up and each player plays on their own phone or computer: a buddy, anyone with the link, in any seat. Each sees their own cards face up and how many everybody else holds; the table waits on My games between turns.",
    ],
  },
  mexicanTrain: {
    turn: "Hands are secret: between two people's turns the table covers the hand and names who to pass the device to, and it shows only once that player says it is them. Drag a tile onto the end of a train, or tap the tile and then the train; tap a tile twice to lay it on the only train it fits, when there is just one. The trains it may go on are lit. With nothing to lay, press Draw, then lay the tile drawn or press Pass.",
    house:
      "Each train shows its last few tiles and how many are laid on it before them, so the table fits a phone and every open end is where it always is; a marker out is drawn at the train's start. Pips are drawn in a colour of their own for each number, as most double-twelve sets are, so a nine and a twelve are told apart at a glance. The set-up offers the common house rules: a short game of half the rounds, chained doubles, and a Mexican Train that only opens once your own train has started. Computer players can take any seat, and play in the browser. Choose Several devices at the set-up and each player plays on their own phone or computer, a buddy, anyone with the link or a computer in any seat, and sees only their own tiles; the table waits on My games between turns.",
  },
  diceWar: {
    turn: "The line at the top says which round it is and what the last throw did. Press Roll the dice: every person at the table throws at once, the computers' dice come with theirs, and each player's dice and their total are written in their row. The highest total scores; players tied for it are ringed and marked War, and only they roll again.",
    house:
      "The dice are thrown by Korokoro, the open-source dice package behind the Dice tab, from your device's own cryptographic generator, and every throw is kept with the game, so a reloaded page throws nothing again. A computer's dice come from the game's seed. Nothing is hidden, so there is no device to pass: anybody at the table presses Roll. The sound of the dice is off until you turn it on.",
    more: [
      "A war left to computers alone is thrown for them, a moment after the last throw.",
      "A round that ties again and again goes on; after a hundred wars it is called off and nobody scores, which with two or more sides to a die never happens in practice.",
    ],
  },
  yacht: {
    turn: "The line at the top says whose turn it is and which roll this is. Press Roll, or tap the dice tray, to throw; tap a die to hold it (it is ringed and marked HELD) and tap again to let it go. Every box you could write the dice into shows what it would score; tap one to write it down, and the dice pass on.",
    house:
      "Dice are thrown by the game from a fresh random seed, and every roll is kept with the game, so a reloaded page throws nothing again. A computer can take any seat and plays in the browser, a moment at a time so the table can watch. The sound of the dice is off until you turn it on.",
    more: ["A second Yacht scores nothing more: once the Yacht box is filled, five of a kind is written into another box like any other throw."],
  },
  pachisi: {
    turn: "The line at the top says whose turn it is. Press Roll the dice to throw. The values you may use appear under the dice: choose one (the first that can move is chosen for you), then tap a ringed pawn to move it that far. A 20 or a 10 you earn joins them. When both dice add up to five, a button enters a pawn with the two together.",
    house:
      "Dice are thrown by the game from a fresh random seed, and every throw is kept with the game, so a reloaded page throws nothing again. A computer can take any seat and plays in the browser, a moment at a time so the table can watch. The sound of the dice is off until you turn it on.",
    more: ["A pawn entering onto its own entry square takes a lone opponent standing there, though the entry square is otherwise safe.", "Two players sit on opposite arms of the cross."],
  },
  hitotsu: {
    turn: "The line over the table says whose turn it is, which colour to follow, and which way play is going round. Your hand is along the foot of the table: tap a card to choose it (it rises) and press Play, or tap a card twice to play it at once. A wild asks which colour to call, and a seven, with sevens and zeros on, which player to swap hands with. With two cards left, press Hitotsu! before you play. Facing a draw, press Take it — or stack, or Challenge a Wild Draw Four. A computer plays its own seat by itself, a moment after its turn comes.",
    house:
      "When two or more people share the device, the table asks for it to be passed on by name between turns, and shows nobody's cards until that player says they have it; a table of one person and computers never asks. Every card carries its colour's element in its corners — 火 red, 土 yellow, 木 green, 水 blue — so colour is never the only sign of it. Choose Several devices at the set-up and each player plays on their own phone or computer: a buddy, anyone with the link or a computer in any seat, each seeing only their own hand.",
    more: [
      "The house rules, each a choice at the set-up, the published rule first:",
      "Stacking: off (the published rule); the same card, a Draw Two on a Draw Two and a Wild Draw Four on a Wild Draw Four; or any draw card (progressive draw), a Wild Draw Four on a Draw Two too, and a Draw Two of the colour called on a Wild Draw Four. The next player who cannot stack takes the whole total.",
      "Jump-in: a card identical to the one on top, the same colour and the same number or symbol, may be played out of turn by anybody holding one, and play goes on from them. Played at a table of one person with computers, where the other hands are the computers'.",
      "Sevens and zeros: a seven swaps your hand with a player of your choice, and a zero passes every hand on, in the direction of play.",
      "Draw until you can play: draw until a card goes, rather than one.",
      "No bluffing: a Wild Draw Four may go down only when you hold nothing of the colour on top, and it cannot be challenged.",
      "Party mode: five cards each, one hand, and stacking, jumping in and sevens and zeros on.",
      "The first card turned up is always a number; an action card or a wild turned up goes back under the stock. A draw card played as your last card is still taken by the next player, and counts against them.",
    ],
  },
  hearts: {
    turn: "The line over the table says whose turn it is, by name. Your hand is along the foot of the table: tap a card to choose it (it rises), then press the button for the play; or drag it onto the table; or tap a card twice to play it at once, where that is the only thing it can do. A computer plays its own seat by itself, a moment after its turn comes. Passing, choose three cards and press Pass.",
    house: "When two or more people share the device, the table asks for it to be passed on by name between turns, and shows nobody's cards until that player says they have it; a table of one person and computers never asks. Every other hand is drawn face down. A red card carries a fine red line inside its edge, so colour is never the only sign of it. Nothing is rated or kept anywhere but this browser.",
    more: ["The computer never tries to shoot the moon, though it will be charged the twenty-six if you do."],
  },
  bigTwo: {
    turn: "The line over the table says whose turn it is, by name. Your hand is along the foot of the table: tap a card to choose it (it rises), then press the button for the play; or drag it onto the table; or tap a card twice to play it at once, where that is the only thing it can do. A computer plays its own seat by itself, a moment after its turn comes. Choose every card of a pair or a five-card hand before pressing Play; Pass gives up the trick.",
    house: "When two or more people share the device, the table asks for it to be passed on by name between turns, and shows nobody's cards until that player says they have it; a table of one person and computers never asks. Every other hand is drawn face down. A red card carries a fine red line inside its edge, so colour is never the only sign of it. Nothing is rated or kept anywhere but this browser.",
    more: ["The lowest card dealt leads every deal, not the winner of the deal before."],
  },
  president: {
    turn: "The line over the table says whose turn it is, by name. Your hand is along the foot of the table: tap a card to choose it (it rises), then press the button for the play; or drag it onto the table; or tap a card twice to play it at once, where that is the only thing it can do. A computer plays its own seat by itself, a moment after its turn comes. Choose every card of a pair or a set before pressing Play; Pass gives up the trick. Handing cards over, choose them and press Give.",
    house: "When two or more people share the device, the table asks for it to be passed on by name between turns, and shows nobody's cards until that player says they have it; a table of one person and computers never asks. Every other hand is drawn face down. A red card carries a fine red line inside its edge, so colour is never the only sign of it. Nothing is rated or kept anywhere but this browser.",
  },
  goFish: {
    turn: "The line over the table says whose turn it is, by name. Tap a card in your hand to choose its rank, then tap the player to ask, or choose them and press Ask. Everything asked and answered is written under the table, as it would be said aloud.",
    house: "When two or more people share the device, the table asks for it to be passed on by name between turns, and shows nobody's cards until that player says they have it; a table of one person and computers never asks. Every other hand is drawn face down. A red card carries a fine red line inside its edge, so colour is never the only sign of it. Nothing is rated or kept anywhere but this browser.",
  },
  crazyEights: {
    turn: "The line over the table says whose turn it is, by name. Your hand is along the foot of the table: tap a card to choose it (it rises), then press the button for the play; or drag it onto the table; or tap a card twice to play it at once, where that is the only thing it can do. A computer plays its own seat by itself, a moment after its turn comes. An eight asks which suit to call. Press Draw when you cannot play, and Pass when the card you drew cannot be played either.",
    house: "When two or more people share the device, the table asks for it to be passed on by name between turns, and shows nobody's cards until that player says they have it; a table of one person and computers never asks. Every other hand is drawn face down. A red card carries a fine red line inside its edge, so colour is never the only sign of it. Nothing is rated or kept anywhere but this browser.",
    more: ["You may draw only when you cannot play, one card at a time, and may play the card you drew if it matches.", "The first player moves one seat round the table each hand."],
  },
  spades: {
    turn: "The line over the table says whose turn it is, by name, and who their partner is. To bid, press Nil or a number of tricks under your hand. Then your hand is along the foot of the table: tap a card to choose it (it rises), then press Play; or drag it onto the table; or tap a card twice to play it at once. A computer plays its own seat by itself, a moment after its turn comes. Beside each name is what they bid and how many tricks they have taken.",
    house: "When two or more people share the device, the table asks for it to be passed on by name between turns, and shows nobody's cards until that player says they have it; a table of one person and computers never asks. Every other hand is drawn face down. A red card carries a fine red line inside its edge, so colour is never the only sign of it. Nothing is rated or kept anywhere but this browser.",
    more: [
      "Partners are the first and third seats against the second and fourth, and any of them may be a computer.",
      "There is no blind nil, and no bid of ten tricks for a bonus: a bid is nil or one to thirteen, scored as above.",
    ],
  },
  ginRummy: {
    turn: "The line over the table says whose turn it is, by name. Press Draw from the stock, or Take to pick up the card on the discard pile. Then tap a card in your hand to choose it (it rises) and press Throw, or tap it twice to throw it at once; with ten or less of deadwood, press Knock instead (it reads Gin! with none). Your deadwood at its best is written on the table. A computer plays its own seat by itself, a moment after its turn comes.",
    house: "When two people share the device, the table asks for it to be passed on by name between turns, and shows nobody's cards until that player says they have it; one person against the computer never asks. The other hand is drawn face down, and the table works out every hand's melds for you, laying down the best. A red card carries a fine red line inside its edge, so colour is never the only sign of it. Nothing is rated or kept anywhere but this browser.",
    more: [
      "The first player of each hand simply draws, from the stock or the upcard: there is no offering of the first upcard. The first player alternates hand by hand.",
      "When a knock is laid down, the other player's melds are laid first and then whatever fits the knocker's melds is laid off onto them. There are no box, line or game bonuses: the score is the hands' points, and the first to the total wins.",
    ],
  },
  euchre: {
    turn: "The line over the table says whose turn it is, by name, and who their partner is. While trumps are made, press Order up (Pick up, for the dealer) or Pass, and in the second round a Call button for a suit, or Pass. A dealer who picked the card up chooses one card and presses Throw away. Then tap a card to choose it (it rises) and press Play, drag it onto the table, or tap it twice to play it at once. Trumps, and who made them, are written on the table. A computer plays its own seat by itself, a moment after its turn comes.",
    house: "When two or more people share the device, the table asks for it to be passed on by name between turns, and shows nobody's cards until that player says they have it; a table of one person and computers never asks. Every other hand is drawn face down, and your hand is sorted with trumps last, the left bower among them. A red card carries a fine red line inside its edge, so colour is never the only sign of it. Nothing is rated or kept anywhere but this browser.",
    more: [
      "The dealer must name trumps if everybody passes in the second round (stick the dealer), so every hand is played.",
      "There is no going alone: every hand is played by all four, and taking all five tricks scores two.",
    ],
  },
  cribbage: {
    turn: "The line over the table says whose turn it is, by name. First choose two cards (they rise) and press Lay to the crib. Then, in the pegging, tap a card and press Play, drag it onto the table, or tap it twice to play it at once; the count and what each card scored are written on the table, and a go is called for you when you cannot play. After the pegging, both hands and the crib are shown and counted on the table. A computer plays its own seat by itself, a moment after its turn comes.",
    house: "When two people share the device, the table asks for it to be passed on by name between turns, and shows nobody's cards until that player says they have it; one person against the computer never asks. The other hand is drawn face down, and the table counts every show for you. A red card carries a fine red line inside its edge, so colour is never the only sign of it. Nothing is rated or kept anywhere but this browser.",
    more: [
      "Seat one deals first, and the deal passes each hand. The score is kept as numbers beside each name rather than pegs on a board.",
      "Nothing is claimed by hand: every fifteen, pair, run, go and show is counted for you, so there is no muggins, taking points a player missed.",
    ],
  },
  ohHell: {
    turn: "The line over the table says whose turn it is, by name. To bid, press a number of tricks under your hand; the one the dealer may not bid is not offered. Then tap a card to choose it (it rises) and press Play, drag it onto the table, or tap it twice to play it at once. The turned card, and so trumps, sit on the table, and beside each name is what they bid and how many they have taken. A computer plays its own seat by itself, a moment after its turn comes.",
    house: "When two or more people share the device, the table asks for it to be passed on by name between turns, and shows nobody's cards until that player says they have it; a table of one person and computers never asks. Every other hand is drawn face down, and your hand is sorted with trumps last. A red card carries a fine red line inside its edge, so colour is never the only sign of it. Nothing is rated or kept anywhere but this browser.",
    more: [
      "Seat one deals first, and the deal passes to the left each time. Hands go no higher than seven cards, at three players as at four.",
      "A made bid scores ten and the bid, and a missed one nothing: no points are taken away for missing, and there is no bonus for a bid of none beyond its ten.",
    ],
  },
  war: {
    turn: "The line over the table says which turn it is and how many the game may last. Press Turn the cards over: both top cards are turned up at once, and a line under the table says what each was and who took them. Press Keep turning to let the turns come by themselves, one after another, until the game ends or you press Stop turning. A computer turns its own cards, so a table of two computers plays itself.",
    house: "Nobody holds a hand and nothing is hidden, so the device is never passed between turns: the two piles lie face down at each end of the table with their counts, and each turn's cards lie between them. A red card carries a fine red line inside its edge, so colour is never the only sign of it. Nothing is rated or kept anywhere but this browser.",
    more: [
      "A war lays three cards face down. Some tables lay one; three is how children play it in many places.",
      "The cards a player wins go back under their pile in a shuffled order, drawn from the game's seed, so a game cannot go round in a circle for ever, and a game read back from this browser plays out exactly as it did.",
      "The turn limit is the table's own, so that a game always ends: when it runs out, the player with more cards wins.",
    ],
  },
};

/**
 * A party game's rules page, in the game template: Object, Board, Play, House.
 *
 * The same `RulesPage` shape a game builds from its spec and a puzzle from
 * its own (`puzzleRulesPage`), so the one rules page draws all three. The
 * facts come from the game's spec and its copy: the players and boards are
 * `PARTY_SPECS`'s, never a second description.
 */
export function partyRulesPage(kind: PartyKind): RulesPage {
  const copy = PARTY_DISPLAY[kind];
  const object = [copy.tagline, copy.rules.at(-1) ?? copy.tagline];
  const board = [`Played ${partyBoardsWords(kind)}. ${copy.board}`, `For ${partyPlayersWords(kind)}, passing one phone or tablet round the table.`];
  const play = [...copy.rules.slice(0, -1), TABLE_WORDS[kind].turn];
  const house = [
    TABLE_WORDS[kind].house,
    ...(TABLE_WORDS[kind].more ?? []),
    "The game is kept in the browser it is played in, after every move: close the tab, answer a call, and it is there when you come back, waiting on My games under Pass and play.",
    "Nothing is rated, nothing is sent to the site, and no ladder counts a game. A party game is for the people round the table.",
  ];

  return {
    variant: kind,
    title: copy.label,
    kanji: copy.kanji,
    tagline: copy.tagline,
    origin: copy.origin,
    inspiredBy: copy.inspiredBy,
    alsoKnownAs: [...(copy.alsoKnownAs ?? [])],
    from: originFor(copy.country),
    wikipedia: copy.wikipedia === undefined ? null : wikipediaUrl(copy.wikipedia),
    object,
    board,
    play,
    house,
    image: gameArtPath(kind),
  };
}
