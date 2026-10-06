
/**
 * The grid puzzles' lines under the board, in Japanese: overlays of Bridges',
 * Picture logic's, the pencil puzzles' and Jirai's tables of words
 * (`src/components/puzzles/puzzles.constants.ts` and the constants modules
 * beside it). The word for what a step did ("a stone", "cleared") is a phrase
 * (`pgrid.step.*`), since it is built into a sentence.
 */
export const BRIDGES_COPY_JA = {
  howTo: ["島をタップして、一直線上のもう1つの島をタップします。1回で橋が1本、2回で2本、3回で消えます。島のあいだをドラッグしてもかまいません。", "Tap an island, then one in line with it: once for a bridge, twice for two, three times to clear. Or drag between them."],
  chosen: ["次に、同じ行か列にある島をタップします。", "Now tap an island in line with it, across or down."],
  crossing: ["その橋は、ほかの橋と交わってしまいます。先に、ほかの橋を消してください。", "That bridge would cross another. Take the other one away first."],
  allNumbers: ["どの島も数字どおりになりましたが、まだ答えではありません。すべての島が、ひとつにつながっていますか？", "Every island has its number, and it is not the answer yet: are they all joined into one?"],
} as const;

export const BRIDGES_CELL_WORDS_JA = {
  ".": ["消した", "cleared"],
  "-": ["横に橋1本", "one bridge across"],
  "=": ["横に橋2本", "two bridges across"],
  "|": ["縦に橋1本", "one bridge down"],
  H: ["縦に橋2本", "two bridges down"],
} as const;

export const PICTURE_COPY_JA = {
  howTo: ["タップで塗り、もう1回で×印、もう1回で消えます。行や列に沿ってドラッグすると、最初のマスと同じことを、通ったマスすべてにします。", "Tap to shade, again for ✕, again to clear. Drag along a row or column to do the same to every square like the first."],
  howToMark: ["タップで×印、もう1回で塗り、もう1回で消えます。行や列に沿ってドラッグすると、最初のマスと同じことを、通ったマスすべてにします。", "Tap to mark ✕, again to shade, again to clear. Drag along a row or column to do the same to every square like the first."],
  pens: { shade: ["塗る", "Shade"], mark: ["×印", "Mark ✕"] },
  pensLabel: ["最初のタップ", "First tap"],
} as const;

export const PICTURE_CELL_WORDS_JA = {
  ".": ["消した", "cleared"],
  "#": ["塗った", "shaded"],
  x: ["空と決めた", "marked empty"],
} as const;

export const PENCIL_COPY_JA = {
  shikaku: {
    howTo: ["長方形の角を1か所タップして、向かい合う角をタップします。", "Tap one corner of a rectangle, then the opposite corner."],
    corner: ["次に、向かい合う角をタップします。", "Now tap the opposite corner."],
    step: ["長方形を描いた", "a rectangle"],
  },
  akari: { howTo: ["白いマスをタップすると、電球が置かれます。", "Tap a white square to put a bulb in it."], step: ["電球を置いた", "a bulb"] },
  loop: { howTo: ["2つの点のあいだの線をタップすると、線が引かれます。", "Tap a line between two dots to draw it."], step: ["線を引いた", "a line"] },
  hitori: { howTo: ["マスをタップすると、塗られます。", "Tap a square to shade it."], step: ["塗った", "shaded"] },
  regions: { howTo: ["マスをタップして、数字をタップします。", "Tap a cell, then a number."] },
  crossSums: { howTo: ["白いマスをタップして、数字をタップします。", "Tap a white cell, then a digit."] },
} as const;

export const JIRAI_COPY_JA = {
  howTo: ["マスをタップして開きます。押し続けるか、「旗」をオンにすると、地雷に旗を立てられます。", "Tap a square to uncover it. Press and hold, or turn on Flag, to flag a mine."],
  flagging: ["旗がオンです。マスをタップして旗を立て、もう1回タップすると外せます。", "Flag is on: tap a square to flag it, and again to take the flag off."],
  label: ["地雷の盤、{0}×{0}。マスをタップして開きます。押し続けるか右クリックすると、旗を立てられます。", "Jirai board, {0} by {0}. Tap a square to uncover it; press and hold, or right-click, to flag it."],
  minesLeft: {
    by: 1,
    is: { "0": ["地雷は残り{0}個", "{0} mines left"] },
    other: ["地雷は残り{0}個 · まちがい{1}回", "{0} mines left · {1} mistakes"],
  },
  boom: {
    by: 0,
    is: { "1": ["地雷でした。その場所に旗が立ち、まちがいとして数えられます。", "That was a mine. It is flagged where it lies, and counted as a mistake."] },
    other: ["地雷が{0}個ありました。その場所に旗が立ち、まちがいとして数えられます。", "{0} mines. They are flagged where they lie, and counted as mistakes."],
  },
} as const;
