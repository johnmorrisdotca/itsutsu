/**
 * rulespage.*: the sentences a rules page builds from a game's spec rather than from its copy (`src/lib/learn/rulesPage.ts`,
 * `rulesPage.checkers.ts`). A game's own words (tagline, origin, rule bullets, board advice) are its sibling table, ENJA-05.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 */
export const PHRASES_RULESPAGE = {
  // A number with its noun, counted the reader's way (`Speaker.count`): a counter word after the digits in Japanese.
  "rulespage.count.stone.one": "{count} stone",
  "rulespage.count.stone.other": "{count} stones",
  "rulespage.count.enemyStone.one": "{count} enemy stone",
  "rulespage.count.enemyStone.other": "{count} enemy stones",
  "rulespage.count.piece.one": "{count} piece",
  "rulespage.count.piece.other": "{count} pieces",
  "rulespage.count.point.one": "{count} point",
  "rulespage.count.point.other": "{count} points",
  "rulespage.count.rock.one": "{count} rock",
  "rulespage.count.rock.other": "{count} rocks",
  "rulespage.count.hotspot.one": "{count} hotspot",
  "rulespage.count.hotspot.other": "{count} hotspots",
  "rulespage.list.and": "{head} and {last}",
  "rulespage.list.or": "{head} or {last}",
  "rulespage.list.orEither": "{head} or {last}",
  "rulespage.stone.black": "Black",
  "rulespage.stone.white": "White",
  "rulespage.pattern.doubleThree": "a double three (三三)",
  "rulespage.pattern.doubleFour": "a double four (四四)",
  "rulespage.pattern.overline": "an overline (長連)",
  "rulespage.object.connectsJoin":
    "Join your own two sides of the board with an unbroken chain of your stones: Black the top and bottom, White the left and right.",
  "rulespage.object.connectsNoDraw":
    "A full board always has exactly one winner, so a draw is impossible — that is a fact about the shape of the board, not a rule anybody wrote.",
  "rulespage.object.campsFill":
    "Be the first to fill the far corner camp with your pieces. Nothing is captured and no line counts for anything.",
  "rulespage.object.campsBlock": "A side that keeps pieces at home to block still loses once every other square of its camp is taken.",
  "rulespage.object.starFill":
    "Be the first to fill the point of the star directly opposite yours with your own pieces. Nothing is captured and no line counts for anything.",
  "rulespage.object.starBlock": "A side that keeps pieces at home to block still loses once every other cell of the far point is taken.",
  "rulespage.object.flipsFewer": "Finish with fewer discs than the other colour. Everything turns as usual; the object is upside down.",
  "rulespage.object.flipsMore": "Finish with more discs than the other colour.",
  "rulespage.object.flipsEnd": "The game ends when neither colour has a legal move — usually a full board. Equal counts are a draw.",
  "rulespage.object.checkersNoMove":
    "Leave the other side with no piece that can move: jump theirs off the board until none is left, or shut in whatever remains.",
  "rulespage.object.checkersNoLines":
    "No lines and nothing placed after the start: every piece is down from the first move, and the whole game is in how they step and jump.",
  "rulespage.object.goSurround":
    "Surround more of the board than the other colour. Stones never move once placed, and no line ever wins anything.",
  "rulespage.object.goCapture":
    "A connected group of one colour with no empty point touching it anywhere is captured whole, off the board at once.",
  "rulespage.object.makerBreaker":
    "Black is the Maker and wins if any {length} in a row of one colour appears, whoever placed it. White is the Breaker and wins if the board fills with no such line.",
  "rulespage.object.misere": "Avoid making {length} in a row: the player who makes it loses.",
  "rulespage.object.loseLength": "Make {length} in a row and win, without ever making exactly {lose}, which loses.",
  "rulespage.object.line": "Be the first to make a line: {rule}.",
  "rulespage.object.lineWhite": "For white, {rule}.",
  "rulespage.object.ruleExact": "exactly {length} in a row wins; a longer line does not",
  "rulespage.object.ruleExactOpen": "exactly {length} in a row wins, and not when an opponent's stone shuts it in at both ends",
  "rulespage.object.ruleAtLeast": "{length} or more in a row wins",
  "rulespage.object.capturesBoth": "Capturing {stones} also wins, taken in pairs and triples.",
  "rulespage.object.capturesPairs": "Capturing {stones} also wins, five pairs.",
  "rulespage.object.anyColour": "A line of either colour wins for the player who completed it.",
  "rulespage.object.square": "Four of your pieces in a 2×2 square also wins.",
  "rulespage.board.sizeOne": "A {size}×{size} board.",
  "rulespage.board.sizeMany": "A square board of {sizes} lines; {opens}×{opens} by default.",
  "rulespage.board.quadrants": "It is divided into four {size}×{size} quadrants, each of which can be turned.",
  "rulespage.board.rocksFall":
    "It starts empty. Once {after} have been played, {dead} and {hot} fall onto it, laid from the game's seed: a rock is a point nothing can land on and no line runs through, and a hotspot counts as either colour's stone. One that falls on a stone is lost, and so is a hotspot that would finish a line by itself.",
  "rulespage.board.rocks":
    "{dead}, laid from the game's seed anywhere but the centre, are rocks: nothing can land there and no line runs through.",
  "rulespage.board.hotspots": "{hot} more are hotspots, which count as either colour's stone.",
  "rulespage.board.deadOne": "One square, chosen at random when the game starts, is dead: nothing can land there and no line runs through.",
  "rulespage.board.deadMany":
    "{count} squares, chosen at random when the game starts, are dead: nothing can land there and no line runs through.",
  "rulespage.board.hotOne": "One square, chosen at random, is a hotspot that counts as either colour's stone.",
  "rulespage.board.hotMany": "{count} squares, chosen at random, are hotspots that count as either colour's stone.",
  "rulespage.board.wrapColumns": "The left and right edges join, so a line may run off one side and onto the other.",
  "rulespage.board.wrapBoth":
    "Every edge joins its opposite: left to right and top to bottom. A line running off any side continues from the far one, so the board has a middle everywhere and a corner nowhere.",
  "rulespage.board.wormholes":
    "Two squares, chosen at random when the game starts, are the mouths of a wormhole. Nothing can land on a mouth, and a line that reaches one continues from the other in the same direction.",
  "rulespage.board.pieces": "Each player has {pieces}.",
  "rulespage.board.connects":
    "A rhombus ruled as a triangular lattice, eleven points a side by default, with the stones on the crossings. Black owns the top and bottom edges, marked dark; White owns the left and right, marked pale. The two corners between a dark edge and a pale one belong to both.",
  "rulespage.board.camps":
    "Each side's pieces start filling a camp in one corner, black top-left and white bottom-right: nineteen on 16×16, thirteen on 10×10, ten on 8×8. The camps are shaded on the board.",
  "rulespage.board.hexFlips":
    "A hexagon of hexagons, {side} cells a side and {cells} in all, with the centre cell sealed and the six round it set at the start, three of each colour, no two alike side by side. Every cell touches six others, so a run may lie along any of six directions rather than eight.",
  "rulespage.board.hexFlipsOthers":
    "It is played on {boards} hexagons in all: this one, and {list}. The centre is sealed on every one of them, which leaves an even number of cells to fill whichever board is chosen.",
  "rulespage.board.hexLines":
    "A hexagon of hexagons, {side} cells a side and {cells} in all, with nothing sealed at the centre. Every cell touches six others, but a line may only run along three of the lattice's own axes.",
  "rulespage.board.hexLinesOthers": "It is played on {boards} hexagons in all: this one, and {list}.",
  "rulespage.board.hexOther": "{cells} cells at {side} a side",
  "rulespage.board.star":
    "A hexagram: a centre hexagon with six triangular points, 121 cells in all. Each side's ten pieces start filling one point, black at the top and white at the bottom, shaded on the board; the far point is the one to fill.",
  "rulespage.board.go":
    "Stones sit on the intersections of the lines, not in the squares between them, so the board has one more point on a side than it has squares. The star points mark the traditional handicap spots.",
  "rulespage.board.queueDomino":
    "A shared queue of dominoes: two stones each, black-black, white-white, black-white or white-black, drawn at random from the game's seed. Both players draw the same run and see the next three.",
  "rulespage.board.queueShapes":
    "A shared queue of the seven four-square shapes, each holding two black and two white stones, drawn at random from the game's seed. Both players draw the same run and see the next three.",
  "rulespage.play.connectsTurn": "Players take turns placing one stone on any empty point. Nothing ever moves and nothing is ever taken.",
  "rulespage.play.connectsLines":
    "Three families of lines cross at every point, so each one touches six others: two along its row, two along its slanted column, and two along the board's short diagonal.",
  "rulespage.play.connectsEnd": "The game ends the moment one colour's chain reaches from one of their sides to the other.",
  "rulespage.play.campsStep": "A turn moves one piece. It may step to any neighbouring empty square, in any of the eight directions.",
  "rulespage.play.campsJump":
    "Or it may jump: over an adjacent piece of either colour, into the empty square straight beyond it. From there it may jump again, and again, turning corners as it likes, so long as each jump crosses a piece. A move may stop after any jump.",
  "rulespage.play.jumpedStays": "A piece jumped over is not taken; it stays where it is.",
  "rulespage.play.campsEnd": "The game ends the moment a move fills the far camp.",
  "rulespage.play.starStep":
    "A turn moves one piece. It may step to any neighbouring empty cell, in any of the six directions the board's own lattice touches.",
  "rulespage.play.starJump":
    "Or it may jump: over an adjacent piece of either colour, into the empty cell straight beyond it. From there it may jump again, and again, turning corners as it likes, so long as each jump crosses a piece. A move may stop after any jump.",
  "rulespage.play.starEnd": "The game ends the moment a move fills the point directly opposite yours.",
  "rulespage.play.hexStart": "The six cells round the sealed centre start with three discs of each colour, alternating round the ring.",
  "rulespage.play.hexBracket":
    "A disc goes only where it brackets one or more of the other colour in a straight run along one of the six lattice directions, with one of your own at the far end. Every bracketed run turns to your colour. The sealed centre closes nothing: a run that reaches it turns nothing.",
  "rulespage.play.hexPass": "A colour with nowhere to go passes, and the other colour plays again. You may not pass while you have a move.",
  "rulespage.play.hexCount": "When neither colour can move, the discs are counted.",
  "rulespage.play.queueLay": "Each turn you lay the next piece in the queue, turned or flipped as you like, on empty points.",
  "rulespage.play.queueSingles": "Instead of a piece you may lay a single stone of your own colour; each player has {count} for the game.",
  "rulespage.play.queueLines":
    "A piece carries both colours, so it can finish a line for either side; the line's owner wins whoever laid it, and a line for each at once is a draw.",
  "rulespage.play.queuePass": "If nothing fits, the turn passes; two passes in a row end the game as a draw.",
  "rulespage.play.goTurn": "Players take turns placing one stone on any empty intersection. Black opens; stones never move once played.",
  "rulespage.play.goCapture":
    "A stone touches its four orthogonal neighbours, not the diagonals. Play a stone that leaves an adjacent enemy group with no liberty left anywhere and the whole group comes off the board at once.",
  "rulespage.play.goKo":
    "You may not play into your own group's last liberty unless the same move captures an enemy group and so opens one. You may not immediately retake the single stone a capture just lifted — the ko rule — though playing anywhere else first, even a pass, clears it.",
  "rulespage.play.goPass":
    "Either side may pass instead of playing. Two passes in a row end the game and it is counted: every stone on the board plus every empty point surrounded by one colour alone, with a fixed 6.5-point bonus for white.",
  "rulespage.play.pieces":
    "Players first place their {pieces}, one a turn. Then a turn moves one of your pieces a single step to an adjacent empty point, in any direction.",
  "rulespage.play.stonesMany": "Black opens with {first}; after that each player places {per} a turn.",
  "rulespage.play.stoneOne": "Players take turns placing one stone on an empty point.",
  "rulespage.play.singleColour": "Every stone is black, whoever places it.",
  "rulespage.play.anyColour": "On your turn you choose which colour to place.",
  "rulespage.play.drop": "A stone played anywhere in a column falls to the lowest empty point in it.",
  "rulespage.play.edge":
    "A stone may only be placed on an edge of the board or directly beside a stone already there: above, below, left or right.",
  "rulespage.play.quadrant":
    "After placing, turn any one quadrant a quarter, either way. The whole board is then read for lines, for both colours.",
  "rulespage.play.capturesBoth":
    "Flanking exactly two or exactly three enemy stones in a line, with your stone at each end, captures them. Only the closing stone captures; moving into a flanked position is safe.",
  "rulespage.play.capturesPair":
    "Flanking exactly two enemy stones in a line, with your stone at each end, captures the pair. Only the closing stone captures; moving into a flanked position is safe.",
  "rulespage.play.lineClear": "When the bottom row is full it disappears and every stone above drops one row.",
  "rulespage.play.misereDrop": "You may not play directly on top of the opponent's last stone while any other column has room.",
  "rulespage.play.misereFull": "A full board is a win for the player who opened.",
  "rulespage.play.makerFull": "A full board with no line is the Breaker's win.",
  "rulespage.play.drawQuadrant": "A full board with no line, after its last turn, is a draw; a line for both colours at once is a draw.",
  "rulespage.play.drawFull": "A full board with no line is a draw.",
  "rulespage.house.forbidden":
    "{stone} may not make {patterns}. Those points are marked on the board and cannot be played. A five wins even when the same stone would make a forbidden shape.",
  "rulespage.house.chooseFirst": "Either colour may open, or the first stone may be drawn by lot.",
  "rulespage.house.alwaysOpens": "{stone} always opens.",
  "rulespage.house.openings": "Openings on offer: {names}.",
  "rulespage.house.readingOn": "The threat reading, hints and the chance-of-winning bar apply.",
  "rulespage.house.readingOffFlips":
    "The threat reading, hints and the chance-of-winning bar are switched off: there are no lines to read here, only discs to count.",
  "rulespage.house.readingOffRace":
    "The threat reading, hints and the chance-of-winning bar are switched off: there are no lines here, only distance to cover.",
  "rulespage.house.readingOffConnects":
    "The threat reading, hints and the chance-of-winning bar are switched off: there are no lines here, only whether your two sides are joined.",
  "rulespage.house.readingOffCheckers":
    "The threat reading, hints and the chance-of-winning bar are switched off: there are no lines here, only pieces jumping.",
  "rulespage.house.readingOffGo":
    "The threat reading, hints and the chance-of-winning bar are switched off: there are no lines here, only groups, liberties and territory.",
  "rulespage.house.readingOffMoving":
    "The threat reading, hints and the chance-of-winning bar are switched off: stones move after they are placed, so a line-by-line reading says nothing true.",
  "rulespage.checkers.board":
    "Played on the dark squares only, {dark} of the {all}. Each side starts with {men} men filling its own {rows} rows.",
  "rulespage.checkers.step": "A turn moves one piece: a man steps one square diagonally forward, onto an empty square.",
  "rulespage.checkers.forcedFree":
    "Capturing is a jump over an adjacent enemy piece into the empty square beyond, and it is forced: if any of your pieces can capture, you must play a capture rather than a step, though you may choose which one.",
  "rulespage.checkers.menBackward": "A man captures by jumping an adjacent enemy piece into the empty square beyond it, forward or backward.",
  "rulespage.checkers.menForward": "A man captures by jumping an adjacent enemy piece into the empty square beyond it, forward only.",
  "rulespage.checkers.choiceMost":
    "Capturing is forced, and so is taking the most you can: of every capture on the board, only one taking the greatest number of pieces may be played. A king counts as one piece, the same as a man; among captures taking equally many, you choose.",
  "rulespage.checkers.choiceFree":
    "Capturing is forced: if any of your pieces can capture, you must play a capture rather than a step, though you may choose which one — the longer or the shorter.",
  "rulespage.checkers.crownStops":
    "A piece that captures and can capture again from where it lands keeps jumping in the same move. A man crowned partway through always stops there — only a king may carry a chain on, and only on a later move.",
  "rulespage.checkers.crownPasses":
    "A piece that captures and can capture again keeps going in the same move, turning corners as it must. A man that crosses the far row partway through is not crowned: it carries on as a man, and is crowned only if the capture ends there.",
  "rulespage.checkers.crownAtOnce":
    "A piece that captures and can capture again keeps going in the same move, turning corners as it must. A man that reaches the far row partway through is crowned at once, and carries on capturing as a king.",
  "rulespage.checkers.afterCapture":
    "The pieces a capture takes come off the board only when it is over. Until then each still stands in the way: none may be jumped a second time, and nothing may pass through one.",
  "rulespage.checkers.crownFlying":
    "A man whose move ends on the far row is crowned a king. A king flies: it moves any distance along an open diagonal, either way, and captures a piece at any distance, landing on any empty square beyond it — one from which it can capture again, where there is one.",
  "rulespage.checkers.crownPlain": "A man reaching the far row is crowned a king, and may then step and capture backward as well as forward.",
  "rulespage.checkers.gameEnd": "The game ends the moment a colour has no piece that can move: none left, or every one shut in.",
  "rulespage.checkers.kingOne": "a king",
  "rulespage.checkers.kingMany": "{count} kings",
  "rulespage.checkers.manOne": "a man",
  "rulespage.checkers.manMany": "{count} men",
  "rulespage.checkers.tally": "{kings} and {men}",
  "rulespage.checkers.against": "{one} against {other}",
  "rulespage.checkers.kingsOrMore": "{count} or more kings against {against}",
  "rulespage.checkers.drawIdle": "It is a draw once {moves} moves each have gone by in which only kings have moved and nothing has been taken.",
  "rulespage.checkers.drawRepeat": "It is a draw when the same position comes round for the third time with the same side to move.",
  "rulespage.checkers.drawBalance":
    "It is a draw when, in an ending of {pieces} pieces with a king on each side, {moves} moves each go by with nothing taken and no man crowned.",
  "rulespage.checkers.drawCountFresh":
    "It is a draw when {ending} is not won within {moves} more moves each, counted afresh whenever a piece is taken or crowned.",
  "rulespage.checkers.drawCountOnce": "It is a draw when {ending} is not won within {moves} more moves each of that ending arising.",
} as const;
