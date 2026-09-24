import Link from "next/link";

import { LocalTime } from "@/components/ui/LocalTime";
import { TONE_CLASS } from "@/components/ui/ui.constants";
import { REPORT_STATUS_LABEL } from "@/lib/reports/reports.constants";
import { listReports } from "@/lib/sumilabu/reportsClient";
import type { Report } from "@/lib/sumilabu/reportsClient.types";
import { sumilabuTarget } from "@/lib/sumilabu/sumilabuProject";

import { ReportActions } from "./ReportActions";

type Read = { ok: true; reports: Report[] } | { ok: false; problem: string };

/** The reports, or why they could not be had: an unreadable list is never an empty one. */
async function readReports(): Promise<Read> {
  try {
    return { ok: true, reports: await listReports(sumilabuTarget("reports")) };
  } catch (error) {
    return { ok: false, problem: (error as Error).message };
  }
}

/**
 * What members have reported, newest first — the operator's half of "Report a
 * problem" (John, 2026-09-23: "And an equivalent Admin page to see them?").
 *
 * Read from Sumilabu on each visit to the tab and on no other request. Each
 * report says what was written, on which page, at which version and by whom
 * when they were signed in; the operator can mark it read, close it, or file
 * it as a ticket on this site's board, which links the two on Sumilabu.
 *
 * Nobody having reported anything is shown as the list's shape with nothing in
 * it, not hidden: an empty table is data.
 */
export async function AdminReports() {
  const read = await readReports();
  return (
    <section className="flex flex-col gap-4" data-testid="admin-reports">
      <h2 className="flex items-baseline gap-2 text-lg font-semibold">
        Reports <span className="font-mincho text-sm font-normal opacity-70">報告</span>
      </h2>
      {!read.ok ? (
        <p className={`rounded-xl border px-3 py-2 text-sm ${TONE_CLASS.alarm}`} role="alert" data-testid="reports-unreadable">
          The reports could not be read from Sumilabu just now, so none are shown. {read.problem}
        </p>
      ) : read.reports.length === 0 ? (
        <p className="text-sm text-muted" data-testid="reports-empty">
          Nobody has reported a problem yet. Reports sent from the “Report a problem” link at the foot of every page arrive here.
        </p>
      ) : (
        <ol className="flex flex-col divide-y divide-rule" data-testid="reports-list">
          {read.reports.map((report) => (
            <li key={report.id} className="flex flex-col gap-2 py-3" data-testid="report-row" data-status={report.status}>
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted">
                <span className="font-semibold text-ink-soft">{REPORT_STATUS_LABEL[report.status]}</span>
                <LocalTime at={report.createdAt} />
                <Link href={report.path} className="font-mono underline underline-offset-4">
                  {report.path}
                </Link>
                {report.appVersion ? <span className="font-mono">{report.appVersion}</span> : null}
                <span>{report.reporterName ?? "A visitor, not signed in"}</span>
              </p>
              <p className="whitespace-pre-wrap break-words text-sm">{report.body}</p>
              {report.hasImage ? (
                // Drawn through our own route, which alone holds the token that reads it; opens full size on a press.
                <a href={`/api/admin/reports/${encodeURIComponent(report.id)}/image`} target="_blank" rel="noreferrer" className="self-start" data-testid="report-shot">
                  {/* eslint-disable-next-line @next/next/no-img-element -- a private image behind an admin route, never optimised or cached */}
                  <img
                    src={`/api/admin/reports/${encodeURIComponent(report.id)}/image`}
                    alt="The screenshot sent with this report"
                    loading="lazy"
                    className="max-h-48 w-auto rounded-lg border border-rule"
                  />
                </a>
              ) : null}
              <ReportActions id={report.id} status={report.status} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
