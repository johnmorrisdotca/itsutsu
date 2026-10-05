import { mkdirSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { DEFAULT_APPEARANCE, FELTS } from "../src/components/board/Board.constants";
import { PARTY_SLUGS } from "../src/lib/gomoku/slugs";
import { encodeDots, replayDots } from "../src/lib/party/dotsAndBoxes/dotsAndBoxes";
import { encodeGhost, replayGhost } from "../src/lib/party/superghost/superghost";
import { encodeMancala, replayMancala } from "../src/lib/party/mancala/mancala";
import type { PartyKind } from "../src/lib/party/party.types";
import { TENKA_PHASES } from "../src/lib/party/tenka/tenka.constants";
import { playTenka } from "../src/lib/party/tenka/tenka";
import type { TenkaGame } from "../src/lib/party/tenka/tenka.types";
import { encodeTenka } from "../src/lib/party/tenka/tenkaKeep";
import { sensibleTenkaMove } from "../src/lib/party/tenka/tenkaPolicy";
import { startTenka } from "../src/lib/party/tenka/tenkaStart";
import { computerMove, encodeTrain, playTrain, startTrain } from "@johnmorrisdotca/domino";
import { CARD_GAME_RULES } from "../src/lib/cardGames/cardGameRules";
import type { CardGameKind } from "../src/lib/cardGames/cardGames.constants";
import { playPachisi, startPachisi } from "../src/lib/party/pachisi/pachisi";
import { encodePachisi } from "../src/lib/party/pachisi/pachisiCodec";
import { pachisiComputerMove } from "../src/lib/party/pachisi/pachisiComputer";
import { gunjinMoves, playGunjin, seededRandom as gunjinRandom, startGunjin } from "../src/lib/party/gunjin/gunjin";
import { encodeGunjin } from "../src/lib/party/gunjin/gunjinCodec";
import { playYacht, startYacht } from "../src/lib/party/yacht/yacht";
import { encodeYacht } from "../src/lib/party/yacht/yachtCodec";
import { encodeHitotsu, hitotsuComputer, playHitotsu, startHitotsu } from "@johnmorrisdotca/hitotsu";
import { encodeDiceWar, playDiceWar, startDiceWar } from "@johnmorrisdotca/korokoro";
import { SUGOROKU_KIND_LIST, sugorokuStorageKey, type SugorokuKind } from "../src/lib/party/sugoroku/sugoroku.constants";
import { encodeSugoroku, playSugoroku, startSugoroku, sugorokuComputerMove, sugorokuOver, sugorokuToPlay } from "../src/lib/party/sugoroku/sugorokuTable";
import { ready } from "./support";

/**
 * One screenshot per party game, part way through, into public/art/games/ —
 * the picture on its front door, its rules page, its family's card and every
 * list that names it. Run on purpose with `pnpm screenshots:party`, which cuts
 * the thumbnail and writes the stamp after it; not part of the ordinary
 * suite, because it writes files into the repo.
 *
 * A fixed game rather than one played on the day: the same picture comes out
 * every time the board's drawing changes and the stamp says it must be
 * re-taken. The game is put where the table keeps one (this browser's
 * storage) and the table opened on it, as a player coming back to it would.
 */
const OUT = "public/art/games";

/** Where each table keeps its game: `DOTS_STORAGE_KEY`, `GHOST_STORAGE_KEY` and `MANCALA_STORAGE_KEY`, which a spec cannot import from a client module. */
const DOTS_KEPT = "itsutsu.dotsAndBoxes";
const GHOST_KEPT = "itsutsu.superghost";
const MANCALA_KEPT = "itsutsu.mancala";
/** And Tenka's: `TENKA_STORAGE_KEY`. */
const TENKA_KEPT = "itsutsu.tenka";
/** And Mexican Train's: `TRAIN_STORAGE_KEY`. */
const TRAIN_KEPT = "itsutsu.mexicanTrain";

/**
 * Four people on a double-twelve set, thirty moves into the first round, each
 * move the computer player's choice from a fixed seed: every train started,
 * some past the tiles a row shows, and the Mexican Train begun. Four people
 * rather than computers, so the table waits on the picture rather than
 * playing on while it is taken.
 */
function trainScene(): string {
  let game = startTrain(12, ["Ann", "Ben", "Cy", "Dee"], 20260929, undefined, [false, false, false, false])!;
  for (let move = 0; move < 30; move += 1) game = playTrain(game, computerMove(game))!;
  return encodeTrain(game);
}

/**
 * Two people at a game of Yacht, the second on his second roll with the most
 * common face held, each roll drawn from a fixed seed: five dice on the tray,
 * some held, a box written on the first sheet. People rather than computers, so
 * the table waits on the picture.
 */
function yachtScene(): string {
  let game = startYacht(["Ann", "Ben"], 20260930, [false, false])!;
  game = playYacht(playYacht(game, { kind: "roll", hold: 0 })!, { kind: "score", box: 12 })!;
  game = playYacht(game, { kind: "roll", hold: 0 })!;
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const die of game.dice) counts[die] += 1;
  const most = counts.indexOf(Math.max(...counts));
  const hold = game.dice.reduce((mask, die, at) => (die === most ? mask | (1 << at) : mask), 0);
  return encodeYacht(playYacht(game, { kind: "roll", hold: hold === 31 ? 0 : hold })!);
}

