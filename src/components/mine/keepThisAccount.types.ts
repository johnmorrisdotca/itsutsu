/** The welcome's prompt for an account a code made, which has no address. */
export type KeepThisAccountProps = {
  /**
   * How long this browser's session lasts — `PLAYER_SESSION_DAYS`, handed down
   * by the page so the sentence and the cookie cannot come to disagree.
   */
  days: number;
  /**
   * Whether Google sign-in is configured on this deployment. Without it there is
   * no button to press, and the sentence does not offer one.
   */
  googleReady: boolean;
};
