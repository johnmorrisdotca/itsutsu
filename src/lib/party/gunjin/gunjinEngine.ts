/**
 * THE PACKAGE'S ENGINE, REACHED FROM ONE PLACE. Gunjin's generic functions (the
 * ones that take a mode, so all four boards go through them) are the same
 * module whichever mode entry point re-exports them; 0.1.0 and 0.1.2 re-export them
 * from each mode's, and its API notes say `/trusted` does, which it still does not
 * (checked at 0.1.2; its `decodeTrustedMatch` reads all four modes now, but the
 * site keeps a game as its moves and does not use it). The rest of the site imports them from here, so when the
 * package moves them, one line changes. From 0.2.0 the same entry points export the calls that end a match
 * without a capture (resign, and offering, accepting and declining a draw), for a match of any mode.
 */
export { acceptDraw, acknowledgePass, createMatch, declineDraw, offerDraw, playMove, resignMatch, rosterForSetup, submitSetup } from "@johnmorrisdotca/gunjin/gunjin-shogi";