/**
 * Four people at Dice War with two dice each, two throws in: Ben took the
 * first, and Ann and Cy tied for the highest on the second, so it is war. People
 * rather than computers, so the table waits on the picture: the two who tied
 * are ringed and marked War, with Ben and Dee, who lost the throw, beside them.
 */
function diceWarScene(): string {
  let game = startDiceWar({ players: ["Ann", "Ben", "Cy", "Dee"], computers: [false, false, false, false], dice: 2, sides: 6, to: 10, seed: "20261001" })!;
  game = playDiceWar(game, { faces: { "0": [3, 4], "1": [6, 2], "2": [1, 5], "3": [2, 2] } })!;
  game = playDiceWar(game, { faces: { "0": [5, 5], "1": [4, 3], "2": [5, 5], "3": [1, 4] } })!;
  return encodeDiceWar(game);
}

/**
 * Four at a game of Pachisi, sixty moves in, played by the computer's rules
 * from a fixed seed: pawns out on every arm, some on the track, some still in
 * their nests. People in every seat, so the table waits on the picture.
 */
function pachisiScene(): string {
  let game = startPachisi(["Ann", "Ben", "Cy", "Dee"], 20260930, [false, false, false, false])!;
  for (let move = 0; move < 60; move += 1) game = playPachisi(game, pachisiComputerMove(game))!;
  return encodePachisi(game);
}

/**
 * Gunjin Shogi between Ann and Ben, both sides arranged and played for a few
 * dozen moves by a seeded random player until fights have thinned both armies
 * and it is Ann's move: the picture is the board as Ann sees it, her ranks
 * showing and Ben's pieces as backs, which is how the game is always shown.
 */
function gunjinScene(): string {
  const random = gunjinRandom(20261005);
  let game = startGunjin(81, ["Ann", "Ben"])!;
  const fights = () => game.match.log.filter((event) => event.capturedCount > 0).length;
  for (let at = 0; at < 400 && !(at > 4 && fights() >= 5 && game.match.currentPlayer === 0 && game.match.phase === "pass"); at += 1) {
    const offered = gunjinMoves(game);
    game = playGunjin(game, offered[Math.floor(random() * offered.length)]!)!;
  }
  return encodeGunjin(game);
}

/**
 * Four players, five rounds into a game of the whole world, played by the
 * gate's sensible player from a fixed seed and a fixed random: every colour on
 * the map, armies piled on the fronts, stopped at the start of a turn.
 */
function tenkaScene(): string {
  let seed = 11;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  let game: TenkaGame = startTenka(60, ["", "", "", ""], 20260929)!;
  while (game.round < 6 || game.phase !== TENKA_PHASES.reinforce) game = playTenka(game, sensibleTenkaMove(game, random))!;
  return encodeTenka(game);
}

/**
 * A family card game from a fixed seed, one person (Ann, in the first seat)
 * and computers in the rest, played by the computers' own choices — Ann's
 * too — until the table stands where the picture wants it and it is Ann's
 * turn: then the table waits for her, and the picture is of her hand under
 * the table, as she sees it.
 */
function cardScene(kind: CardGameKind, size: number, seats: number, when: (game: never) => boolean): string {
  const rules = CARD_GAME_RULES[kind] as unknown as { start: (...args: unknown[]) => unknown; play: (game: unknown, move: unknown) => unknown; computer: (game: unknown) => unknown; toPlay: (game: unknown) => number | null; encode: (game: unknown) => string };
  const names = ["Ann", "Ben", "Cy", "Dee", "Eve", "Fay"].slice(0, seats);
  let game = rules.start(size, names, undefined, 20260929, names.map((_, seat) => seat > 0));
  for (let move = 0; move < 2000 && !(rules.toPlay(game) === 0 && when(game as never)); move += 1) game = rules.play(game, rules.computer(game));
  return rules.encode(game);
}

