/**
 * Kumimoji played in the browser, in plain DOM: a whole game alone
 * (`mountKumimoji`), and the window a board shows the grid through
 * (`boardModel`). Its own entry, so the rules never carry a stylesheet.
 */
export { mountKumimoji, type KumimojiTableHandle, type KumimojiTableOptions } from "./ui/mount.ts";
export { BOARD_LEAST, BOARD_MARGIN, boardModel, type BoardModel, type BoardSquare, type TileMark } from "./ui/board.ts";
export { KUMIMOJI_STYLE } from "./ui/style.ts";
