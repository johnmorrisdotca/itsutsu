import type { VariantCopy } from "../../gomoku/variants.constants";

import type { DiceTableKind } from "./diceTable.constants";

/**
 * THE PLAIN DICE GAMES' OWN WORDS, in the shape every game's are.
 *
 * Nothing is at stake in any of them: John, 2026-09-29, of a pot of counters,
 * "is that bad?", and the answer the board row holds them to. Counters, points
 * and dice exist inside one game, start level, and are never bought, carried over
 * or swapped for XP, IP or stars.
 */
export const DICE_TABLE_DISPLAY: Record<DiceTableKind, VariantCopy> = {
  pig: {
    label: "Pig",
    kanji: "豚",
    tagline: "Throw one die as often as you dare: every number adds to your turn, and a 1 loses it all.",
    /* Checked 2026-10-31: the first description in print is John Scarne's, in Scarne on Dice (1945), and he did not claim to have invented it. */
    origin: "A game of nerve older than anybody can say. It was first described in print by John Scarne in Scarne on Dice, in 1945, and it has been a favourite of maths classes ever since, because when to stop is a real question with a real answer. Nobody owns it.",
    wikipedia: "Pig (dice game)",
    rules: [
      "On your turn, throw the die. Any number from 2 to 6 is added to your turn's points, and you choose: throw again, or bank.",
      "Bank, and your turn's points go on your score for good, and the next player throws.",
      "Throw a 1, and your turn is over and its points are gone. What you banked earlier is safe.",
      "The first to bank their way to the score wins, at once.",
    ],
    board: "Fifty points is a quick game and a hundred the usual one. Two to eight can play, with a computer in any seat. The computer banks at twenty, the old rule of thumb, unless somebody is close to winning.",
  },
  tenThousand: {
    label: "Ten Thousand",
    kanji: "一万点",
    tagline: "Six dice: set aside what scores, then throw the rest or bank the turn before a throw scores nothing.",
    /* Checked 2026-10-31: where the game began is not recorded. The name of its best-known boxed version is its owner's and appears nowhere here. */
    origin: "A folk game with no known inventor and a great many names, played with six ordinary dice wherever people have them, and named here for the score it has always been played to. Nobody owns the game.",
    alsoKnownAs: ["Dix Mille", "Hot Dice"],
    rules: [
      "On your turn throw all six dice. You must set aside at least one die that scores, then either throw the dice left or bank the points your turn has made.",
      "A 1 scores 100 and a 5 scores 50. Three 1s score 1,000, and three of any other number score a hundred times it. Four of a kind score 1,000, five 2,000 and six 3,000. One to six in a row and three pairs score 1,500, and two sets of three score 2,500.",
      "A throw with nothing that scores is a bust: your turn is over and its points are gone. Only dice from the same throw can score together.",
      "Set aside all six and you have hot dice: throw all six again, and keep adding to your turn.",
      "When somebody banks their way to the score, everybody else has one more turn to pass them. The highest total wins, and level totals share it.",
    ],
    board: "Ten thousand is the full game; five thousand or two thousand are shorter. Two to eight can play, with a computer in any seat. There is no least score to get on the board: any bank counts.",
  },
  liarsDice: {
    label: "Liar's Dice",
    kanji: "嘘つき賽",
    tagline: "Everybody's dice are hidden. Bid on what is under all the cups, or call the last bid a lie.",
    /* Checked 2026-10-31: the game is told as an old South American one, dudo, but how old is disputed, so the copy does not say. */
    origin: "A bluffing game told of as an old one from South America, where it is called dudo, \"I doubt\". How old it really is nobody can show. It has been played in bars and on ships wherever there were dice and cups, and no one owns it.",
    alsoKnownAs: ["Dudo"],
    wikipedia: "Liar's dice",
    rules: [
      "Everybody throws their dice in secret and looks only at their own. Ones are wild: they count as any number, so nobody bids on them.",
      "The first player bids how many dice, among everybody's, show one number: \"four 5s\" says at least four dice show a 5 or a 1.",
      "Each player in turn bids higher, with more dice of any number, or as many of a higher number. Or they call the last bid a lie.",
      "On a call every cup is lifted and the dice are counted. If the bid falls short the bidder loses a die; if it stands the caller does. Then everybody throws again, and the loser opens.",
      "Lose your last die and you are out. The last player with dice wins.",
    ],
    board: "Five dice each is the usual game and three a quick one. Two to eight can play, three or more is best, and a computer can take any seat: it reads its own dice and how many are on the table, and nothing else.",
  },
  sayu: {
    label: "Sayu",
    kanji: "左右",
    tagline: "Throw and pass your counters left, right or into the pot, until one player alone still holds any.",
    /* The name is the site's own: 左右, left and right. The rules of a game are nobody's. */
    origin: "A game for a whole table, of the old family in which the dice pass counters from hand to hand and nobody decides anything. Its name here is our own, from the Japanese 左右, sayū, \"left and right\". The counters are only counters: they exist inside one game and are worth nothing outside it.",
    rules: [
      "Everybody starts with the same number of counters. On your turn throw one die for each counter you hold, three dice at most.",
      "Each die sends a counter on: a 1 to the player on your left, a 2 to the player on your right, a 3 into the pot. A 4, 5 or 6 stays with you.",
      "Hold no counters and you do not throw, but you are not out: a neighbour may yet pass you one.",
      "When only one player still holds counters, they win, and the pot with them.",
    ],
    board: "Three counters each is the usual game; two is quick, and five takes a while. Two to eight can play, and it is at its best with a crowd. There is nothing to decide, so anybody can play, whatever their age, and a computer can take any seat.",
  },
};
