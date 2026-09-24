"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rateLimit";
import { currentMemberRow, currentSession } from "@/lib/auth/currentSession";
import { currentAdmin } from "@/lib/auth/requireAdmin";
import { fileReport, moveReport, reportsHealthy, sendReport } from "@/lib/sumilabu/reportsClient";
import type { ReportChanged, ReportSent, ReportStatus } from "@/lib/sumilabu/reportsClient.types";
import { sumilabuTarget } from "@/lib/sumilabu/sumilabuProject";
import type { SumilabuTarget } from "@/lib/sumilabu/sumilabuProject.types";
import { VERSION } from "@/lib/version";

import { REPORT_HEALTH_CACHE_MS, REPORT_LIMITS, REPORT_MOVES } from "./reports.constants";
import { cleanReportPath } from "./reportDraft";

/**
 * A member's "Report a problem", and the operator's handling of what arrives.
 *
 * Server Functions, as `backlog.actions.ts` is: the reports live on Sumilabu
 * behind a token only the server holds, so the browser asks here and this asks
 * there. They run under the page's own address, which is why a reader who is
 * not signed in can report from any page they can read, and the gate in
 * `src/proxy.ts` is untouched.
 *
 * Nothing is kept anywhere else when Sumilabu cannot take a report: the window
 * keeps the member's words and offers to try again (the contract's rule).
 */

/** No target — no token in this environment — reads as a paused service, never as an error page. */
function target(scope: "reports" | "board"): SumilabuTarget | null {
  try {
    return sumilabuTarget(scope);
  } catch {
    return null;
  }
}

/*
 * The last health answer and when it was had, for this server instance. One
 * call per thirty seconds however many windows open, and never on a timer:
 * it is asked only when somebody opens the window.
 */
let health: { ok: boolean; at: number } | null = null;

/** Whether the window may offer the form: asked once, when it opens. */
export async function reportingOpen(): Promise<boolean> {
  const now = Date.now();
  if (health !== null && now - health.at < REPORT_HEALTH_CACHE_MS) return health.ok;
  const reports = target("reports");
  const ok = reports !== null && (await reportsHealthy(reports));
  health = { ok, at: now };
  return ok;
}

async function callerAddress(): Promise<string> {
  const asked = await headers();
  return asked.get("x-forwarded-for")?.split(",")[0]?.trim() || asked.get("x-real-ip")?.trim() || "unknown";
}

/**
 * The name an admin reads beside a report: the member's name on this site, or
 * the operator's. Nothing for a reader who is not signed in, and never an
 * address — the contract's rule, since this is the one field that may name
 * somebody.
 */
async function reporterName(): Promise<string | null> {
  const session = await currentSession();
  if (session === null) return null;
  const row = await currentMemberRow();
  const name = (row?.name ?? (session.kind === "admin" ? "The operator" : null))?.trim();
  return name ? name.slice(0, REPORT_LIMITS.nameMax) : null;
}

export async function submitReport(asked: { body: string; path: string; reporterRef: string }): Promise<ReportSent> {
  const body = asked.body.trim();
  if (body.length < REPORT_LIMITS.bodyMin) return { ok: false, reason: "invalid", problem: "Say a little more about what went wrong." };
  if (body.length > REPORT_LIMITS.bodyMax) return { ok: false, reason: "invalid", problem: `Keep it under ${REPORT_LIMITS.bodyMax} characters.` };
  const reporterRef = asked.reporterRef.trim().slice(0, REPORT_LIMITS.refMax);
  if (reporterRef === "") return { ok: false, reason: "invalid", problem: "This browser could not be told apart; reload and try again." };

  // Our own function calls are paid for, whatever Sumilabu's limit says: five a
  // reader's address per ten minutes, the same as Sumilabu's per reporter.
  const limit = checkRateLimit(`report:${await callerAddress()}`, RATE_LIMITS.report);
  if (!limit.allowed) return { ok: false, reason: "rateLimited", retryAfterSeconds: limit.resetSeconds };

  const reports = target("reports");
  if (reports === null) return { ok: false, reason: "unreachable" };
  return sendReport(reports, {
    body,
    path: cleanReportPath(asked.path),
    appVersion: VERSION.slice(0, REPORT_LIMITS.versionMax),
    reporterRef,
    reporterName: await reporterName(),
  });
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