/**
 * Hitotsu for four, Ann and three computers, played by the computer player —
 * Ann's turns too — until eight cards are down, one of them an action card
 * or a wild, and it is Ann's turn with nothing drawn: the table waits for
 * her, and the picture is the stock, the pile and her hand under it.
 */
function hitotsuScene(): string {
  let game = startHitotsu(500, ["Ann", "Ben", "Cy", "Dee"], 20260930, undefined, [false, true, true, true])!;
  const waiting = () => game.toPlay === 0 && game.challenge === null && game.drawn === null && game.pending === 0 && game.discard.length >= 8 && game.discard.some((card) => !/\d/.test(card[1]!));
  for (let move = 0; move < 2000 && !waiting(); move += 1) game = playHitotsu(game, hitotsuComputer(game))!;
  return encodeHitotsu(game);
}

/**
 * One of the backgammon games between two people, Ann and Ben, played by the
 * package's own computer for a fixed number of turns from a fixed seed, and
 * left with Ann to play: the picture is the board part way through, the
 * cube in play where the game has one. People rather than computers, so the
 * table waits on the picture.
 */
function sugorokuScene(kind: SugorokuKind, points: number, seed: number, turns: number): string {
  let table = startSugoroku(kind, points, ["Ann", "Ben"], seed)!;
  let random = seed;
  const next = () => {
    random = (random * 1103515245 + 12345) % 2147483648;
    return random / 2147483648;
  };
  for (let turn = 0; turn < turns || (sugorokuToPlay(table) !== 0 && !sugorokuOver(table)); turn += 1) table = playSugoroku(table, sugorokuComputerMove(table, "greedy", next)!)!;
  return encodeSugoroku(table);
}

