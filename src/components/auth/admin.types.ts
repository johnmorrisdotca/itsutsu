import type { PhraseDrawFields } from "@/lib/phrase/phraseSetup.types";

/**
 * The member the Words modal is about: as much of the row as it needs and
 * nothing else.
 *
 * A shape of its own rather than `MemberSummary`, because the modal has no
 * business with a ban, an invite code or a kind — and a component handed the
 * whole row is one that will start reading the rest of it.
 */
export type WordsSubject = {
  id: string;
  name: string;
  /**
   * When four words were last set on this account, or null for never.
   *
   * A date, never the hash. It is what the modal asks the replace question
   * with, and "there is already one" without a date is a question nobody can
   * weigh — see `ADMIN_WORDS_COPY.replaceQuestion`.
   */
  phraseSetAt: string | null;
};

export type MemberWordsModalProps = {
  member: WordsSubject;
  /** Shut without setting anything. The words held so far are dropped. */
  onClose: () => void;
  /**
   * Told the moment words are set, so the list behind the modal can read the
   * new date off the server.
   *
   * It carries nothing. The date is the server's to state and the list asks
   * for it; a date handed up from here would be the browser telling a list
   * what the database says, which is one more thing that can disagree.
   */
  onSaved: () => void;
};

/**
 * One round of the operator's picker.
 *
 * The member's own fields — the slots, the offer, the ticket — plus who the
 * pick is for, read on the server at the moment it opened. The list's own copy
 * of `phraseSetAt` may be minutes old; this is the same fact as of now, and it
 * is why the replace question can be asked before four words are chosen rather
 * than after.
 */
export type AdminDrawFields = PhraseDrawFields & {
  member: { id: string; name: string; set: boolean; setAt: string | null };
};
