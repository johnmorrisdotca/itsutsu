
/**
 * The rest of the puzzles' tables of words, in Japanese: the three ways a
 * Gomoji's grid can be drawn, Kumimoji's pictures on its front door and its
 * wallpaper, and Meikyuu's colour chooser. Overlays of the English tables
 * (`copyTable.ts`); a name (Reversi, 壁紙, 色) is its kanji and is not here.
 */

/** `WORD_STYLE_DISPLAY` (`gomoji/wordStyles.ts`). */
export const WORD_STYLE_DISPLAY_JA = {
  reversi: { blurb: ["文字は、リバーシの盤のマスの中に置かれます。", "Letters sit in the squares of a Reversi board."] },
  gomoku: { blurb: ["文字は、五目並べの盤の交点に置かれます。", "Letters sit on the crossings of a Gomoku board."] },
  tiles: { blurb: ["文字は、盤の中の白いタイルの上に置かれます。", "Letters sit on plain white tiles inside the board."] },
} as const;

/** `KUMIMOJI_SHOTS` (`kumimoji/shots.constants.ts`): what each picture shows, and the line under it. */
export const KUMIMOJI_SHOTS_JA = {
  build: {
    alt: [
      "英語で遊ぶスマートフォン。木のテーブルに、BLADEが横に、Bから下にBENDが伸びています。手札にはW、B、Bが残り、並べ終わるまで「引く」は待っています。",
      "A phone playing an English game: BLADE across the wooden table and BEND down from its B, with W, B and B left in the hand and Draw waiting until they are laid.",
    ],
    caption: ["タイルをタップして、マスをタップします。テーブルは、クロスワードに合わせて広がります。", "Tap a tile, then a square. The table grows with the crossword."],
  },
  japanese: {
    alt: [
      "日本語で遊ぶスマートフォン。「あそこ」が横に並び、「そ」と「こ」の隅に、小さく「ぞ」と「ご」が出ています。手札には炭色のワイルド「五」があり、どのかなにするかを選ぶ一覧が開いています。",
      "A phone playing in Japanese: あそこ laid across, そ and こ carrying ぞ and ご small in their corners, and the charcoal 五 wild chosen in the hand with a list to pick the kana it stands for.",
    ],
    caption: [
      "日本語では、タイルはその隅にあるすべての形として使えます。「五」はワイルドです。",
      "In Japanese a tile plays as every form in its corner. 五 is wild.",
    ],
  },
  help: {
    alt: [
      "テーブルにAWAITが横に、AUNTが縦に並び、「ヘルプ」が手札の先頭にSOTを置いています。テーブルの下の行にそう書かれています。",
      "AWAIT across and AUNT down on the table, and Help has put SOT at the front of the hand, which the line under the table says.",
    ],
    caption: ["「ヘルプ」は、手札から単語を作ります。置き場所は、自分で見つけます。", "Help spells a word from your hand. Finding its place is still yours."],
  },
  turn: {
    alt: [
      "BLADEとBENDのクロスワードで、テーブルを4分の1回して見たところ。BLADEは画面の上から下へ、BENDは右から左へ伸び、どのタイルも立っています。「回転」、「矢印」、「全体」の矢印ボタンが開いています。",
      "The BLADE and BEND crossword with the table turned a quarter: BLADE runs down the screen and BEND right to left, every tile upright, with the arrows open under Turn, Arrows and Fit.",
    ],
    caption: ["テーブルを4分の1回します。タイルは立ったままです。", "Turn the table a quarter. The tiles stay upright."],
  },
  wallpaper: {
    alt: [
      "完成した12のクロスワードの壁紙。英語が9つ、日本語が3つで、それぞれ木の四角の上に、日付とタイルの数が添えられています。下の帯には「組文字 · 12個のクロスワード」とあります。",
      "A wallpaper of twelve finished crosswords, nine English and three Japanese, each on its own square of wood with its day and its count of tiles, under a bar reading Kumimoji · 12 crosswords.",
    ],
    caption: [
      "完成したクロスワードは、すべて保存され、記録の画面で1枚の壁紙になります。この12は、ゲームが自分で並べたものです。",
      "Every crossword you finish is kept, and your record draws them as one wallpaper. These twelve are ones the game laid out itself.",
    ],
  },
} as const;

/** `KUMIMOJI_WALLPAPER_COPY` (`kumimoji/wallpaper.constants.ts`). */
export const KUMIMOJI_WALLPAPER_COPY_JA = {
  openLabel: ["クロスワードの壁紙", "Wallpaper of your crosswords"],
  heading: ["クロスワードの壁紙", "Crossword wallpaper"],
  loading: ["完成したクロスワードを取得しています…", "Fetching your finished crosswords…"],
  failed: ["完成したクロスワードを、いま取得できませんでした。閉じて、もう一度お試しください。", "Your crosswords could not be fetched just now. Close this and try again."],
  empty: [
    "完成したクロスワードは、まだありません。完成したものは保存され、この絵に、全部まとめて並びます。",
    "You have not finished a crossword yet. Every one you finish is kept, and this picture lays them all out together.",
  ],
  emptyLink: ["最初の1つを作る →", "Build your first →"],
  name: ["{0} · クロスワード{1}個", "{0} · {1} crosswords"],
  newest: ["新しい順に{0}個", "your newest {0}"],
  tiles: ["タイル{0}枚", "{0} tiles"],
  range: ["{0}から{1}まで", "{0} to {1}"],
  alt: ["完成したクロスワード{0}個を、1枚の絵に並べたもの", "Your {0} finished crosswords, laid out as one picture"],
} as const;

/** `LOOK_COPY` (`meikyuu/look.constants.ts`): the colour chooser. */
export const LOOK_COPY_JA = {
  press: ["色", "Colours"],
  title: ["色", "Colours"],
  blurb: ["できあいのセットを選ぶか、自分で組み合わせます。迷路は、いつも見やすいままです。", "Pick a ready-made set, or mix your own. The maze always stays easy to see."],
  themes: ["できあいのセット", "Ready-made sets"],
  own: ["自分で作る", "Make your own"],
  frame: ["枠", "Border"],
  paper: ["背景", "Background"],
  ink: ["迷路", "Maze"],
  reset: ["リセット", "Reset"],
  done: ["完了", "Done"],
  adjusted: ["迷路の線は、この背景でも見やすいよう、少し変えてあります。", "The maze's lines were changed a little so they stay easy to see on this background."],
} as const;
