import type { LegacyPlayer } from "./legacyPlayers.types";

/**
 * Records kept from before Itsutsu — some from people who never played here
 * ("remembered"), some from live members who did, before this site existed
 * ("elsewhere"). The first is the site's first seeder, the record this whole
 * feature was built to keep. Add more the same way: a slug, a source, and
 * the record as it stood.
 */
export const LEGACY_PLAYERS: LegacyPlayer[] = [
  {
    slug: "chibi",
    name: "Chibi",
    kind: "remembered",
    location: "Canada",
    possessive: "his",
    source: "ItsYourTurn.com",
    joined: "2001-07-27",
    lastActive: "2013-07-30",
    summary: [
      {
        class: "Regular games",
        record: { game: "Regular games", won: 2077, lost: 1355, drawn: 8 },
        detailComplete: false,
        detail: [
          { game: "Anti-Backgammon", won: 2, lost: 11, drawn: 0 },
          { game: "Anti-Flipversi", won: 1, lost: 1, drawn: 0 },
          { game: "Backgammon", won: 1149, lost: 730, drawn: 0 },
          { game: "Backgammon Level 2", won: 59, lost: 35, drawn: 0 },
          { game: "Backgammon Level 3", won: 2, lost: 1, drawn: 0 },
          { game: "Backgammon Race", won: 150, lost: 92, drawn: 0 },
          { game: "Backgammon Race Level 2", won: 36, lost: 21, drawn: 0 },
          { game: "Battleboats", won: 1, lost: 2, drawn: 0 },
          { game: "Battleboats Plus", won: 20, lost: 33, drawn: 0 },
          { game: "Casual Backgammon", won: 2, lost: 2, drawn: 0 },
          { game: "Flipversi", won: 239, lost: 133, drawn: 1 },
          { game: "Flipversi 10x10", won: 48, lost: 28, drawn: 1 },
          { game: "Flipversi 6x6", won: 27, lost: 19, drawn: 4 },
          { game: "Go-Moku", won: 0, lost: 2, drawn: 0 },
          { game: "Halma", won: 1, lost: 3, drawn: 0 },
          { game: "Hexversi", won: 8, lost: 10, drawn: 1 },
          { game: "Nackgammon", won: 69, lost: 38, drawn: 0 },
          { game: "Pro Backgammon", won: 229, lost: 178, drawn: 0 },
          { game: "Pro Backgammon Level 2", won: 7, lost: 10, drawn: 1 },
          { game: "Pro Backgammon Race", won: 10, lost: 0, drawn: 0 },
          { game: "Pro Backgammon-9", won: 14, lost: 5, drawn: 0 },
          { game: "Pro Nackgammon", won: 3, lost: 1, drawn: 0 },
        ],
      },
      {
        class: "Tournament games",
        record: { game: "Tournament games", won: 266, lost: 286, drawn: 0 },
        detailComplete: true,
        detail: [
          { game: "Backgammon", won: 9, lost: 15, drawn: 0 },
          { game: "Backgammon Level 2", won: 33, lost: 37, drawn: 0 },
          { game: "Backgammon Level 3", won: 20, lost: 22, drawn: 0 },
          { game: "Backgammon Race", won: 23, lost: 25, drawn: 0 },
          { game: "Backgammon Race Level 2", won: 61, lost: 57, drawn: 0 },
          { game: "Casual Backgammon", won: 8, lost: 10, drawn: 0 },
          { game: "Nackgammon", won: 58, lost: 56, drawn: 0 },
          { game: "Pro Backgammon", won: 16, lost: 14, drawn: 0 },
          { game: "Pro Backgammon Level 2", won: 32, lost: 44, drawn: 0 },
          { game: "Pro Backgammon Race", won: 6, lost: 6, drawn: 0 },
        ],
      },
      {
        class: "Ladder games",
        record: { game: "Ladder games", won: 71, lost: 54, drawn: 1 },
        detailComplete: true,
        detail: [
          { game: "Backgammon", won: 59, lost: 39, drawn: 1 },
          { game: "Pro Backgammon Race", won: 12, lost: 15, drawn: 0 },
        ],
      },
    ],
  },
  {
    slug: "kyokosan",
    name: "Kyokosan",
    kind: "honorary",
    location: "Canada",
    possessive: "her",
    source: "ItsYourTurn.com",
    joined: "2001-07-26",
    lastActive: "2009-09-30",
    summary: [
      {
        class: "Regular games",
        record: { game: "Regular games", won: 2889, lost: 2405, drawn: 34 },
        detailComplete: true,
        detail: [
          { game: "Anti-Flipversi", won: 1, lost: 7, drawn: 0 },
          { game: "Anti-Flipversi 6x6", won: 0, lost: 1, drawn: 0 },
          { game: "Connect 6", won: 15, lost: 9, drawn: 0 },
          { game: "Flipversi", won: 328, lost: 399, drawn: 15 },
          { game: "Flipversi 10x10", won: 43, lost: 68, drawn: 3 },
          { game: "Flipversi 6x6", won: 151, lost: 84, drawn: 7 },
          { game: "Flipversi Blackhole 10x10", won: 0, lost: 1, drawn: 0 },
          { game: "Go-Moku", won: 913, lost: 586, drawn: 9 },
          { game: "Halma", won: 78, lost: 101, drawn: 0 },
          { game: "Halma 10x10", won: 95, lost: 67, drawn: 0 },
          { game: "Keryo Pente", won: 783, lost: 645, drawn: 0 },
          { game: "Pente", won: 478, lost: 423, drawn: 0 },
          { game: "Pro Go-Moku", won: 3, lost: 4, drawn: 0 },
          { game: "Pro Pente", won: 1, lost: 9, drawn: 0 },
          { game: "Stack 4x4", won: 0, lost: 1, drawn: 0 },
        ],
      },
      {
        class: "Tournament games",
        record: { game: "Tournament games", won: 37, lost: 36, drawn: 1 },
        detailComplete: true,
        detail: [
          { game: "Flipversi", won: 18, lost: 18, drawn: 0 },
          { game: "Go-Moku", won: 12, lost: 13, drawn: 1 },
          { game: "Pente", won: 4, lost: 2, drawn: 0 },
          { game: "Pro Go-Moku", won: 3, lost: 3, drawn: 0 },
        ],
      },
    ],
  },
  {
    slug: "incognito",
    name: "Incognito",
    kind: "elsewhere",
    location: "Canada",
    possessive: "his",
    source: "ItsYourTurn.com",
    joined: "2001-05-29",
    lastActive: "2007-04-04",
    note: "Two of the Backgammon losses on record — the only ones — were against his father, Chibi, on 2001-08-17 and 2001-08-18.",
    summary: [
      {
        class: "Regular games",
        record: { game: "Regular games", won: 1533, lost: 164, drawn: 12 },
        detailComplete: true,
        detail: [
          { game: "Anti-Checkers", won: 230, lost: 25, drawn: 0 },
          { game: "Anti-Flipversi", won: 244, lost: 18, drawn: 9 },
          { game: "Backgammon", won: 0, lost: 2, drawn: 0 },
          { game: "Checkers", won: 15, lost: 2, drawn: 0 },
          { game: "Crowded Checkers", won: 5, lost: 1, drawn: 0 },
          { game: "Flipversi", won: 173, lost: 23, drawn: 1 },
          { game: "Flipversi 6x6", won: 21, lost: 6, drawn: 0 },
          { game: "Go-Moku", won: 175, lost: 22, drawn: 2 },
          { game: "Halma", won: 41, lost: 7, drawn: 0 },
          { game: "Halma 10x10", won: 41, lost: 1, drawn: 0 },
          { game: "Keryo Pente", won: 194, lost: 22, drawn: 0 },
          { game: "Pente", won: 165, lost: 20, drawn: 0 },
          { game: "Pro Go-Moku", won: 78, lost: 8, drawn: 0 },
          { game: "Pro Pente", won: 137, lost: 5, drawn: 0 },
          { game: "Stack4", won: 14, lost: 2, drawn: 0 },
        ],
      },
    ],
  },
];

export function findLegacyPlayer(slug: string): LegacyPlayer | null {
  const key = slug.trim().toLowerCase();
  return LEGACY_PLAYERS.find((player) => player.slug === key) ?? null;
}

/** The elsewhere record belonging beside a live player's own name, if any. */
export function findLinkedLegacy(liveKey: string): LegacyPlayer | null {
  return LEGACY_PLAYERS.find((player) => player.kind === "elsewhere" && player.linkedKey === liveKey) ?? null;
}
