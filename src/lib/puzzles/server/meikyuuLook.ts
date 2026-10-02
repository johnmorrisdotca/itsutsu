import "server-only";

import { storedPreferencesFor } from "@/lib/preferences/memberPreferences";
import { cleanPreferences } from "@/lib/preferences/preferences";
import type { LookChoice } from "@/lib/puzzles/meikyuu/look";

/**
 * The colours the signed-in member chose for their Meikyuu boards, and only the ones
 * they chose: a silence is not the default look, so a device's own choice is not
 * overruled by an account that never said (`meikyuuLookStore.ts`). Nothing for
 * somebody not signed in. No query of its own: the column rides the member row the
 * page already read.
 */
export async function meikyuuLookFor(): Promise<Partial<LookChoice>> {
  const kept = cleanPreferences(await storedPreferencesFor());
  const out: Partial<LookChoice> = {};
  if (kept.meikyuuFrame !== undefined) out.frame = kept.meikyuuFrame;
  if (kept.meikyuuPaper !== undefined) out.paper = kept.meikyuuPaper;
  if (kept.meikyuuInk !== undefined) out.ink = kept.meikyuuInk;
  return out;
}
