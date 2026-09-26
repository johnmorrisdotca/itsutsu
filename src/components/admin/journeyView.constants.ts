/**
 * HOW THE 18 ROLES ARE DRAWN ON THE SCATTER, per the `dataviz` skill.
 *
 * The skill's reference categorical palette validates all pairs — the test a
 * scatter needs, since any two dots can sit next to each other anywhere on
 * the plot, unlike a bar chart's fixed sequence — for only its first THREE
 * slots; past three, its own guidance is to fold into groups or facet rather
 * than push an unvalidated ordering onto a busy chart. Eighteen individually
 * coloured roles on one scatter would do exactly that, so the eighteen are
 * grouped into eight kinds of player first, and the scatter is coloured by
 * GROUP, not by role — with the roles table naming which role is which,
 * right beside it, so nothing is hidden by the grouping.
 *
 * Colour is not the only channel: `dot` (a filled circle) marks a role that
 * plays two-player games, `square` marks one that never does (Word Games
 * Only, Numbers / Sudoku Solver) — a real, functional distinction, not a
 * decorative one, so identity is never colour alone.
 *
 * Hex values are the skill's reference palette (`references/palette.md`),
 * unchanged — light/dark pairs already validated for adjacent-pair CVD
 * separation and normal-vision contrast in both modes.
 */
export type JourneyGroupKey =
  | "competitive"
  | "everyday"
  | "socialFull"
  | "boardSpecialist"
  | "puzzleSpecialist"
  | "experimenter"
  | "grinder"
  | "veteran";

export const JOURNEY_GROUPS: Record<JourneyGroupKey, { label: string; light: string; dark: string; shape: "dot" | "square" }> = {
  competitive: { label: "Competitive", light: "#2a78d6", dark: "#3987e5", shape: "dot" },
  everyday: { label: "Everyday players", light: "#eb6834", dark: "#d95926", shape: "dot" },
  socialFull: { label: "Full & social", light: "#1baf7a", dark: "#199e70", shape: "dot" },
  boardSpecialist: { label: "Board-game specialists", light: "#eda100", dark: "#c98500", shape: "dot" },
  puzzleSpecialist: { label: "Puzzle specialists", light: "#e87ba4", dark: "#d55181", shape: "square" },
  experimenter: { label: "Experimenter", light: "#008300", dark: "#008300", shape: "dot" },
  grinder: { label: "Grinder", light: "#4a3aa7", dark: "#9085e9", shape: "dot" },
  veteran: { label: "Returning veteran", light: "#e34948", dark: "#e66767", shape: "dot" },
};

/** Which of the 18 roles is which group, for the scatter and its legend. */
export const JOURNEY_ROLE_GROUP: Record<string, JourneyGroupKey> = {
  elite: "competitive",
  risingTalent: "competitive",
  dailyGamer: "everyday",
  weekendPlayer: "everyday",
  occasional: "everyday",
  newcomer: "everyday",
  fullParticipant: "socialFull",
  socialButterfly: "socialFull",
  boardGamesOnly: "boardSpecialist",
  gomokuOnly: "boardSpecialist",
  reversiSpecialist: "boardSpecialist",
  draughtsPlayer: "boardSpecialist",
  goPlayer: "boardSpecialist",
  wordGamesOnly: "puzzleSpecialist",
  numbersSolver: "puzzleSpecialist",
  experimenter: "experimenter",
  grinder: "grinder",
  returningVeteran: "veteran",
};
