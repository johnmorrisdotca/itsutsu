/** One email, as the site means to send it. Plain text only: nothing a person typed is ever put into HTML. */
export type OutgoingMail = {
  to: string;
  subject: string;
  text: string;
};

/** What a transport reports: a provider's id when it accepted the mail, or why it did not. */
export type TransportResult = { ok: true; id: string | null } | { ok: false; detail: string };

/**
 * THE SEAM. The one thing that talks to a provider. Production uses
 * `resendTransport`; a test hands `sendMail` a fake, and nothing else can.
 */
export type MailTransport = (mail: OutgoingMail) => Promise<TransportResult>;

/** A cap that stopped a send. */
export type CapRefusal = "member-day-cap" | "site-day-cap" | "site-month-cap";

/** Every reason an email a person asked for was not sent. */
export type MailRefusal =
  | "not-production"
  | "no-key"
  | CapRefusal
  | "count-unavailable"
  | "transport-error";

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
export type MailSender = { memberId: string };

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
