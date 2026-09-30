/**
 * THE COLOURS A TABLE IS DRAWN IN: one for each of six seats, and a grey for
 * the neutral army that holds a third of the world in a game for two. Any
 * list of CSS colours may be given instead; a seat past its end wraps round.
 */
export const TENKA_SEAT_COLOURS: readonly string[] = ["#c8463d", "#3a6fb5", "#e0b23a", "#4d9a5b", "#8a55a8", "#e07b39"];

export const TENKA_NEUTRAL_COLOUR = "#9a9a92";

/** The colour a territory's owner is drawn in. */
export function ownerColour(owner: number, colours: readonly string[] = TENKA_SEAT_COLOURS): string {
  if (owner < 0 || colours.length === 0) return TENKA_NEUTRAL_COLOUR;
  return colours[owner % colours.length]!;
}
