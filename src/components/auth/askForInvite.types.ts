/** What asking for an invitation came to, as the form shows it. */
export type AskForInviteState =
  | { kind: "idle" }
  | { kind: "sent"; message: string }
  | { kind: "problem"; message: string };
