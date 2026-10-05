/**
 * THE PACKAGE'S ENGINE, REACHED FROM ONE PLACE. Gunjin's generic functions (the
 * ones that take a mode, so all four boards go through them) are the same
 * module whichever mode entry point re-exports them; 0.1.0 re-exports them from
 * each mode's, and its API notes say `/trusted` does, which it does not until a
 * later release. The rest of the site imports them from here, so when the
 * package moves them, one line changes.
 */
export { acknowledgePass, createMatch, playMove, rosterForSetup, submitSetup } from "@johnmorrisdotca/gunjin/gunjin-shogi";
