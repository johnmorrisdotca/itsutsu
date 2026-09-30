/** Every word the table says, so a host page can put its own in (`strings` when it mounts). */
export type HitotsuStrings = {
  you: string;
  computer: (n: number) => string;
  yourTurn: string;
  toPlay: (who: string) => string;
  follow: (colour: string) => string;
  facing: (who: string, count: number) => string;
  drew: (who: string) => string;
  challengeOpen: (who: string, by: string) => string;
  cards: (count: number) => string;
  points: (count: number) => string;
  draw: string;
  keep: string;
  take: (count: number) => string;
  challenge: string;
  call: string;
  called: string;
  pickColour: string;
  swapWith: (who: string) => string;
  jumpIn: string;
  won: (who: string) => string;
  again: string;
  stock: (count: number) => string;
  colour: Record<"R" | "Y" | "G" | "B", string>;
  news: {
    caught: (who: string) => string;
    took: (who: string, count: number) => string;
    challenge: (who: string, by: string, guilty: boolean) => string;
    swap: (who: string, other: string) => string;
    rotate: string;
    jump: (who: string) => string;
    /** `you` is true when the seat skipped is the person at this screen. */
    skipped: (who: string, you: boolean) => string;
    reversed: string;
    drew: (who: string, count: number) => string;
  };
};

export const HITOTSU_STRINGS: HitotsuStrings = {
  you: "You",
  computer: (n) => `Computer ${n}`,
  yourTurn: "Your turn",
  toPlay: (who) => `${who} to play`,
  follow: (colour) => `Play ${colour}, the same number or symbol, or a wild.`,
  facing: (who, count) => `${who} must take ${count}, or stack a draw card.`,
  drew: (who) => `${who} drew: play that card, or keep it.`,
  challengeOpen: (who, by) => `${who} may challenge ${by}'s Wild Draw Four, or take it.`,
  cards: (count) => (count === 1 ? "1 card" : `${count} cards`),
  points: (count) => `${count} pts`,
  draw: "Draw",
  keep: "Keep it",
  take: (count) => `Take ${count}`,
  challenge: "Challenge",
  call: "Call Hitotsu!",
  called: "Hitotsu! called",
  pickColour: "Choose a colour",
  swapWith: (who) => `Swap with ${who}`,
  jumpIn: "Jump in!",
  won: (who) => `${who} won.`,
  again: "Play again",
  stock: (count) => `${count} left to draw`,
  colour: { R: "red", Y: "yellow", G: "green", B: "blue" },
  news: {
    caught: (who) => `${who} forgot to call Hitotsu!: two cards.`,
    took: (who, count) => `${who} took ${count}.`,
    challenge: (who, by, guilty) => (guilty ? `${who} challenged ${by}, who had the colour.` : `${who} challenged ${by}, who did not have the colour.`),
    swap: (who, other) => `${who} swapped hands with ${other}.`,
    rotate: "Every hand passed on.",
    jump: (who) => `${who} jumped in!`,
    skipped: (who, you) => `${who} ${you ? "are" : "is"} skipped.`,
    reversed: "Play turns round.",
    drew: (who, count) => `${who} drew ${count === 1 ? "a card" : `${count} cards`}.`,
  },
};
