/**
 * The limits the request form draws, from the rules that check them — so the
 * box and the check cannot disagree about how much may be typed. Copied into a
 * client-safe module because the rules live beside the sender, which is
 * server-only; `askForInvite.test.ts` holds the two to each other.
 */
export const INVITE_REQUEST_FIELDS = {
  trap: "website",
  emailLength: 254,
  nameLength: 80,
  aboutLength: 500,
} as const;

/**
 * The join page with the request form already open — where "No invite? Ask for
 * one" leads from /games and from a game's ladder, so the visitor lands on the
 * form rather than on a door they then have to find it behind.
 */
export const ASK_FOR_INVITE_PATH = "/join?ask=1";