/** A scene: the game kept, the table's test id, and what is photographed — the board in its wood, or the letters the table watches. */
const SCENES: { kind: PartyKind; stored: string; key: string; table: string; shot: string; surface?: string; width?: number; scale?: number; press?: string }[] = [
  {
    // Three players on 4×4, twenty-seven of forty lines in: seven boxes closed, in all three colours, and the last line in its drawer's.
    kind: "dotsAndBoxes",
    key: DOTS_KEPT,
    table: "dots-game",
    shot: "board-surface",
    stored: encodeDots(replayDots(4, ["", "", ""], 0, [5, 36, 16, 31, 30, 14, 20, 15, 7, 6, 28, 19, 35, 26, 12, 10, 34, 4, 33, 29, 32, 23, 27, 0, 8, 11, 9])!),
  },
  {
    // Four players in English, three rounds lost — CATS spelled, a bluff caught, PLATE named — and RCHESTRATIO on the
    // table, built out from S at both ends, with one word left that it can still become.
    // At a phone's width, where the letters take two lines and the picture comes out nearly square, as a thumbnail wants.
    kind: "superghost",
    key: GHOST_KEPT,
    table: "ghost-game",
    shot: "ghost-stage",
    width: 360,
    // Drawn at twice the pixels, so the picture is as sharp as a board's, which is photographed wider.
    scale: 2,
    stored: encodeGhost(replayGhost(4, ["Ann", "Ben", "Cy", "Dee"], "english", 0, [">c>a>t>s!", ">x>q?#", ">p>l>a?=plate."], ">s<e<h<c<r>t>r>a>t>i>o")!),
  },
  {
    // Kalah, sixteen sowings in, Ann to sow: seeds in every store and most pits, a pit of ten, and Ben's capture just made.
    kind: "mancala",
    key: MANCALA_KEPT,
    table: "mancala-game",
    shot: "board-surface",
    stored: encodeMancala(replayMancala(14, ["Ann", "Ben"], 0, [5, 12, 3, 8, 10, 2, 12, 5, 9, 4, 10, 5, 1, 7, 1, 11])!),
  },
  {
    // Four players five rounds into the whole world, every colour on the map, at the start of a turn.
    kind: "tenka",
    key: TENKA_KEPT,
    table: "tenka-game",
    shot: "board-surface",
    stored: tenkaScene(),
  },
  {
    // Four at a double-twelve table, thirty moves into the first round: the hub, every train under way, the Mexican Train begun.
    kind: "mexicanTrain",
    key: TRAIN_KEPT,
    table: "train-game",
    shot: "board-surface",
    stored: trainScene(),
  },
  {
    // Two at the table, Ann's Full house written, Ben on his second roll with three fives held: the tray, dice landed.
    kind: "yacht",
    key: "itsutsu.yacht",
    table: "yacht-game",
    shot: "board-surface",
    stored: yachtScene(),
  },
  {
    // Four round the cross, sixty moves in: pawns out on every arm, some still in their nests.
    kind: "pachisi",
    key: "itsutsu.pachisi",
    table: "pachisi-game",
    shot: "board-surface",
    stored: pachisiScene(),
  },
  {
    // Gunjin Shogi, five fights in: Ann to move, her ranks showing and Ben's army as backs. A reloaded table is covered, so Ann presses that it is her.
    kind: "gunjin",
    key: "itsutsu.gunjin",
    table: "gunjin-game",
    shot: "board-surface",
    press: "gunjin-pass-ready",
    stored: gunjinScene(),
  },
  {
    // Four at the table, two dice each: Ann and Cy have tied for the highest, so it is war, and the table waits on Roll. At a phone's width, so the four rows come out nearly square, as a thumbnail wants.
    kind: "diceWar",
    key: "itsutsu.diceWar",
    table: "dicewar-game",
    shot: "dicewar-seats",
    width: 340,
    scale: 2,
    stored: diceWarScene(),
  },
  // Hearts for four, four tricks gone and three cards on the fifth: Ann to play to it, her hand under the table.
  {
    kind: "hearts",
    key: "itsutsu.cards.hearts",
    table: "cards-game",
    shot: "cards-board",
    stored: cardScene("hearts", 100, 4, (game: { phase: string; trick: unknown[]; played: unknown[] }) => game.phase === "playing" && game.trick.length === 3 && game.played.length >= 16),
  },
  // Spades for four, the bids made, a few tricks gone and two cards on the next: Ann to play to it, her hand under the table.
  {
    kind: "spades",
    key: "itsutsu.cards.spades",
    table: "cards-game",
    shot: "cards-board",
    stored: cardScene("spades", 500, 4, (game: { phase: string; trick: unknown[]; played: unknown[] }) => game.phase === "playing" && game.trick.length === 2 && game.played.length >= 12),
  },
  // Big Two for four, a pair or better on the table for Ann to beat.
  {
    kind: "bigTwo",
    key: "itsutsu.cards.bigTwo",
    table: "cards-game",
    shot: "cards-board",
    stored: cardScene("bigTwo", 3, 4, (game: { pile: { cards: unknown[] } | null }) => (game.pile?.cards.length ?? 0) >= 2),
  },
  // President for five in the second round, titles won, a pair or more on the table for Ann to beat.
  {
    kind: "president",
    key: "itsutsu.cards.president",
    table: "cards-game",
    shot: "cards-board",
    stored: cardScene("president", 3, 5, (game: { phase: string; round: number; pile: { cards: unknown[] } | null }) => game.phase === "playing" && game.round >= 1 && (game.pile?.cards.length ?? 0) >= 2),
  },
  // Go Fish for three, a few asks in and a book down: the pond, and what was last said.
  {
    kind: "goFish",
    key: "itsutsu.cards.goFish",
    table: "cards-game",
    shot: "cards-board",
    stored: cardScene("goFish", 1, 3, (game: { log: { kind: string }[] }) => game.log.some((event) => event.kind === "book") && game.log.length >= 8),
  },
  // Crazy Eights for three, a few cards down: the stock, the discard pile, and Ann's hand to match it from.
  {
    kind: "crazyEights",
    key: "itsutsu.cards.crazyEights",
    table: "cards-game",
    shot: "cards-board",
    stored: cardScene("crazyEights", 100, 3, (game: { discard: unknown[]; drawn: unknown }) => game.discard.length >= 7 && game.drawn === null),
  },
  // Hitotsu for four, eight cards down and an action card among them: the stock, the pile, the colour to follow and Ann's hand.
  {
    kind: "hitotsu",
    key: "itsutsu.hitotsu",
    table: "hitotsu-game",
    shot: "hitotsu-board",
    stored: hitotsuScene(),
  },
  // Euchre for four, trumps made and two cards on the second trick: Ann to play to it, trumps named on the table.
  {
    kind: "euchre",
    key: "itsutsu.cards.euchre",
    table: "cards-game",
    shot: "cards-board",
    stored: cardScene("euchre", 10, 4, (game: { phase: string; trick: unknown[]; played: unknown[] }) => game.phase === "playing" && game.trick.length === 2 && game.played.length >= 4),
  },
  // Gin Rummy for two, some way into the first hand: the stock, the card on the pile, and Ann's hand to draw to.
  {
    kind: "ginRummy",
    key: "itsutsu.cards.ginRummy",
    table: "cards-game",
    shot: "cards-board",
    stored: cardScene("ginRummy", 100, 2, (game: { phase: string; stock: unknown[]; results: unknown[] }) => game.phase === "draw" && game.stock.length <= 24 && game.results.length === 0),
  },
  // Cribbage for two in the pegging: the starter, the crib face down, three cards on the count and what the last one scored.
  {
    kind: "cribbage",
    key: "itsutsu.cards.cribbage",
    table: "cards-game",
    shot: "cards-board",
    stored: cardScene("cribbage", 121, 2, (game: { phase: string; run: unknown[]; peg: unknown }) => game.phase === "pegging" && game.run.length === 3 && game.peg !== null),
  },
  // Oh Hell for four, the fifth deal under way: the turned card naming trumps, and two cards on the trick.
  {
    kind: "ohHell",
    key: "itsutsu.cards.ohHell",
    table: "cards-game",
    shot: "cards-board",
    stored: cardScene("ohHell", 13, 4, (game: { phase: string; cards: number; trick: unknown[] }) => game.phase === "playing" && game.cards === 5 && game.trick.length === 2),
  },
  // War for two, a war just played: a tied card, three face down and the card that decided it, on each side, and the piles at each end.
  {
    kind: "war",
    key: "itsutsu.cards.war",
    table: "cards-game",
    shot: "cards-board",
    stored: cardScene("war", 100, 2, (game: { last: { wars: number } | null; moves: unknown[] }) => game.last !== null && game.last.wars === 1 && game.moves.length >= 8),
  },
  // The seven backgammon games, each a few turns in with Ann to roll; the cube shows where the game has one. Their board is drawn on the cloth every felt table starts on
  // (Reversi, Gomoji, Kumimoji and the card tables read the same default, and offer the same colour patches), so it is green felt rather than the wood of the older party boards.
  ...SUGOROKU_KIND_LIST.map(
    (kind, at) =>
      ({
        kind,
        key: sugorokuStorageKey(kind),
        table: "sugoroku-game",
        shot: "board-surface",
        surface: FELTS[DEFAULT_APPEARANCE.felt as keyof typeof FELTS].label,
        stored: sugorokuScene(kind, kind === "backgammon" || kind === "nackgammon" ? 5 : 1, 20261001 + at, 12 + at),
      }) as const,
  ),
];

