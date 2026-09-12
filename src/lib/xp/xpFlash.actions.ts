"use server";

import { currentMemberId } from "@/lib/auth/currentSession";

import { clearXpFlashFor } from "./xpFlash";

/**
 * The toast host saying it has shown what it was given.
 *
 * A Server Function — which is what Next 16 calls these — rather than a route
 * handler, because there is nothing to address: it takes one string, answers
 * nothing, and its only caller is a component. A `route.ts` would mean an
 * address, a method, a schema and a fetch for a write that has no reader.
 *
 * **It reads who is asking from the session and never from its argument.** The
 * only parameter is the stamp of the batch being forgotten; a member id in the
 * signature would be a member id a browser could choose, and clearing somebody
 * else's toast is a small thing to be able to do to a stranger but it is not
 * nothing. The stamp is safe to accept because it can only ever narrow what is
 * cleared, and the row it names is the caller's own.
 *
 * Answers nothing at all, on purpose. The host has already drawn the toasts by
 * the time it calls this; there is no outcome it would do anything with, and a
 * failure here shows one toast a second time rather than losing anything.
 */
export async function clearXpFlash(at: string): Promise<void> {
  if (typeof at !== "string" || at.length === 0) return;
  const memberId = await currentMemberId();
  if (memberId === null) return;
  await clearXpFlashFor(memberId, at);
}
