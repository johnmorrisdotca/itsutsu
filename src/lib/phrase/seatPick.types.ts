/**
 * One name on the list a person taps at a seat.
 *
 * Two fields and deliberately no more. John, when asked what to show beside a
 * name so two people called the same thing could be told apart: "If we pick the
 * wrong user, obviously it's not going to work." The four words are the check —
 * a wrong tap costs one attempt and nothing else — so a picture, a country, a
 * rating or a last-played date would be information printed for no decision.
 */
export type SeatPickMember = {
  /**
   * The member's opaque id, and THE WHOLE POINT OF THE LIST.
   *
   * A tap carries this rather than the name it printed, so nothing downstream
   * has to turn a string back into an account. That is what makes two members
   * called "John Morris" two rows a person chooses between instead of one name
   * the server has to guess at — and it is why display names here do not need
   * to be unique, and can stay what John says they are: advice about how you
   * appear to others, not an identifier.
   */
  id: string;
  /**
   * What the screen prints: `shownName`, so a first name and an initial.
   *
   * The full name is never sent to the browser for this. John had the site
   * changed to print "Hanako M." rather than a twelve-year-old's full name, and
   * a list of everybody would be the largest place on the site to undo that.
   */
  shown: string;
};
