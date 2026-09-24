/**
 * THE PEOPLE HELPING TEST ITSUTSU, THANKED BY NAME.
 *
 * John, 2026-09-24: both sites are in beta and are being tested by people who
 * give their time for nothing, and they should see a place where that is
 * credited, "so that they see an area where I will be giving them credit".
 *
 * A tester is listed here BECAUSE THEY ASKED TO BE, under the name they play by
 * here, and is taken off the day they ask. Nobody is added from a list of
 * members, a game record or a guess: a name on this page is a person's own
 * choice to be named. So the list is written by hand, a commit per change, and
 * read by /thanks and the front page.
 *
 * Newest last, so a name keeps its place as others join.
 */
export type BetaTester = {
  /** The name they play under here, exactly as it is spelled on their page. */
  name: string;
  /** The site they came from, when they came from one: "ItsYourTurn", "GoldToken". */
  from?: string;
  /** What they helped with, in a few words: "the drop games on a phone". */
  helped: string;
  /** When they started: "September 2026". */
  since: string;
};

export const BETA_TESTERS: readonly BetaTester[] = [];

/**
 * The communities an invitation to test is written to by name.
 *
 * The older sites where people have played these games for twenty years. A
 * player from one of them already knows what a turn-based game between people
 * should feel like, which is exactly what is being tested.
 */
export const INVITED_COMMUNITIES = ["ItsYourTurn", "GoldToken", "Pente.org", "Othello.com"] as const;

/** The communities named as a sentence: "A, B, C and D". */
export function communitiesSaid(): string {
  const names = [...INVITED_COMMUNITIES];
  const last = names.pop();
  return names.length === 0 ? (last ?? "") : `${names.join(", ")} and ${last}`;
}
