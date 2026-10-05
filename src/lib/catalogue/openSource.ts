import { dependencies } from "../../../package.json";
import { CARD_GAME_LIST } from "../cardGames/cardGames.constants";
import { SUGOROKU_KIND_LIST } from "../party/sugoroku/sugoroku.constants";
import { isRuleVariant, type GameKey } from "./gameKeys";

/**
 * THE OPEN-SOURCE PACKAGES A GAME HERE RUNS ON. John, 2026-09-30: "we might
 * want to say the open source package we are using when using a game like the
 * kyuubu ... very low key ... then we know what version is being used too."
 * So a game's footer and rules page name its package and the version this
 * build carries, read from the site's own package.json, which pins each one
 * exactly; a version is never typed twice.
 */
export type OpenSourcePackage = "narabe" | "kyuubu" | "kotoba" | "kumimoji" | "toranpu" | "domino" | "hitotsu" | "tenka" | "korokoro" | "tsunagi" | "jarajara" | "suido" | "sugoroku" | "kazu" | "meikyuu" | "tobiishi" | "gunjin" | "jirai";

/** Each package's name as it is written, and its repository. */
export const OPEN_SOURCE_PACKAGES: Readonly<Record<OpenSourcePackage, { name: string; repo: string }>> = {
  narabe: { name: "Narabe", repo: "https://github.com/johnmorrisdotca/narabe" },
  kyuubu: { name: "Kyuubu", repo: "https://github.com/johnmorrisdotca/kyuubu" },
  kotoba: { name: "Kotoba", repo: "https://github.com/johnmorrisdotca/kotoba" },
  kumimoji: { name: "Kumimoji", repo: "https://github.com/johnmorrisdotca/kumimoji" },
  toranpu: { name: "Toranpu", repo: "https://github.com/johnmorrisdotca/toranpu" },
  domino: { name: "Domino", repo: "https://github.com/johnmorrisdotca/domino" },
  hitotsu: { name: "Hitotsu", repo: "https://github.com/johnmorrisdotca/hitotsu" },
  tenka: { name: "Tenka", repo: "https://github.com/johnmorrisdotca/tenka" },
  korokoro: { name: "Korokoro", repo: "https://github.com/johnmorrisdotca/korokoro" },
  tsunagi: { name: "Tsunagi", repo: "https://github.com/johnmorrisdotca/tsunagi" },
  jarajara: { name: "Jarajara", repo: "https://github.com/johnmorrisdotca/jarajara" },
  suido: { name: "Suido", repo: "https://github.com/johnmorrisdotca/suido" },
  meikyuu: { name: "Meikyuu", repo: "https://github.com/johnmorrisdotca/meikyuu" },
  tobiishi: { name: "Tobiishi", repo: "https://github.com/johnmorrisdotca/tobiishi" },
  sugoroku: { name: "Sugoroku", repo: "https://github.com/johnmorrisdotca/sugoroku" },
  kazu: { name: "Kazu", repo: "https://github.com/johnmorrisdotca/kazu" },
  gunjin: { name: "Gunjin", repo: "https://github.com/johnmorrisdotca/gunjin" },
  jirai: { name: "Jirai", repo: "https://github.com/johnmorrisdotca/jirai" },
};

const BY_GAME: Partial<Record<GameKey, OpenSourcePackage>> = {
  cube: "kyuubu",
  gomoji: "kotoba",
  gomojiKana: "kotoba",
  gomojiMot: "kotoba",
  gomojiWort: "kotoba",
  gomojiPop: "kotoba",
  kumimoji: "kumimoji",
  tsunagi: "tsunagi",
  mahjong: "jarajara",
  suido: "suido",
  numberPlace: "kazu",
  jigsaw: "kazu",
  diagonal: "kazu",
  sumCages: "kazu",
  moreOrLess: "kazu",
  towers: "kazu",
  shikaku: "kazu",
  akari: "kazu",
  slitherlink: "kazu",
  hitori: "kazu",
  fillomino: "kazu",
  kakuro: "kazu",
  jirai: "jirai",
  meikyuu: "meikyuu",
  tobiishi: "tobiishi",
  solitaire: "toranpu",
  freecell: "toranpu",
  spider: "toranpu",
  mexicanTrain: "domino",
  hitotsu: "hitotsu",
  tenka: "tenka",
  diceWar: "korokoro",
  gunjin: "gunjin",
  ...Object.fromEntries(SUGOROKU_KIND_LIST.map((kind) => [kind, "sugoroku"])),
  ...Object.fromEntries(CARD_GAME_LIST.map((kind) => [kind, "toranpu"])),
};

/** The package a game runs on, or null for a game whose rules are this site's own. Every board game runs on Narabe. */
export function openSourceOf(game: GameKey): OpenSourcePackage | null {
  return BY_GAME[game] ?? (isRuleVariant(game) ? "narabe" : null);
}

/** The version of a package this build carries, as the site's package.json pins it, or null if it does not depend on it. */
export function openSourceVersion(pkg: OpenSourcePackage): string | null {
  const pinned = (dependencies as Record<string, string | undefined>)[`@johnmorrisdotca/${pkg}`];
  return pinned === undefined ? null : pinned.replace(/^[\^~]/, "");
}
