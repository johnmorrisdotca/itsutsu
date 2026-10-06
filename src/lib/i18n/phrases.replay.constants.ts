/**
 * replay.*: a finished game's page and the record's list: the replay's controls, the move list, the conversation, the paging and the record page (`src/components/history/`). A heading with a kanji is shown as the kanji to a Japanese reader.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_REPLAY = {
  // The replay's buttons and its move count
  "replay.start": "Start",
  "replay.back": "Back",
  "replay.play": "Play",
  "replay.pause": "Pause",
  "replay.forward": "Forward",
  "replay.end": "End",
  "replay.scrubber": "Move",
  "replay.moveOf": "Move {move} of {last}",
  "replay.made": "made {when}",
  "replay.ended": "ended {when}",
  "replay.started": "started {when}",
  // Under the board
  "replay.boardLabel": "this game",
  "replay.noStones": "No stones were played in this game.",
  "replay.noMoves": "No moves yet.",
  "replay.flip": "Flip the board",
  "replay.flipBack": "Flip the board back",
  "replay.showNumbers": "Show move numbers",
  "replay.hideNumbers": "Hide move numbers",
  "replay.moves": "Moves",
  "replay.movesAsText": "Moves as text",
  "replay.copyAsText": "Copy as text",
  "replay.copyAll": "Copy it all",
  "replay.copied": "Copied",
  "replay.show": "show",
  "replay.hide": "hide",
  "replay.advanced": "Advanced",
  "replay.forkSays": "A new game from the position on the board, move {move}, against the same player, each of you keeping your colour. You set the clock first, and this game stays as it ended.",
  "replay.forkHint": "Step back to an earlier move, and you can play a new game on from that position against the same player.",
  "replay.forkLabel": "Play from move {move}",
  // The conversation kept with a game
  "replay.said": "What they said",
  "replay.sent": "What they sent",
  "replay.beforeGame": "Before the game",
  "replay.moveNumber": "Move {move}",
  // Hiding a game, and judging your own play
  "replay.hideGameHint": "Hidden games still count in your totals; they just leave your public list.",
  "replay.showOnList": "Show on my list",
  "replay.hideFromList": "Hide from my list",
  "replay.selfVerdict": "How do you think you played?",
  "replay.selfWell": "Well",
  "replay.selfNotWell": "Not well",
  "replay.selfPrivate": "Private; only you see it.",
  // The record's list, its progress and its pages
  "replay.empty": "No games match these filters yet.",
  "replay.rowAria": "Replay: {black} vs {white}",
  "replay.vs": "vs",
  "replay.allShown": "All {games} shown.",
  "replay.progressMore": "{shown} of {total} shown. Keep scrolling for more.",
  "replay.progressLoading": "{shown} of {total} shown — reading more…",
  "replay.scrollFailed": "More games could not be loaded just now — the pages below still work.",
  "replay.pagination": "Pagination",
  "replay.pageOf": "Page {page} of {pages} · {games}",
  "replay.previous": "Previous",
  "replay.next": "Next",
  // The narrowing chips and the filters over the record
  "replay.stopNarrowing": "Stop narrowing to {label}",
  "replay.remove": "— remove",
  "replay.howItWent": "How it went for {name}",
  // The record page itself
  "replay.yours": "Yours",
  "replay.leadAll": "Every finished game, newest first. Open one to replay it stone by stone.",
  "replay.leadGame": "Every finished game of {game}, newest first. Open one to replay it stone by stone.",
  "replay.memberUnknown": "That member could not be found, so this is the unfiltered record.",
  "replay.filtersInvalid": "Those filters were not valid, so this is the unfiltered record.",
  "replay.textHeadingAll": "{site} — every finished game",
  "replay.textHeadingGame": "{site} — every finished game of {game}",
  // A move written in another site's style
  "replay.formatIyt": "IYT style",
  "replay.formatGt": "GT style",
} as const;