test.describe("party game screenshots", () => {
  test.skip(process.env.GAME_SCREENSHOTS !== "1", "Set GAME_SCREENSHOTS=1 to write them.");

  for (const scene of SCENES) {
    test.describe(scene.kind, () => {
      test.use({ deviceScaleFactor: scene.scale ?? 1 });
      test("its picture", async ({ page }) => {
        mkdirSync(OUT, { recursive: true });
        if (scene.width !== undefined) await page.setViewportSize({ width: scene.width, height: 800 });
        await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [scene.key, scene.stored]);
        await page.goto(`/games/${PARTY_SLUGS[scene.kind]}/pass-and-play`);
        await ready(page, scene.table);
        await expect(page.getByTestId(scene.table)).not.toHaveAttribute("data-state", "finished");
        // A table that covers itself on opening (Gunjin's hand-over) is uncovered by the player it names.
        if (scene.press !== undefined) await page.getByTestId(scene.press).click();
        const surface = page.getByTestId(scene.shot).first();
        // The board a member who never chose one sees: the picture is of the site's own wood (or, for a felt table, its default cloth), never an evening's choice.
        if (scene.shot === "board-surface") await expect(surface).toHaveAttribute("data-surface", scene.surface ?? "Kaya");
        // The ways of looking round a big board (Fit, the arrows) are for the player, not the picture.
        await page.addStyleTag({ content: '[data-testid$="-fit"], [data-testid$="-arrows"] { visibility: hidden !important; }' });
        // And a card game's presses and the line under its hand are for playing, not for its picture.
        await page.addStyleTag({ content: '[data-testid="cards-actions"], [data-testid="cards-hand-panel"] > p, [data-testid="hitotsu-actions"], [data-testid="hitotsu-call"] { visibility: hidden !important; }' });
        await page.mouse.move(0, 0);
        await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
        // The board in its wood, or the letters the table watches, and nothing round it, as a game's picture is taken (game-screenshots.spec.ts).
        await surface.screenshot({ path: `${OUT}/${scene.kind}.jpg`, type: "jpeg", quality: 82 });
      });
    });
  }
});
