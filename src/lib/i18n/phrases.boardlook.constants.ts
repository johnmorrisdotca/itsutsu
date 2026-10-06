/**
 * boardlook.*: what the board's own chrome says: surfaces, felts, stone sets, grid views, size, focus and the turn guide (`src/components/board/`, `BareBoard`).
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_BOARDLOOK = {
  // Surfaces (the woods, paper, ink and tea a board can be)
  "boardlook.themeKaya": "Kaya",
  "boardlook.themeShinkaya": "Shin-kaya",
  "boardlook.themeWashi": "Washi",
  "boardlook.themeSumi": "Sumi",
  "boardlook.themeMatcha": "Matcha",
  // Felts (the cloth a Reversi board is covered in)
  "boardlook.feltGreen": "Green",
  "boardlook.feltBlue": "Blue",
  "boardlook.feltRed": "Red",
  "boardlook.feltBlack": "Black",
  "boardlook.feltPicker": "Board colour",
  "boardlook.feltOwnAria": "Your board, {name}",
  "boardlook.feltOwnTitle": "Your board ({name})",
  // Stone sets
  "boardlook.stonesClassic": "Slate & shell",
  "boardlook.stonesJade": "Jade & bone",
  "boardlook.stonesSakura": "Plum & blossom",
  "boardlook.stonesIndigo": "Indigo & rice",
  "boardlook.stonesNeon": "Neon",
  // The three ways of drawing a board
  "boardlook.gridAuto": "Traditional view",
  "boardlook.gridAutoHint": "Each game drawn the way it is played: gomoku and go on the lines, tic-tac-toe and Reversi in the squares.",
  "boardlook.gridLines": "{site} view",
  "boardlook.gridLinesHint": "Every game on the crossings, as on a go board — the house style, tic-tac-toe included.",
  "boardlook.gridCells": "Squares view",
  "boardlook.gridCellsHint": "Every game inside the squares, as on a chessboard — gomoku included.",
  // A board's size, said for a screen reader
  "boardlook.sizeBy": "{width} by {height} board",
  "boardlook.solidStep": "{name}, size {step} of 3",
  // Opening one board on its own
  "boardlook.focusThis": "this board",
  "boardlook.focusDialog": "{board}, on its own",
  "boardlook.focusOpen": "Open {board} on its own",
  "boardlook.focusCloseAria": "Close, back to the page",
  "boardlook.focusCloseTitle": "Close (Esc)",
  "boardlook.focusClose": "Close",
  // The size of the board on a desk, and the just-the-board mode
  "boardlook.scaleGroup": "Board size",
  "boardlook.scaleHeading": "Board",
  "boardlook.scaleRegular": "Regular",
  "boardlook.scaleRegularWhole": "Regular board size, as the page draws it",
  "boardlook.scaleLarge": "Large",
  "boardlook.scaleLargeWhole": "Large board, halfway to full screen",
  "boardlook.scaleFull": "Full",
  "boardlook.scaleFullWhole": "Full screen board, as large as the window allows",
  "boardlook.bareEnter": "Just the board",
  "boardlook.bareEnterTitle": "Read this page as the board and the moves alone",
  "boardlook.bareClose": "Close",
  "boardlook.bareCloseTitle": "Close, and bring back the rest of the page (Esc)",
  "boardlook.bareLabel": "Just the board",
  // Turning the quadrants of a twisting board
  "boardlook.twistAnti": "Turn quadrant {quadrant} anticlockwise",
  "boardlook.twistClock": "Turn quadrant {quadrant} clockwise",
  // The turn guide under the board
  "boardlook.guideCapture": "You must capture.",
  "boardlook.guideMost": "You must take the most pieces.",
  "boardlook.guideOnly.one": "Only one move: {moves}.",
  "boardlook.guideOnly.other": "Only {count} moves: {moves}.",
  "boardlook.guidePieces.one": "The piece that may move: {moves}.",
  "boardlook.guidePieces.other": "The pieces that may move: {moves}.",
  // One square, for a screen reader
  "boardlook.squareBlocked": "blocked",
  "boardlook.squareHot": "hotspot",
  "boardlook.squareWorm": "wormhole",
  "boardlook.squareForbidden": "forbidden",
  "boardlook.squareEmpty": "empty",
  "boardlook.squareKing": "{colour} king",
  "boardlook.squareStone": "{colour} stone",
  "boardlook.squareLine": "{point}, {what}",
  // The line over a game opened on its own
  "boardlook.playedOn": "Played on {site} · {day}",
  "boardlook.storyTitle": "{black} vs {white} · {game}, {board}",
} as const;
