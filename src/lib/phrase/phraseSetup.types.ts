/** What the profile page already knows about a member's phrase, from the server. */
export type PhraseStatusFields = {
  set: boolean;
  setAt: string | null;
  hasEmail: boolean;
  mayRemove: boolean;
};

/** One round of the picker: what `/api/me/phrase/draw` hands back. */
export type PhraseDrawFields = {
  slots: (string | null)[];
  offered: string[];
  done: boolean;
  ticket: string;
};
