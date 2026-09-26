import { expiryInDays, nowInSeconds, signPayload, verifyPayload, type Signed } from "../auth/signing.ts";
import type { Preferences } from "../preferences/preferences.types.ts";

/**
 * EVERY EMAIL SAYS HOW TO STOP GETTING IT.
 *
 * Canada's anti-spam law (and CAN-SPAM for the players in the US) wants a
 * working way out of every such message, honoured promptly and needing no
 * sign-in: somebody who wants out will not log in to ask. So each email a
 * member is sent carries a link to `/stop/<token>`, where one press stops that
 * kind of email or all of them, and the headers mail programs read
 * (`List-Unsubscribe`, `List-Unsubscribe-Post`) so Gmail and Apple Mail offer
 * the same in their own menus, in one click.
 *
 * THE TOKEN IS THE WHOLE CREDENTIAL, and it grants exactly one thing: saying
 * which of one member's emails they want. It is signed with the site's key and
 * a kind of its own (`signing.ts` checks the kind, so a session or an embed
 * token is never one of these), names the member and the kind of email it was
 * sent with, and lasts well past the sixty days the law asks a way out to keep
 * working after a message is sent. It is checked on the Edge by `proxy.ts`,
 * which lets the request continue and nothing more, and again by the page and
 * the route, which are what write.
 *
 * WHAT A PRESS WRITES. One kind off is its own preference (`mail.<kind>` in
 * the registry), so stopping the your-turn emails leaves a finished game's
 * email alone. "All of them" is `emailNotify`, the switch the address book
 * already asks. Both can be turned back on from the same page, since the way
 * back matters as much as the way out.
 */

/**
 * THE EMAILS A MEMBER CAN BE SENT, each a record rather than a switch. John,
 * 2026-09-16, pointing at GoldToken: a row per kind with a plain sentence
 * under it, and a default stated deliberately — the rare ones on, anything
 * chatty off. And the part worth taking from GoldToken's small print: a kind
 * carries a rule as well as a state, so a your-turn email is never sent to
 * somebody who is on the site to see the board for themselves.
 *
 * - `preference`: the registry row that says this kind is on or off, whose
 *   fallback is the default (`preferences.constants.ts`).
 * - `words`: what the stop page and an email's footer call it.
 * - `label` and `hint`: the switch in Settings and in the welcome.
 * - `notWhileHere`: held back while the member is on the site
 *   (`RECENCY_MINUTES.now`), where they would see it anyway.
 *
 * A kind added here is a kind every door knows: the stop link, the footer, the
 * switches and the address book all read this record.
 */
export const MAIL_KINDS = {
  "your-turn": {
    preference: "mail.yourTurn",
    words: "emails telling you it is your turn",
    label: "When it is my move",
    hint: "Never while you are on the site: only when a game is waiting and you are away.",
    notWhileHere: true,
  },
  "game-over": {
    preference: "mail.gameOver",
    words: "emails telling you a game of yours has finished",
    label: "When a game of mine finishes",
    hint: "Who won and why, how long it took, and a link to play again.",
    notWhileHere: false,
  },
} as const;

export type StopKind = keyof typeof MAIL_KINDS;

export const STOP_KIND_LIST = Object.keys(MAIL_KINDS) as StopKind[];

export function isStopKind(value: unknown): value is StopKind {
  return typeof value === "string" && Object.hasOwn(MAIL_KINDS, value);
}

/** What a stop token carries: whose emails, and which kind it came with. */
export type StopToken = Signed & { kind: "mail-stop"; member: string; mail: StopKind };

export const STOP_TOKEN_KIND = "mail-stop";

/** Long enough that a link in an old email still works: the law asks for sixty days, and a year costs nothing. */
export const STOP_TOKEN_DAYS = 400;

/** Where a stop link lands, and where a mail program's one-click POST goes. */
export function stopPagePath(token: string): string {
  return `/stop/${token}`;
}

export const STOP_API_PATH = "/api/mail/stop";

export async function signStopToken(memberId: string, mail: StopKind): Promise<string | null> {
  return signPayload({ kind: STOP_TOKEN_KIND, member: memberId, mail, exp: expiryInDays(STOP_TOKEN_DAYS), iat: nowInSeconds() } satisfies StopToken);
}

/** The token's member and kind, or null for anything unsigned, altered, expired or of another kind. */
export async function verifyStopToken(token: string | null | undefined): Promise<StopToken | null> {
  const payload = await verifyPayload<StopToken>(token ?? undefined, STOP_TOKEN_KIND);
  if (payload === null || typeof payload.member !== "string" || payload.member === "" || !isStopKind(payload.mail)) return null;
  return payload;
}

/** Which kinds a member hears, one switch a kind, as Settings and the welcome show them. */
export type MailKindsWanted = Record<StopKind, boolean>;

/** The switches from the member's preferences: each kind as chosen, or at its default where nobody has. */
export function mailKindsFrom(preferences: Pick<Preferences, (typeof MAIL_KINDS)[StopKind]["preference"]>): MailKindsWanted {
  return Object.fromEntries(STOP_KIND_LIST.map((kind) => [kind, preferences[MAIL_KINDS[kind].preference] === "on"])) as MailKindsWanted;
}

/** The switches as a preferences patch, every kind said, so what is saved is exactly what was shown. */
export function mailKindsPatch(kinds: MailKindsWanted): Record<(typeof MAIL_KINDS)[StopKind]["preference"], "on" | "off"> {
  return Object.fromEntries(STOP_KIND_LIST.map((kind) => [MAIL_KINDS[kind].preference, kinds[kind] ? "on" : "off"])) as Record<
    (typeof MAIL_KINDS)[StopKind]["preference"],
    "on" | "off"
  >;
}
