/** The acts the operator log keeps — see `OPERATOR_ACTIONS`. */
export type OperatorActionName = "shut" | "restore" | "wordsSet" | "wordsPickOpened" | "rename";

/**
 * Who acted, as the operator's session knows them. Null where the session does
 * not say: an operator signed in by token has an address and may have no member
 * row, and a null records that honestly where an empty string would read as a
 * value somebody chose.
 */
export type OperatorActor = { memberId: string | null; email: string | null };

/** One act to keep: who, what, to whom, and a line of fact that is never a credential. */
export type OperatorActionInput = {
  actor: OperatorActor;
  action: OperatorActionName;
  subjectId: string;
  detail?: string;
};

/** One kept act, as the Admin tab lists it. */
export type OperatorActionEntry = {
  id: string;
  at: Date;
  actor: OperatorActor;
  /** The column's word as written. A string, because a row can outrun this version's list. */
  action: string;
  /** Whether `action` is one this version names — `OPERATOR_ACTION_DISPLAY` has its words. */
  known: boolean;
  subjectId: string;
  /** The member's name now, for `PlayerName`; null for an id with no member row any more. */
  subjectName: string | null;
  detail: string;
};
