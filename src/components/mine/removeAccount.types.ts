export type RemoveAccountProps = {
  /** The member's name as it stands, which is what they type to confirm — or the word, when it is empty. */
  name: string;
  /** Whether the account signs in with Google, and so must sign in again before it can be removed. */
  google: boolean;
  /** Whether this session signed in within the last few minutes (`signedInRecently`). */
  fresh: boolean;
};
