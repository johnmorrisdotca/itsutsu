import { playerPath } from "@/lib/rating/playerKey";
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
    // One man on two sites: he joined ItsYourTurn in 2001 and GoldToken in
    // 2003, and played on both. One row, one page, both chapters.
    sources: [
      {
        site: "ItsYourTurn.com",
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
        site: "GoldToken.com",
        siteUrl: "https://www.goldtoken.com/games/album?id=8686;pid=24612",
        siteId: "24612",
        joined: "2003-03-13",
        lastActive: "2020-11-10",
        daysOff: "Saturday and Sunday",
        note: "A profile photo he posted, 27 May 2012 — his own reply to a comment on it says it was taken in Japan, a long time before.",
        comments: [
          { text: "That's a beautiful photograph!", by: "Twit-twoo", at: "2013-06-04 12:47" },
          { text: "Great photo! Where was this taken? when? Thanks for sharing!", by: "Nanna K", at: "2014-09-19 20:07" },
          { text: "thank you\ntaken in Japan a long time ago", by: "Chibi", at: "2014-09-19 21:00" },
          { text: "Is this you in the picture?", by: "Churchgoer", at: "2015-02-18 21:45" },
        ],
        // The same fourteen games as jmorris's own headToHead against this slug,
        // from Chibi's side: a win there is a loss here, and the reverse.
        headToHead: [
          {
            opponent: "jmorris",
            games: [
              { game: "Nackgammon", date: "2020-04-10", result: "won" },
              { game: "Nackgammon", date: "2020-04-01", result: "won" },
              { game: "Nackgammon", date: "2020-03-28", result: "won" },
              { game: "Long Gammon", date: "2020-03-06", result: "won" },
              { game: "Long Gammon", date: "2020-03-06", result: "won" },
              { game: "Nackgammon", date: "2020-02-12", result: "won" },
              { game: "Backgammon", date: "2019-12-20", result: "won" },
              { game: "Backgammon", date: "2019-12-04", result: "won" },
              { game: "Backgammon", date: "2019-12-04", result: "won" },
              { game: "Backgammon", date: "2019-08-27", result: "drawn" },
              { game: "Nackgammon (3 Point)", date: "2019-08-27", result: "drawn" },
              { game: "Nackgammon", date: "2019-08-27", result: "drawn" },
              { game: "Long Gammon", date: "2019-08-27", result: "drawn" },
              { game: "Backgammon (3 Point)", date: "2019-08-27", result: "drawn" },
            ],
          },
        ],
        summary: [
          {
            class: "Friendly games",
            record: { game: "Friendly games", won: 4983, lost: 4434, drawn: 46 },
            detailComplete: true,
            detail: [
              { game: "Long Gammon", won: 272, lost: 166, drawn: 8 },
              { game: "Reversi", won: 1, lost: 3, drawn: 0 },
              { game: "Nackgammon", won: 306, lost: 281, drawn: 5 },
              { game: "Tabula", won: 5, lost: 1, drawn: 0 },
              { game: "Hypergammon", won: 5, lost: 5, drawn: 0 },
              { game: "Backgammon", won: 3721, lost: 3343, drawn: 27 },
              { game: "Inverticade", won: 1, lost: 7, drawn: 0 },
              { game: "GoldFences", won: 13, lost: 67, drawn: 0 },
              { game: "Skat", won: 0, lost: 9, drawn: 0 },
              { game: "Whist", won: 0, lost: 8, drawn: 0 },
              { game: "Nackgammon (5 Point)", won: 10, lost: 11, drawn: 0 },
              { game: "Nackgammon (9 Point)", won: 8, lost: 18, drawn: 0 },
              { game: "Hit&Miss Salvo", won: 0, lost: 1, drawn: 0 },
              { game: "Long Gammon (3 Point)", won: 20, lost: 9, drawn: 0 },
              { game: "Long Gammon (7 Point)", won: 11, lost: 2, drawn: 0 },
              { game: "Salvo", won: 0, lost: 0, drawn: 2 },
              { game: "Backgammon (9 Point)", won: 98, lost: 63, drawn: 2 },
              { game: "Backgammon (5 Point)", won: 146, lost: 99, drawn: 0 },
              { game: "Euro Domination", won: 0, lost: 1, drawn: 0 },
              { game: "Backgammon (3 Point)", won: 249, lost: 251, drawn: 1 },
              { game: "Backgammon (7 Point)", won: 54, lost: 50, drawn: 0 },
              { game: "Long Gammon (5 Point)", won: 14, lost: 5, drawn: 0 },
              { game: "Long Gammon (9 Point)", won: 19, lost: 13, drawn: 0 },
              { game: "Nackgammon (3 Point)", won: 24, lost: 16, drawn: 1 },
              { game: "Hypergammon (5 Point)", won: 1, lost: 1, drawn: 0 },
              { game: "Hypergammon (3 Point)", won: 1, lost: 1, drawn: 0 },
              { game: "Nackgammon (7 Point)", won: 4, lost: 3, drawn: 0 },
            ],
          },
          {
            class: "Tournament games",
            record: { game: "Tournament games", won: 432, lost: 593, drawn: 0 },
            detailComplete: true,
            detail: [
              { game: "Long Gammon", won: 12, lost: 30, drawn: 0 },
              { game: "Nackgammon", won: 78, lost: 92, drawn: 0 },
              { game: "Backgammon", won: 234, lost: 312, drawn: 0 },
              { game: "Nackgammon (5 Point)", won: 12, lost: 9, drawn: 0 },
              { game: "Long Gammon (3 Point)", won: 3, lost: 7, drawn: 0 },
              { game: "Backgammon (9 Point)", won: 2, lost: 18, drawn: 0 },
              { game: "Backgammon (5 Point)", won: 17, lost: 25, drawn: 0 },
              { game: "Backgammon (3 Point)", won: 58, lost: 81, drawn: 0 },
              { game: "Backgammon (7 Point)", won: 6, lost: 9, drawn: 0 },
              { game: "Long Gammon (5 Point)", won: 3, lost: 2, drawn: 0 },
              { game: "Long Gammon (9 Point)", won: 0, lost: 1, drawn: 0 },
              { game: "Nackgammon (3 Point)", won: 6, lost: 6, drawn: 0 },
              { game: "Nackgammon (7 Point)", won: 1, lost: 1, drawn: 0 },
            ],
          },
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
    sources: [
      {
        site: "ItsYourTurn.com",
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
    ],
  },
  {
    slug: "jmorris",
    name: "John Morris",
    kind: "elsewhere",
    /*
     * Staged for removal at the site owner's request, 2026-09-09. He found
     * two John Morris pages on his own site and asked for one of them gone.
     *
     * Folded rather than deleted, deliberately and for now: this row is 127
     * lines of hand-transcribed record from ItsYourTurn and GoldToken, 2001
     * to 2007, and it exists nowhere else — not in the database, not at the
     * source sites, both of which it outlived. Deleting it would not merge
     * two accounts, because there is only ever one; it would throw away the
     * record. So the address goes now and the record stays, on his page.
     */
    folded: {
      since: "2026-09-09",
      note: "Folded into the live account john-morris. Kept here until the owner confirms the record itself should go.",
    },
    // The live account this belongs beside. Without it the record exists at
    // its own address and never appears on the page of the person whose it
    // is, which is where anybody would look for it first.
    linkedKey: "john morris",
    location: "Canada",
    possessive: "his",
    // The same man as Incognito on ItsYourTurn — one row, two handles.
    sources: [
      {
        handle: "Incognito",
        site: "ItsYourTurn.com",
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
      {
        site: "GoldToken.com",
        siteUrl: "https://www.goldtoken.com/games/player?p=66756",
        siteId: "66756",
        joined: "2011-06-25",
        lastActive: "2026-09-08",
        daysOff: "Saturday and Sunday",
        note: "Reversi here is the same game as Flipversi on ItsYourTurn — one game, two sites' names for it. GoldToken's own rating averaged 1689 across every game; a different scale from Itsutsu's Elo, not converted or compared.",
        headToHead: [
          {
            opponent: "chibi",
            games: [
              { game: "Nackgammon", date: "2020-04-10", result: "lost" },
              { game: "Nackgammon", date: "2020-04-01", result: "lost" },
              { game: "Nackgammon", date: "2020-03-28", result: "lost" },
              { game: "Long Gammon", date: "2020-03-06", result: "lost" },
              { game: "Long Gammon", date: "2020-03-06", result: "lost" },
              { game: "Nackgammon", date: "2020-02-12", result: "lost" },
              { game: "Backgammon", date: "2019-12-20", result: "lost" },
              { game: "Backgammon", date: "2019-12-04", result: "lost" },
              { game: "Backgammon", date: "2019-12-04", result: "lost" },
              { game: "Backgammon", date: "2019-08-27", result: "drawn" },
              { game: "Nackgammon (3 Point)", date: "2019-08-27", result: "drawn" },
              { game: "Nackgammon", date: "2019-08-27", result: "drawn" },
              { game: "Long Gammon", date: "2019-08-27", result: "drawn" },
              { game: "Backgammon (3 Point)", date: "2019-08-27", result: "drawn" },
            ],
          },
        ],
        summary: [
          {
            class: "Friendly games",
            record: { game: "Friendly games", won: 188, lost: 41, drawn: 7 },
            detailComplete: true,
            detail: [
              { game: "Golden Pente", won: 64, lost: 6, drawn: 0 },
              { game: "Pente", won: 82, lost: 14, drawn: 0 },
              { game: "Large Go Moku", won: 23, lost: 3, drawn: 0 },
              {
                game: "Go Moku",
                won: 18,
                lost: 7,
                drawn: 0,
                log: [
                  { date: "2020-01-15", opponent: "GROWLINGMAD", result: "won" },
                  { date: "2020-01-14", opponent: "GROWLINGMAD", result: "won" },
                  { date: "2020-01-07", opponent: "GROWLINGMAD", result: "won" },
                  { date: "2019-12-27", opponent: "GROWLINGMAD", result: "won" },
                  { date: "2019-12-08", opponent: "curlywolf", result: "lost" },
                  { date: "2019-11-26", opponent: "AmberLove", result: "won" },
                  { date: "2019-10-21", opponent: "Wild Horse", result: "won" },
                  { date: "2019-10-21", opponent: "Wild Horse", result: "won" },
                  { date: "2019-10-21", opponent: "JL579", result: "lost" },
                  { date: "2019-10-15", opponent: "JL579", result: "lost" },
                  { date: "2019-10-04", opponent: "builderbob54", result: "lost" },
                  { date: "2019-09-30", opponent: "builderbob54", result: "lost" },
                  { date: "2019-09-03", opponent: "AmberLove", result: "lost" },
                  { date: "2019-08-22", opponent: "curlywolf", result: "won" },
                  { date: "2019-07-23", opponent: "Wild Horse", result: "lost" },
                  { date: "2011-09-17", opponent: "asiula", result: "won" },
                  { date: "2011-08-31", opponent: "asiula", result: "won" },
                  { date: "2011-08-07", opponent: "Kentish Martin", result: "won" },
                  { date: "2011-08-05", opponent: "Kentish Martin", result: "won" },
                  { date: "2011-08-03", opponent: "BITman", result: "won" },
                  { date: "2011-08-03", opponent: "Aspen", result: "won" },
                  { date: "2011-07-28", opponent: "Aspen", result: "won" },
                  { date: "2011-07-06", opponent: "Aspen", result: "won" },
                  { date: "2011-07-04", opponent: "BITman", result: "won" },
                  { date: "2011-07-03", opponent: "Aspen", result: "won" },
                ],
              },
              { game: "Backgammon", won: 0, lost: 3, drawn: 2 },
              { game: "Nackgammon", won: 0, lost: 4, drawn: 2 },
              { game: "Small Go Moku", won: 1, lost: 0, drawn: 0 },
              { game: "Long Gammon", won: 0, lost: 2, drawn: 1 },
              { game: "Nackgammon (3 Point)", won: 0, lost: 0, drawn: 1 },
              { game: "Backgammon (3 Point)", won: 0, lost: 0, drawn: 1 },
              { game: "Reversi", won: 0, lost: 2, drawn: 0 },
            ],
          },
        ],
      },
    ],
  },
];

/**
 * Where a folded record's address now leads: the live member's page, on the
 * tab for the site this record came from.
 *
 * Null for a record that keeps its own address. A folded record without a
 * `linkedKey` would have nowhere to send anybody and would take its contents
 * off the site altogether, so that combination is refused by the tests rather
 * than silently resolving to a page that is not about this person.
 */
export function foldedInto(player: LegacyPlayer): string | null {
  if (player.folded === undefined || player.linkedKey === undefined) return null;
  return playerPath(player.linkedKey);
}

export function findLegacyPlayer(slug: string): LegacyPlayer | null {
  const key = slug.trim().toLowerCase();
  return LEGACY_PLAYERS.find((player) => player.slug === key) ?? null;
}

/**
 * Every elsewhere record belonging beside a live player's own name — a
 * person can have played on more than one site before Itsutsu existed, so
 * this is a list, not a single match.
 */
export function findLinkedLegacies(liveKey: string): LegacyPlayer[] {
  return LEGACY_PLAYERS.filter((player) => player.kind === "elsewhere" && player.linkedKey === liveKey);
}
