/**
 * Who is reading a page, in the answers the site actually has.
 *
 * A stranger holds nothing. A member holds a session and a member row — whether
 * they came in by Google, and so have an address, or with an invite code, and so
 * have none. The operator signed in by token holds a session and an address and,
 * on a database where nobody made one, no row. Two booleans and two nullable ids
 * say which, without one value having to mean two of them.
 */
export type Reader = {
  /**
   * Holding a session at all — a member, or the operator.
   *
   * THIS is what "signed in" means on every page: it is what lets somebody post
   * a seat, sit down at one, and press Begin, and it is what the masthead's
   * "Sign out" has always been answering. It used to be read off the address,
   * which is null for everybody John invites, so they were shown the stranger's
   * page one line below a button offering to sign them out.
   */
  signedIn: boolean;
  /**
   * The folded address, or null for a member who came in with an invite code
   * and for a stranger.
   *
   * For the questions only an address answers — is this the operator — and
   * never for deciding who somebody is or what they keep.
   */
  email: string | null;
  /** The member row's opaque id: who the reader IS, for isYou, buddies, ignores and marks. */
  memberId: string | null;
  /**
   * A member row: somebody the account routes answer.
   *
   * Asking somebody for a game, buddying, ignoring, applauding and saving a board
   * to the account all key on the member id, so they are offered wherever there
   * is one — a member who came in with an invite code included. Only a session
   * with no member behind it (the operator on a database that never made their
   * row) is signed in without one.
   */
  hasAccount: boolean;
};
