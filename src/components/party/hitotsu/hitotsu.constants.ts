import type { HitotsuColour, HitotsuOptions } from "@/lib/party/hitotsu/hitotsu.types";

/** Where this browser keeps its game of Hitotsu: one at a time, apart from every other table's. */
export const HITOTSU_STORAGE_KEY = "itsutsu.hitotsu";

/** The widest a card in a hand is drawn, in pixels. */
export const HITOTSU_HAND_CARD_PX = 76;

/**
 * THE DECK'S OWN LOOK: four colours, each with one of the five elements in
 * its corners so a card is never told by colour alone, and the wilds in the
 * ink of a brush with all four. Fixed in both themes, as a card is an object
 * on the table (`surface-light`).
 */
export const HITOTSU_COLOUR_LOOK: Record<HitotsuColour | "W", { fill: string; ink: string; element: string; name: string }> = {
  R: { fill: "#c8372d", ink: "#ffffff", element: "火", name: "Red" },
  Y: { fill: "#dfa11b", ink: "#1f1a12", element: "土", name: "Yellow" },
  G: { fill: "#2f8a4f", ink: "#ffffff", element: "木", name: "Green" },
  B: { fill: "#2a5ea8", ink: "#ffffff", element: "水", name: "Blue" },
  W: { fill: "#24201d", ink: "#ffffff", element: "五", name: "Wild" },
};

/** What each face shows in the middle of a card and in its corners. */
export const HITOTSU_FACE_MARK: Record<string, string> = { S: "⊘", R: "⇄", D: "+2", W: "", F: "+4" };

/** The house rules offered at the set-up, each a pair of tiles or three, with its one line. */
export const HITOTSU_HOUSE_COPY = {
  stacking: {
    legend: "Stacking draw cards",
    names: { off: "Off", same: "Same card", any: "Any draw card" } as Record<HitotsuOptions["stacking"], string>,
    lines: {
      off: "A draw card is taken at once.",
      same: "+2 on +2, +4 on +4: the next takes the total.",
      any: "Progressive: any draw card on any.",
    } as Record<HitotsuOptions["stacking"], string>,
  },
  jumpIn: { legend: "Jump-in", on: "Play an identical card out of turn.", off: "Nobody plays out of turn.", people: "Played with one person and computers." },
  sevenZero: { legend: "Sevens and zeros", on: "A 7 swaps hands; a 0 passes every hand on.", off: "Sevens and zeros are plain numbers." },
  drawToMatch: { legend: "Drawing", on: "Draw until a card goes.", off: "Draw one card." },
  wildFour: {
    legend: "Wild Draw Four",
    names: { challenge: "May be challenged", strict: "No bluffing" } as Record<HitotsuOptions["wildFour"], string>,
    lines: {
      challenge: "Play it any time; the next player may challenge.",
      strict: "Only with nothing of the colour; no challenge.",
    } as Record<HitotsuOptions["wildFour"], string>,
  },
} as const;

export const HITOTSU_COPY = {
  lead: "Hitotsu for two to eight round one phone or tablet, with a computer in any seat — or choose Several devices, and each plays on their own. Match the colour or the number, and call Hitotsu! with one card left. Nothing here is rated.",
  mode: "Which game?",
  classic: "Classic",
  classicLine: "Seven cards each, to 500, the published rules.",
  party: "Party",
  partyLine: "Five cards each, one hand, and the party rules on.",
  howMany: "How many are playing?",
  length: "How long",
  oneHand: "One hand",
  to: (size: number) => `To ${size}`,
  seats: "Who sits where",
  house: "House rules",
  on: "On",
  off: "Off",
  start: "Start",
  computer: "Computer",
  computerName: (seat: number) => `Computer ${seat + 1}`,
  onePerson: "Every table needs a person: at least one seat is yours.",
  kept: "Kept in this browser: leave and come back, and it is here.",
  yourHand: "Your hand",
  handOf: (name: string) => `${name}'s hand`,
  passTo: (name: string) => `Pass the device to ${name}`,
  passNote: "Nobody's cards are shown until they have it.",
  ready: (name: string) => `I am ${name}: show my cards`,
  thinking: (name: string) => `${name} is thinking…`,
  toPlay: (name: string) => `${name} to play`,
  follow: (colour: string) => `${colour} to follow`,
  round: (clockwise: boolean) => (clockwise ? "Play goes to the left ↻" : "Play goes to the right ↺"),
  facing: (name: string, count: number) => `${name} faces +${count}: stack a draw card, or take them.`,
  challengeOpen: (name: string, by: string) => `${name}: take the four, or challenge ${by}'s Wild Draw Four.`,
  drew: (name: string) => `${name} drew: play the card drawn if it goes, or keep it.`,
  stock: (count: number) => (count === 0 ? "No stock" : `${count} to draw`),
  play: "Play",
  playWhy: "Choose a card that matches the colour or the number.",
  notThat: "That card does not go on this one.",
  draw: "Draw",
  keep: "Keep it",
  pass: "Pass",
  take: (count: number) => `Take ${count}`,
  challenge: "Challenge",
  call: "Hitotsu!",
  called: "Hitotsu! called",
  callHelp: "Call it before your second-last card goes down, or take two.",
  jumpIn: "Jump in",
  callColour: (colour: string) => `Call ${colour}`,
  swapWith: (name: string) => `Swap with ${name}`,
  cards: (count: number) => `${count} ${count === 1 ? "card" : "cards"}`,
  one: "Hitotsu!",
  over: "Game over",
  won: (names: string) => `${names} won.`,
  again: "Play again, same table",
  newGame: "New game",
  confirmNew: "Start a new game? This one will be gone.",
  confirmYes: "Yes, start again",
  confirmNo: "Keep playing",
  scores: "Scores",
  scoreWords: "Points, first to the total wins",
  handWords: "One hand: first out wins",
  about: "About Hitotsu, its rules and its family",
  playButton: "Play →",
  continue: "Continue →",
  card: "Cards on this device",
  idleDetail: "Nothing has moved at this table for a couple of minutes. There is no clock here; the game simply waits.",
  idleKept: "This game is kept in this browser. It will be here when you come back.",
} as const;
