/**
 * THE PICTURES OF KUMIMOJI BEING PLAYED, on its front door: each one taken
 * from real play by `e2e/kumimoji-shots.spec.ts` (`pnpm screenshots:kumimoji`)
 * into `public/art/kumimoji/`, never drawn by hand. The width and height are
 * the file's own, so the page keeps the room for a picture before it arrives;
 * `kumimojiShots.coverage.test.ts` holds every file to them, to its size, and
 * to having been made by the spec.
 */
export type KumimojiShot = {
  src: string;
  /** What the picture shows, said plainly for a reader who cannot see it. */
  alt: string;
  /** The line under it: what to notice. */
  caption: string;
  kanji: string;
  width: number;
  height: number;
};

/** Phone screens, drawn at 390 CSS pixels and kept at 480 real ones: sharp beside a caption, and light. */
const PHONE_WIDTH = 480;

/** A phone's screen, 390×844 CSS pixels from the table's top, at this many real ones. */
const PHONE = { width: PHONE_WIDTH, height: 1039 } as const;

export const KUMIMOJI_SHOTS = {
  build: {
    src: "/art/kumimoji/build.jpg",
    alt: "A phone playing an English game: BLADE across the wooden table and BEND down from its B, with W, B and B left in the hand and Draw waiting until they are laid.",
    caption: "Tap a tile, then a square. The table grows with the crossword.",
    kanji: "組",
    ...PHONE,
  },
  japanese: {
    src: "/art/kumimoji/japanese.jpg",
    alt: "A phone playing in Japanese: あそこ laid across, そ and こ carrying ぞ and ご small in their corners, and the charcoal 五 wild chosen in the hand with a list to pick the kana it stands for.",
    caption: "In Japanese a tile plays as every form in its corner. 五 is wild.",
    kanji: "仮名",
    ...PHONE,
  },
  help: {
    src: "/art/kumimoji/help.jpg",
    alt: "AWAIT across and AUNT down on the table, and Help has put SOT at the front of the hand, which the line under the table says.",
    caption: "Help spells a word from your hand. Finding its place is still yours.",
    kanji: "助け",
    ...PHONE,
  },
  turn: {
    src: "/art/kumimoji/turn.jpg",
    alt: "The BLADE and BEND crossword with the table turned a quarter: BLADE runs down the screen and BEND right to left, every tile upright, with the arrows open under Turn, Arrows and Fit.",
    caption: "Turn the table a quarter. The tiles stay upright.",
    kanji: "回す",
    ...PHONE,
  },
  wallpaper: {
    src: "/art/kumimoji/wallpaper.jpg",
    alt: "A wallpaper of twelve finished crosswords, nine English and three Japanese, each on its own square of wood with its day and its count of tiles, under a bar reading Kumimoji · 12 crosswords.",
    caption: "Every crossword you finish is kept, and your record draws them as one wallpaper. These twelve are ones the game laid out itself.",
    kanji: "壁紙",
    width: 960,
    height: 540,
  },
} as const satisfies Record<string, KumimojiShot>;

/** The order the front door shows them in. */
export const KUMIMOJI_SHOT_ORDER = ["build", "japanese", "help", "turn", "wallpaper"] as const satisfies readonly (keyof typeof KUMIMOJI_SHOTS)[];
