/**
 * Who is reading a page, in the three answers the site actually has.
 *
 * A stranger holds nothing. A browser that redeemed an invite code holds a
 * session and nothing else: no address, because Google never told us one, and
 * so no member row. A member came in by Google and holds all three. Those are
 * three different people, and two booleans and two nullable ids say which
 * without one value having to mean two of them.
 */
export type Reader = {
  /**
   * Holding a session at all — a member, or a browser that came in by invite.
   *
   * THIS is what "signed in" means on every page: it is what lets somebody
   * post a seat, sit down at one, and press Begin, and it is what the masthead's
   * "Sign out" has always been answering. It used to be read off the address,
   * which is null for everybody John invites, so they were shown the stranger's
   * page one line below a button offering to sign them out.
   */
  signedIn: boolean;
  /**
   * The folded address, or null for an invite holder and a stranger.
   *
   * For the reads still kept by address — a buddy list, an ignore list, the
   * account's preferences — and never for deciding who somebody is.
   */
  email: string | null;
  /** The member row's opaque id: who the reader IS, for isYou, buddies and ignores. */
  memberId: string | null;
  /**
   * An address with a member row behind it: somebody the social routes answer.
   *
   * Asking somebody for a game, buddying, ignoring, applauding and saving a
   * board to the account all refuse a caller with no address (401), so they are
   * offered only where this is true. An invite holder is signed in and has no
   * account, which is the whole of the difference between them and a member.
   */
  hasAccount: boolean;
};
