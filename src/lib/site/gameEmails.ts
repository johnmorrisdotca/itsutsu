import "server-only";

import { mailRefusalFor } from "@/lib/mail/mailSwitch";

import { cachedSiteSettings } from "./liveBoardIntervals";

/**
 * Why game emails cannot be switched on here, or null when they can: this
 * deployment cannot send email at all (`mailRefusalFor`: not production, or no
 * provider key). John, 2026-09-26: "If the email service is not configured
 * correctly, then it should also be off and also disabled." The panel draws the
 * switch off and greyed with this reason, and `/api/site` refuses "on" for it.
 */
export function gameEmailsUnavailable(env: NodeJS.ProcessEnv = process.env): string | null {
  const refusal = mailRefusalFor(env);
  if (refusal === "not-production") return "Email is only ever sent from the live site, so game emails cannot be switched on here.";
  if (refusal === "no-key") return "The email service is not set up on this site (no provider key), so game emails cannot go. The switch stays off until it is.";
  return null;
}

/**
 * Whether game emails go: the operator's switch on Admin's site panel
 * (`gameEmails`), read through the same cached settings as the live boards, at
 * most once every ten minutes per server cache and sooner when the panel writes.
 *
 * OFF while this deployment cannot send email, whatever the switch says, and
 * OFF when the store cannot be read. An email that should have gone and did not
 * is a small loss; an email that went when the operator had them off is not one
 * this site gets to take back.
 */
export async function gameEmailsOn(): Promise<boolean> {
  if (gameEmailsUnavailable() !== null) return false;
  try {
    return (await cachedSiteSettings()).gameEmails === "on";
  } catch (error) {
    console.error(`Game emails are held off: the settings store could not be read. ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}
