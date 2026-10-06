"use server";

import { revalidatePath } from "next/cache";

import { currentAdmin } from "@/lib/auth/requireAdmin";
import { fileReport, moveReport } from "@/lib/sumilabu/reportsClient";
import type { ReportChanged, ReportStatus } from "@/lib/sumilabu/reportsClient.types";
import { sumilabuTarget } from "@/lib/sumilabu/sumilabuProject";
import type { SumilabuTarget } from "@/lib/sumilabu/sumilabuProject.types";

import { REPORT_MOVES } from "./reports.constants";

/**
 * The operator's handling of what members reported: marking a report read or closed, and filing it as a ticket.
 * English by decision, like the Admin page that calls it, and kept in a file of its own so that the words a
 * member reads (`reports.actions.ts`) are every one of them a phrase.
 */

/** No target — no token in this environment — reads as not connected, never as an error page. */
function target(scope: "reports" | "board"): SumilabuTarget | null {
  try {
    return sumilabuTarget(scope);
  } catch {
    return null;
  }
}

const NOT_YOURS: ReportChanged = { ok: false, problem: "No such thing." };

async function operatorName(): Promise<string | null> {
  const me = await currentAdmin();
  if (me === null) return null;
  return (me.name ?? me.email ?? "operator").trim() || "operator";
}

/** Read or closed, along the contract's table. Anybody but the operator is answered as a stranger is. */
export async function markReport(id: string, from: ReportStatus, to: "read" | "closed"): Promise<ReportChanged> {
  const actor = await operatorName();
  if (actor === null) return NOT_YOURS;
  if (!REPORT_MOVES[from].includes(to)) return { ok: false, problem: "That report cannot move there." };
  const reports = target("reports");
  if (reports === null) return { ok: false, problem: "Reports are not connected here." };
  const outcome = await moveReport(reports, id, to, actor);
  if (outcome.ok) revalidatePath("/admin");
  return outcome;
}

/** A ticket on this site's board, made from the report and linked to it. The board's token, not the reports'. */
export async function fileReportAsTicket(id: string): Promise<ReportChanged> {
  const actor = await operatorName();
  if (actor === null) return NOT_YOURS;
  const board = target("board");
  if (board === null) return { ok: false, problem: "The board is not connected here." };
  const outcome = await fileReport(board, id, actor);
  if (outcome.ok) revalidatePath("/admin");
  return outcome;
}
