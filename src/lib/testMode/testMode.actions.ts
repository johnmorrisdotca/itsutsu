"use server";

import { revalidatePath } from "next/cache";

import { currentMemberRow } from "@/lib/auth/currentSession";
import { currentAdmin } from "@/lib/auth/requireAdmin";
import { rememberPreferences } from "@/lib/preferences/memberPreferences";

/**
 * Turns the OPERATOR'S OWN Test Mode on or off — see `testMode.ts` for what
 * that changes and for whom. Admin-gated here, not only by the panel that
 * offers the control: a Server Function is a public address, and this one
 * writes, so it re-checks the session itself rather than trusting whoever
 * rendered the button that called it.
 *
 * `revalidatePath("/", "layout")` because the banner this drives
 * (`TestModeBanner`) sits in the root layout and is shown on every page — a
 * flip has to be visible on whichever page the operator flips it from, and
 * on the next one they open, without a full reload.
 */
export async function setTestMode(on: boolean): Promise<{ ok: true; on: boolean } | { ok: false; problem: string }> {
  const admin = await currentAdmin();
  if (admin === null) return { ok: false, problem: "Not signed in as an admin." };
  // The operator holds no member row (a bare admin session): nothing to remember on.
  if ((await currentMemberRow()) === null) {
    return { ok: false, problem: "This admin has no member row of their own, so Test Mode has nowhere to be remembered." };
  }

  await rememberPreferences({ testMode: on });
  revalidatePath("/", "layout");
  return { ok: true, on };
}
