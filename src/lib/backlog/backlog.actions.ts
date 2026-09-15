"use server";

import { currentAdmin } from "@/lib/auth/requireAdmin";

import { CLAIMED_BY_MAX } from "./backlog.constants";
import { addItem, changeItem } from "./backlogStore";
import type { BacklogChange, BacklogDraft, BoardActionOutcome } from "./backlog.types";

/**
 * The board's two writes from a page: filing a request, and changing one.
 *
 * Server Functions, as `xpFlash.actions.ts` is, rather than routes. The board
 * lives on Sumilabu behind a token only the server holds, so a browser cannot
 * call it, and there is no longer an address of ours in between: the
 * `/api/backlog` routes went when the board token that was their other caller
 * did. A route kept for the page alone would be an address, a method and a
 * schema for writes with no other reader.
 *
 * WHO IS ASKING COMES FROM THE SESSION, never from an argument. Anybody but
 * the operator is answered as a stranger is, and nothing reaches Sumilabu for
 * them. The operator's name is the actor every move claims under, the same
 * name the route used to write.
 */

const NOT_YOURS: BoardActionOutcome = { ok: false, problem: "No such thing." };

async function operatorName(): Promise<string | null> {
  const me = await currentAdmin();
  if (me === null) return null;
  return (me.name ?? me.email ?? "operator").trim().slice(0, CLAIMED_BY_MAX) || "operator";
}

export async function addBacklogItem(draft: BacklogDraft): Promise<BoardActionOutcome> {
  const actor = await operatorName();
  if (actor === null) return NOT_YOURS;
  return addItem(draft, actor);
}

export async function changeBacklogItem(id: string, change: BacklogChange): Promise<BoardActionOutcome> {
  const actor = await operatorName();
  if (actor === null) return NOT_YOURS;
  return changeItem(id, change, actor);
}
