// Relative, like the rest of what `gameKeys.ts` imports: the browser specs import it, and Playwright resolves no alias.
import type { VariantCopy } from "../gomoku/variants.constants";

import type { CasualKind, CasualSpec } from "./casual.types";

/**
 * THE CASUAL GAMES, by key. Karakuri's eight (`@johnmorrisdotca/karakuri`,
 * 2026-10-05): small games for a finger, each with five levels (four stories
 * for Choice Story) that step up, played alone, kept only on the device they
 * are played on, never rated and worth no points and no XP.
 */
export const CASUAL_KINDS = {
  saveTheCharacter: "saveTheCharacter",
  pinRescue: "pinRescue",
  nutsAndBolts: "nutsAndBolts",
  stretchGrabber: "stretchGrabber",
  gridEscape: "gridEscape",
  ropeCut: "ropeCut",
  tubeSort: "tubeSort",
  choiceStory: "choiceStory",
} as const satisfies Record<CasualKind, CasualKind>;

/** The key of the family the casual games are at home in, and so its address: `/games/karakuri`, answered by the game page's own route (`CasualFamilyPage`). */
export const CASUAL_FAMILY_KEY = "karakuri";

/** Every casual game, in the order its family shows them. Read by the gate, the catalogue and the shelf. */
export const CASUAL_KIND_LIST: readonly CasualKind[] = [
  CASUAL_KINDS.gridEscape,
  CASUAL_KINDS.tubeSort,
  CASUAL_KINDS.nutsAndBolts,
  CASUAL_KINDS.pinRescue,
  CASUAL_KINDS.ropeCut,
  CASUAL_KINDS.saveTheCharacter,
  CASUAL_KINDS.stretchGrabber,
  CASUAL_KINDS.choiceStory,
];

/** What each is: its id in the package, its levels, how it is played. The levels are held to the package's by `casual.coverage.test.ts`. */
export const CASUAL_SPECS: Record<CasualKind, CasualSpec> = {
  saveTheCharacter: { id: "save-the-character", levels: 5, gesture: "drag", physics: true },
  pinRescue: { id: "pin-rescue", levels: 5, gesture: "tap", physics: true },
  nutsAndBolts: { id: "nuts-and-bolts", levels: 5, gesture: "tap", physics: false },
  stretchGrabber: { id: "stretch-grabber", levels: 5, gesture: "drag", physics: false },
  gridEscape: { id: "grid-escape", levels: 5, gesture: "drag", physics: false },
  ropeCut: { id: "rope-cut", levels: 5, gesture: "drag", physics: true },
  tubeSort: { id: "tube-sort", levels: 5, gesture: "tap", physics: false },
  choiceStory: { id: "choice-story", levels: 4, gesture: "tap", physics: false },
};

/** The casual game a package id names, or null. */
export function casualKindOfId(id: string): CasualKind | null {
  return CASUAL_KIND_LIST.find((kind) => CASUAL_SPECS[kind].id === id) ?? null;
}

/**
 * The copy, in the shape a game's and a puzzle's are (`VariantCopy`), so the
 * rules page, the catalogue's cards and the family's shelf draw a casual game
 * with the template they already have. None of these games has a country or a
 * Wikipedia article: they are kinds of small game, not old games with a history.
 */
