// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import type { VariantCopy } from "../../gomoku/variants.constants";

import type { SugorokuKind } from "./sugoroku.constants";

/**
 * THE BACKGAMMON GAMES, 2026-10-01. John's late father played thousands of
 * games of them on two play-by-mail sites, and his kept record is on this site
 * (the Honors roll): every backgammon name in it said there was no game here.
 * They are played by Sugoroku (`@johnmorrisdotca/sugoroku`), the package made
 * for the purpose, whose docs/VARIANTS.md says how each variant was read and
 * from which pages, checked 2026-10-01 — ItsYourTurn.com's backgammon help and
 * tournament FAQ, GoldToken.com's rules page (from the Internet Archive's
 * copy of 2024-10-09), bkgm.com's pages on each variant, and Wikipedia.
 *
 * "Backgammon" and the others are generic names of the games. The names the
 * two sites printed for them with a match length, and their levels and
 * tournament tiers, are not ours: they appear only in a kept record
 * (`lib/legacy/gameAliases.ts`), where they lead here.
 *
 * 双六 (sugoroku) is the Japanese name for backgammon — and for its cousin, the
 * tables game that reached Japan by the seventh century — so the family takes
 * it; each game is written the way Japanese writes it, in katakana.
 */
export const SUGOROKU_DISPLAY: Record<SugorokuKind, VariantCopy> = {
  backgammon: {
    label: "Backgammon",
    kanji: "バックギャモン",
    tagline: "Race fifteen checkers round the board and bear them off first, hitting the other side's lone checkers on the way.",
    origin:
      "The most widespread of the tables games, a family whose ancestors go back at least 1,600 years. The Romans played one, tabula; a tables game, ban-sugoroku, reached Japan by the seventh century and was banned for gambling in 689. The game under its own name is first recorded in seventeenth-century England, and the doubling cube was added by gaming clubs in New York in the 1920s. Nobody owns it.",
    alsoKnownAs: ["Tables", "Western sugoroku"],
    wikipedia: "Backgammon",
    rules: [
      "Two players, white and black, each with fifteen checkers on a board of twenty-four points. Each side moves its checkers round the board the opposite way to the other and, when all fifteen are in its home board, bears them off. The first side to bear off all fifteen wins.",
      "To start, each side throws a die and the higher throw plays both dice as the first roll. After that, on your turn you roll two dice and move one checker the number on each die, or one checker both. A double plays four times.",
      "A checker may land on an empty point, one of your own, or one with a single checker of the other side, which is hit and goes to the bar. A point with two or more of the other side's checkers is blocked.",
      "A side with a checker on the bar must enter it into the other side's home board with one of its dice before it moves anything else. If it cannot, it loses the turn.",
      "You must play both dice if you can, and if only one can be played, the larger if either can. You may bear off only when every checker of yours is home, by the exact number on a die, or by a larger one when nothing is on a higher point.",
      "The cube starts in the middle, showing 1. On your turn, before you roll, you may double: the other side takes it, and the cube turns to twice the value and is theirs to redouble, or drops it and loses the game at the value before the double. The game after a side first comes within one point of winning the match is played without the cube (the Crawford rule).",
      "The first side to bear off all fifteen checkers wins. A single game is worth one point. In a match to 3, 5, 7 or 9 points a gammon (the loser has borne off nothing) is worth two and a backgammon (and the loser still has a checker on the bar or in the winner's home board) three, all multiplied by the cube.",
    ],
    board:
      "A single game is the plain game and the quickest. Choose a match to 3, 5, 7 or 9 points to play with the doubling cube, gammons and the Crawford rule. Round one device, against the computer at four strengths, or on two devices.",
  },
  nackgammon: {
    label: "Nackgammon",
    kanji: "ナックギャモン",
    tagline: "Backgammon with four back checkers each instead of two: a longer game, with more to hit and more to fear.",
    origin:
      "Invented by the backgammon master Nack Ballard, who gave the game his name. One checker from each side's six point and midpoint is moved to the other side's two point, so each side starts with four checkers back instead of two. It is played with the doubling cube.",
    wikipedia: "Nackgammon",
    rules: [
      "The rules are those of backgammon, from a different start: each side has two checkers on its 24 point (the other side's one point), two on its 23 point, four on its midpoint, three on its eight point and four on its six point.",
      "Roll two dice and move one checker each die or one checker both; a double plays four times. Hit a lone checker and it goes to the bar and must enter before anything else moves. A point of two or more is blocked.",
      "The first side to bear off all fifteen checkers wins, but only with every checker home. A single game is one point. In a match, a gammon is two points and a backgammon three, times the doubling cube, with the Crawford rule.",
    ],
    board:
      "With four checkers back each, the early game is full of hits, and gammons are common. Play a single game to learn it, or a match to 3, 5, 7 or 9 points with the cube.",
  },
  longGammon: {
    label: "Long Gammon",
    kanji: "ロングギャモン",
    tagline: "All fifteen checkers start on the one point the other side bears off from, and must come all the way round.",
    origin:
      "A backgammon variant in which each side's fifteen checkers all begin on the other side's one point (the 24 point), so every one has the whole board to travel. It is played with the doubling cube, and a gammon and a backgammon count double and triple as usual.",
    wikipedia: "Tables game",
    rules: [
      "The rules are those of backgammon, from a different start: all fifteen of each side's checkers begin on its 24 point, the point the other side bears off from.",
      "Roll two dice and move one checker each die or one checker both; a double plays four times. Hit a lone checker and it goes to the bar and must enter before anything else moves. A point of two or more is blocked.",
      "The first side to bear off all fifteen checkers wins, but only with every checker home. A single game is one point. In a match, a gammon is two points and a backgammon three, times the doubling cube, with the Crawford rule.",
    ],
    board:
      "Fifteen checkers on one point block the whole of the other side's start, so the first moves matter. It is the longest game of the family: play a single game, or a match to 3, 5, 7 or 9 points.",
  },
  hypergammon: {
    label: "Hypergammon",
    kanji: "ハイパーギャモン",
    tagline: "Backgammon with only three checkers each, on the farthest three points: short, sharp, and over in minutes.",
    origin:
      "A short backgammon variant with three checkers each, started on the other side's one, two and three points (the 24, 23 and 22 points). It is played with the doubling cube. The computer scientist Hugh Sconyers solved it in the early 1990s: every position of it has a known best move.",
    wikipedia: "Hypergammon",
    rules: [
      "The rules are those of backgammon with three checkers each instead of fifteen, one on each of its 24, 23 and 22 points.",
      "Roll two dice and move one checker each die or one checker both; a double plays four times. Hit a lone checker and it goes to the bar and must enter before anything else moves. A point of two or more is blocked.",
      "The first side to bear off all three checkers wins, but only with all three home. A single game is one point. In a match to 3 or 5 points, a gammon is two and a backgammon three, times the doubling cube, with the Crawford rule.",
    ],
    board:
      "Three checkers each means almost every position has a hit in it, and a game is over in a few minutes. Play a single game, or a match to 3 or 5 points with the cube.",
  },
  backgammonRace: {
    label: "Backgammon Race",
    kanji: "レースギャモン",
    tagline: "Every checker starts off the board, on the bar, and is entered with the dice as the game goes — and hits still happen.",
    origin:
      "A backgammon variant that begins with every checker off the board: each side's fifteen start on the bar and are entered into the other side's home board with the dice as the game goes. It looks like a race from nothing, but the sides still meet and hit. It is related to the American game of acey-deucey, though a double is played here as in backgammon.",
    rules: [
      "The rules are those of backgammon, from a different start: all fifteen of each side's checkers are off the board and enter into the other side's home board, a die at a time, as the game goes.",
      "Roll two dice and move one checker each die or one checker both; a double plays four times. A checker may be entered whenever you like. A checker that is hit goes to the bar, and must be entered before anything else is moved.",
      "A point of two or more of the other side's checkers is blocked.",
      "The first side to bear off all fifteen checkers wins, but only with every checker home. A single game is one point. In a match to 5 points, a gammon is two and a backgammon three, times the doubling cube, with the Crawford rule.",
    ],
    board: "Nothing is on the board to begin with, so there is no opening to learn: the first rolls make it. Play a single game, or a match to 5 points with the cube.",
  },
  antiBackgammon: {
    label: "Anti-Backgammon",
    kanji: "アンチギャモン",
    tagline: "Backgammon played to lose: whoever bears off all fifteen checkers first loses.",
    origin:
      "A backgammon played in reverse. The board and the moves are the usual ones, but the side that bears off every checker first loses, so a lead in the race is a burden and a hit is a gift. There is no doubling cube and no gammon. A game that reaches 500 turns each is a draw.",
    rules: [
      "The rules are those of backgammon, but the object is to be last: whoever bears off all fifteen checkers first loses the game.",
      "Roll two dice and move one checker each die or one checker both; a double plays four times. Hit a lone checker and it goes to the bar and must enter before anything else moves. A point of two or more is blocked. You must play both dice if you can.",
      "A side bears off only with every checker home. There is no doubling cube, and no gammon or backgammon: a game is worth one point.",
      "The first side to bear off all fifteen checkers loses, and the other side wins. A game that reaches 500 turns for each side is a draw.",
    ],
    board: "Every game is one point. The side that wants to hold back has to be careful of a bear-off it cannot refuse: you must play what you can.",
  },
  tabula: {
    label: "Tabula",
    kanji: "タブラ",
    tagline: "The Roman game that backgammon came from: three dice, both sides going the same way round the same track.",
    origin:
      "Tabula, a board, was a Greek and Roman game for two with three dice, and gave its name to the whole tables family that backgammon belongs to. No complete rules survive, so the rules here are the reconstruction on bkgm.com, read on 2026-10-01.",
    wikipedia: "Tabula (game)",
    rules: [
      "Two players, fifteen checkers each, all off the board to begin. Both sides enter at the same end of the board and move the same way round to the finish, so a side behind can hit a lone checker of the side in front and the side in front cannot hit back.",
      "To start, each side throws a die; the higher goes first and then rolls its own three dice. A roll is three dice, played one checker each, or one checker on any of them. There are no special doubles: a double is three moves like any other.",
      "A lone checker may be hit: it goes back off the board and must be entered before anything else moves. A point of two or more is blocked.",
      "You may not move a checker into the second half of the board until all fifteen of yours have entered. You must play all three numbers if you can.",
      "The first side to bear off all fifteen checkers wins, but only with every checker home in the last quarter of the track. There is no doubling cube, and a game is worth one point.",
    ],
    board: "Every game is one point, and there is no doubling cube. The track is one way round for both sides, so it reads as a race with a few dangers; the board here is drawn as a backgammon board.",
  },
};
