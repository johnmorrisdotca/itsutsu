export type InviteFriendsProps = {
  /**
   * Whether this deployment can send email at all (`mailRefusalFor`). When it
   * cannot, the address form is not drawn: a form that could only ever answer
   * "not sent" is a promise the page cannot keep.
   */
  canEmail: boolean;
};

/** What `POST /api/invites/mine` answers. `emailed` and `notice` only when an address was sent. */
export type InviteReply = {
  code: string;
  emailed?: boolean;
  notice?: string | null;
};
