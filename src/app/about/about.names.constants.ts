/**
 * The names on the About page that are names and not sentences, kept in one file the language gate allows
 * (`scripts/check-i18n-strings.mjs`, ALLOWED_FILES): the Romanised readings of Japanese words, which are the same
 * whoever is reading, and the made-up players the example ladder uses.
 */

/** The twenty-six renju openings: the kanji, then the reading, direct and then indirect. */
export const OPENING_ROWS: readonly (readonly [string, string, string, string])[] = [
  ["寒星", "Kansei", "長星", "Chōsei"],
  ["溪月", "Keigetsu", "峡月", "Kyōgetsu"],
  ["疎星", "Sosei", "恒星", "Kōsei"],
  ["花月", "Kagetsu", "水月", "Suigetsu"],
  ["残月", "Zangetsu", "流星", "Ryūsei"],
  ["雨月", "Ugetsu", "雲月", "Ungetsu"],
  ["金星", "Kinsei", "浦月", "Hogetsu"],
  ["松月", "Shōgetsu", "嵐月", "Rangetsu"],
  ["丘月", "Kyūgetsu", "銀月", "Gingetsu"],
  ["新月", "Shingetsu", "明星", "Myōjō"],
  ["瑞星", "Zuisei", "斜月", "Shagetsu"],
  ["山月", "Sangetsu", "名月", "Meigetsu"],
  ["遊星", "Yūsei", "彗星", "Suisei"],
];

/** The Romanised readings in the glossary of Japanese words, in the order its rows run. */
export const GLOSSARY_READINGS = [
  "itsutsu",
  "gomoku narabe",
  "renju",
  "igo",
  "goban · goishi",
  "hoshi · tengen",
  "sente · gote",
  "jōseki",
  "kō",
  "taikyoku",
  "kifu",
  "meikyoku",
  "banzuke",
  "kyū · dan · meijin",
  "ma",
] as const;

/** The same three points on a 15×15 board, written for the board and for an SGF file. */
export const SGF_POINTS = [
  ["H8", "hh"],
  ["A1", "ao"],
  ["P15", "oa"],
] as const;

/** The made-up players of the example ladder. */
export const EXAMPLE_PLAYERS = ["Mio", "Kai", "Hana", "Ren", "Sora"] as const;
