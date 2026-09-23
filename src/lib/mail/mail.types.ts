/** One email, as the site means to send it. Plain text only: nothing a person typed is ever put into HTML. */
export type OutgoingMail = {
  to: string;
  subject: string;
  text: string;
  /**
   * Where a reply goes, when it should not be the site's own address. Only an
   * invite request sets it — to the visitor who asked, so answering them is
   * pressing Reply. Everything else replies to `CONTACT_ADDRESS`.
   */
  replyTo?: string;
};

/** What a transport reports: a provider's id when it accepted the mail, or why it did not. */
export type TransportResult = { ok: true; id: string | null } | { ok: false; detail: string };

/**
 * THE SEAM. The one thing that talks to a provider. Production uses
 * `resendTransport`; a test hands `sendMail` a fake, and nothing else can.
 */
export type MailTransport = (mail: OutgoingMail) => Promise<TransportResult>;

/** A cap that stopped a send. */
export type CapRefusal =
  | "member-day-cap"
  | "site-day-cap"
  | "site-month-cap"
  /** An invite request from an address, or for an address, that has already asked today. */
  | "request-repeat-cap"
  /** Every invite request the site will send in a day, from everybody together. */
  | "request-day-cap";

/** Every reason an email a person asked for was not sent. */
export type MailRefusal =
  | "not-production"
  | "no-key"
  | CapRefusal
  | "count-unavailable"
  | "transport-error"
  /** Game notices are switched off at `NOTICES.sending`; see the reasoning there. */
  | "notices-off"
  /** Nobody to write to: no member row, no address on it, or the member asked not to hear. */
  | "no-address";

/**
 * SOMETHING THAT HAPPENED IN A GAME, worth telling one member about.
 *
 * Every kind names the member it is FOR. It used to be otherwise: an `invite`
 * kind carried a game and a seat and no member at all, so it could not address
 * anybody — a shape that reads as a working notice and is not one. Nothing
 * built it, and rather than leave it there to be filled in wrongly it is gone;
 * a notice about an invitation will arrive here carrying a member, like these.
 */
export type NoticeEvent =
  | { kind: "your-turn"; gameId: string; stone: "black" | "white"; memberId: string }
  | { kind: "game-over"; gameId: string; winner: "black" | "white" | null; stone: "black" | "white"; memberId: string };

/** What became of a notice. The same vocabulary as every other send, because it is the same sender. */
export type NoticeOutcome = SendOutcome;

/** Reads the address a notice would go to, so a test can answer without a database. */
export type AddressBook = {
  addressOf(memberId: string): Promise<string | null>;
};

export type NoticeDeps = SendDeps & { addresses?: AddressBook };

/** One counter a send must fit under: the row it counts in, its cap, and what to say when full. */
export type MailLimit = {
  key: string;
  cap: number;
  refusal: CapRefusal;
};

/**
 * Takes one place under every limit, or none. Answers null when the send may
 * go, or the refusal of the first limit that was full — never a count, so no
 * caller can read a number and decide for itself.
 */
export type MailCounter = {
  reserve(limits: readonly MailLimit[]): Promise<CapRefusal | null>;
};

export type SendOutcome = { sent: true; id: string | null } | { sent: false; refusal: MailRefusal };

/** The member whose own action this email is. Every send is somebody's; there is no system sender. */
export type MailSender =
  | { memberId: string }
  /**
   * A visitor with no account asking for an invitation. Counted under caps of
   * its own before the site's, so strangers can never spend the site's day:
   * see `inviteRequestLimits`. Both keys are keyed hashes — neither the
   * address a request came from nor the email typed into it is written down.
   */
  | { inviteRequest: { from: string; address: string } };

export type MailEnv = {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
  RESEND_API_KEY?: string;
};

export type SendDeps = {
  /** A fake, in tests. When given, the environment is not consulted. */
  transport?: MailTransport;
  counter?: MailCounter;
  now?: Date;
  env?: MailEnv;
};