export const CASUAL_DISPLAY: Record<CasualKind, VariantCopy> = {
  saveTheCharacter: {
    label: "Save the Character",
    kanji: "守護",
    tagline: "Draw one line to shelter him, let go, and keep him safe from the bees and the rocks for three seconds.",
    origin:
      "A kind of small physics game that fills phones: draw a shape, let it fall, and see whether it holds. The rules here are our own, on the Karakuri package's physics, with bees, rocks and a line, all drawn in code. Nobody owns the idea.",
    rules: [
      "Before you let go, nothing moves. Put a finger down and drag to draw one line. It uses ink, shown by the bar at the foot of the board; when the ink is gone the line stops. A line shorter than a thumb is thrown away and you draw again.",
      "When you let go, the line becomes a solid body and falls under gravity, landing on the ledges and on the character, and the danger starts.",
      "Bees fly straight at the character and go over or round whatever blocks them. Rocks fall from the marks at the top and bounce off the line.",
      "Win: three seconds after you let go, with all the danger arrived, the character has not been touched and has not fallen off his ledge.",
      "Lose: a bee or a rock touches him, or he falls off. There is only one line; Restart gives you the same level to draw again.",
    ],
    board:
      "Five levels, from bees along the ground to a small ledge with no floor under it. A line that closes in round him on the side the danger comes from wins; a line over his head does not stop bees from the side.",
  },
  pinRescue: {
    label: "Pin Rescue",
    kanji: "救出",
    tagline: "Pull the pins in the right order: keep the hero out of the lava, and get him or the gold to the safe place.",
    origin:
      "A kind of small physics game of pins and puzzles: something rests on a pin, and what happens when you pull it is the game. The rules here are our own, on the Karakuri package's physics, with lava, water and stone made of particles. Nobody owns the idea.",
    rules: [
      "A pin is a bar that slides out of the wall holding it. Tap a pin, or its ring, to pull it. Once pulled it stays out.",
      "Pulling a pin lets what rests on it fall: the hero, the gold, the lava, the water. The hero and the gold are discs that fall, roll and rest; lava and water are heaps of particles that fall and pour.",
      "Lava that touches the hero loses. So do spikes. Where the gold has to be saved, lava that touches the gold loses too.",
      "Water that meets lava turns both to stone, which stays where it formed and is solid: the hero can stand on it.",
      "Win: the hero (or the gold, in some levels) is at rest in the safe place, the green dashed box. Nothing is on a clock; wait for things to settle between pulls.",
    ],
    board:
      "Five levels, with more pins and more ways to lose each time. Pull too soon (the hero's pin while the water is still falling) and he goes before the crust is made.",
  },
  nutsAndBolts: {
    label: "Nuts and Bolts",
    kanji: "解体",
    tagline: "Unscrew the plates in the right order: tap a free screw, and a plate with none left falls away.",
    origin:
      "A kind of small sorting-and-order puzzle: plates pinned in layers by screws, and the game is the order they come out in. The rules here are our own, and the fewest slots each level needs is worked out by a search, so every level can be won. Nobody owns the idea.",
    rules: [
      "Plates lie in layers, pinned to the board by two to five screws each. A plate on top hides the screws of the plates under it that it covers.",
      "Tap a screw that is showing to move it to a holding slot at the bottom. A covered screw cannot be tapped.",
      "A plate with no screw left falls off the board, and the screws it held leave their slots, so the slots they took are free again.",
      "Win: every plate has fallen. Lose: every holding slot is full and a plate is still on the board.",
      "Each level has exactly as many slots as the best order of play needs, so taking screws from many plates at once fills them and loses.",
    ],
    board: "Five levels, from three plates and six screws to seven plates and twenty-two. Finish one plate at a time where you can.",
  },
  stretchGrabber: {
    label: "Stretch Grabber",
    kanji: "伸縮",
    tagline: "Lead a stretchy arm round pegs and walls to the star, without touching anything red.",
    origin:
      "A kind of small reaching puzzle: an arm that grows from a base, a way round things, and hazards to keep clear of. The rules here are our own. The shortest route to the star in each level was found by a search, and the arm is given that length and a little slack. Nobody owns the idea.",
    rules: [
      "Take hold of the arm's tip with a finger or the mouse and lead it. The arm is the path the tip has taken from the base.",
      "The tip cannot enter a peg or a wall, so it slides along them and the arm bends round. The arm stretches only so far; bring the tip back along it and it draws in.",
      "Win: the tip touches the star.",
      "Lose: any part of the arm touches a red blob or a laser beam. It is at once.",
      "Let go and the arm stays where it is; take hold of the tip again to go on.",
    ],
    board: "Five levels with less arm to spare each time: in the last, the arm is only a little longer than the shortest way.",
  },
  gridEscape: {
    label: "Grid Escape",
    kanji: "脱出",
    tagline: "Slide the blocks along their lanes to clear a way, and take the key block out through the exit.",
    origin:
      "A sliding-block puzzle in the family of the car-park puzzles that have been played on paper and plastic for a century. The rules here are written from the rules alone, and every level shows its fewest possible moves, worked out by a search of every position. Nobody owns the idea.",
    rules: [
      "The board is 6 by 6. Blocks are 1 cell wide and 2 or 3 long, laid across or down, and slide only along their length. A block cannot pass another or leave the board.",
      "One block, gold with a key on it, lies across the third row. The exit is the gap in the right edge of that row.",
      "A move is one block slid from where it was to where it is let go, by any number of cells. A block let go where it started is not a move.",
      "Win: the key block reaches the exit. Lose: the moves run out; each level allows twice its fewest moves, and six more.",
    ],
    board: "Five levels, from 7 moves to 36 at the fewest.",
  },
  ropeCut: {
    label: "Rope Cut",
    kanji: "綱切り",
    tagline: "Swipe across a rope to cut it, and bring the lantern home without letting it fall into the pit.",
    origin:
      "A kind of small physics game of ropes and timing: something hangs, you cut, and it falls or swings. The rules here are our own, on the Karakuri package's physics, with a lantern, hooks, a basket and a button. Nobody owns the idea.",
    rules: [
      "A rope is a chain of points. Its top is fixed to a hook; its bottom is the lantern, which is heavy and round and rests on platforms.",
      "Swipe across a rope (drag a finger or the mouse over it) to cut it. A swipe cuts every rope link it crosses; a swipe that crosses nothing does nothing.",
      "The lantern hangs still until the first cut, then everything moves by the physics.",
      "Win: the lantern reaches the target (inside the green dashed box) or, in the button levels, touches the red button.",
      "Lose: the lantern falls below the board, into the spiked pit, or out of the sides. Some levels need the right moment, not just the right rope.",
    ],
    board: "Five levels, from one rope over a basket to three ropes, a wall and a button on a high ledge.",
  },
  tubeSort: {
    label: "Tube Sort",
    kanji: "仕分け",
    tagline: "Pour coloured layers from tube to tube until every filled tube holds one colour.",
    origin:
      "A kind of small sorting puzzle, played with coloured liquid or layers in tubes. The rules here are our own, and every level was dealt from a fixed seed and kept only if a search finds a way to win it and a dead end can be reached from it. Nobody owns the idea.",
    rules: [
      "A tube holds up to four layers, each one colour. Tap a tube to pick it up, then tap another to pour the top colour across.",
      "A pour is allowed when the tube poured from is not empty and the one poured into is not full and is either empty or has the same colour on top. It moves the whole run of that colour on top, as far as there is room.",
      "Win: every tube that has anything in it holds a single colour.",
      "Lose: no pour that does anything is left. Pouring a tube of one colour into an empty tube changes nothing, and does not count as a way out.",
      "Each colour has its own small mark, so that they can be told apart without the colour.",
    ],
    board: "Five levels, from 3 colours in 4 tubes to 7 colours in 8. Keep the empty tube free as long as you can.",
  },
  choiceStory: {
    label: "Choice Story",
    kanji: "選択",
    tagline: "A story in three stages: at each, pick the tool that helps.",
    origin:
      "A kind of small storybook game for children and grown-ups alike: something is in the way, and there are two tools to choose from. The words are plain and friendly, and the worst that ever happens is a splash, a boing or a flump. All the pictures are drawn in code. Nobody owns the idea.",
    rules: [
      "Each level is one story of three stages. A stage shows what is in the way, the character, and two tools to tap.",
      "Tap the right tool: a little animation shows it working and the next stage begins. After the third the story is won.",
      "Tap the wrong tool: it plays a harmless failure, a message says why it did not help, and the stage is tried again. The slips are counted, and the story ends with three stars if there were none.",
      "There is no clock and no way to run out of tries.",
    ],
    board: "Four stories, twelve stages: a rainy walk, a night in the cave, a snow day and treasure island.",
  },
};
