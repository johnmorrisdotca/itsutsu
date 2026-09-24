"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { TAP_HEIGHT } from "@/components/ui/ui.constants";
import { fileReportAsTicket, markReport } from "@/lib/reports/reports.actions";
import { REPORT_MOVES, REPORT_STATUSES } from "@/lib/reports/reports.constants";
import type { ReportChanged, ReportStatus } from "@/lib/sumilabu/reportsClient.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

const BUTTON = `rounded-full border border-rule-strong/70 px-3 text-xs hover:bg-rule/40 disabled:opacity-50 ${TAP_HEIGHT}`;

/**
 * What the operator can do with one report: the moves the contract allows from
 * where it stands, and filing it as a ticket while it is still open. The list
 * is read again after each, so the row says where it now stands.
 */
export function ReportActions({ id, status }: { id: string; status: ReportStatus }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [pending, start] = useTransition();
  const [problem, setProblem] = useState<string | null>(null);

  function act(run: () => Promise<ReportChanged>) {
    setProblem(null);
    start(async () => {
      const outcome = await run();
      if (outcome.ok) router.refresh();
      else setProblem(outcome.problem);
    });
  }

  const moves = REPORT_MOVES[status];
  const fileable = status === REPORT_STATUSES.new || status === REPORT_STATUSES.read;
  if (moves.length === 0 && !fileable) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="report-actions" {...readyMark(hydrated)}>
      {moves.includes(REPORT_STATUSES.read) ? (
        <button type="button" className={BUTTON} disabled={pending} onClick={() => act(() => markReport(id, status, "read"))} data-testid="report-mark-read">
          Mark read
        </button>
      ) : null}
      {fileable ? (
        <button type="button" className={BUTTON} disabled={pending} onClick={() => act(() => fileReportAsTicket(id))} data-testid="report-file">
          File as a ticket
        </button>
      ) : null}
      {moves.includes(REPORT_STATUSES.closed) ? (
        <button type="button" className={BUTTON} disabled={pending} onClick={() => act(() => markReport(id, status, "closed"))} data-testid="report-close-it">
          Close
        </button>
      ) : null}
      {problem ? (
        <span role="alert" className="text-xs text-shu">
          {problem}
        </span>
      ) : null}
    </div>
  );
}
