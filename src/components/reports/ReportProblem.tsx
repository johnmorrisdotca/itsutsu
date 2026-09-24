"use client";

import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { INPUT_CLASS, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { newReporterRef } from "@/lib/reports/reportDraft";
import { reportingOpen, submitReport } from "@/lib/reports/reports.actions";
import { REPORT_LIMITS, REPORTER_REF_KEY } from "@/lib/reports/reports.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

type Phase = "checking" | "paused" | "writing" | "sending" | "sent";

/* When the browser will not keep one, an id for as long as this page lives. */
let pageRef: string | null = null;

/** This browser's opaque reporter id, kept where it may be kept and made where it may not. */
function reporterRef(): string {
  try {
    const kept = window.localStorage.getItem(REPORTER_REF_KEY);
    if (kept) return kept;
    const made = newReporterRef();
    window.localStorage.setItem(REPORTER_REF_KEY, made);
    return made;
  } catch {
    pageRef ??= newReporterRef();
    return pageRef;
  }
}

/**
 * "Report a problem", at the foot of every page, for anybody who can read it.
 *
 * John, 2026-09-23: "Is there a Report a Problem page for Site Users? And an
 * equivalent Admin page to see them?" A window rather than a page, so the page
 * the reader was on is the page reported, and they are still on it after.
 *
 * It asks whether Sumilabu can take a report once, when it opens, and only
 * then offers somewhere to type: a service that is down gets a calm "paused"
 * and nothing to write into, rather than words typed and then lost. A send
 * that fails after that keeps every word in the box and offers to try again;
 * nothing is kept anywhere else (Sumilabu's reports contract).
 *
 * The page goes with it, without its query string, and the version the site
 * is on. A signed-in reader's name on this site goes too; a stranger's
 * nothing. The browser is told apart by a random id it keeps, never by
 * anything that is a person.
 */
export function ReportProblem() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const dialog = useRef<HTMLDialogElement>(null);
  const [phase, setPhase] = useState<Phase>("checking");
  const [text, setText] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  async function open() {
    setProblem(null);
    dialog.current?.showModal();
    // Half-written words are kept across a close; anything else asks again.
    if (phase === "writing") return;
    setPhase("checking");
    setPhase((await reportingOpen()) ? "writing" : "paused");
  }

  async function send() {
    setPhase("sending");
    setProblem(null);
    const sent = await submitReport({ body: text, path: pathname, reporterRef: reporterRef() });
    if (sent.ok) {
      setText("");
      setPhase("sent");
      return;
    }
    setPhase("writing");
    if (sent.reason === "invalid") setProblem(sent.problem);
    else if (sent.reason === "rateLimited") setProblem(`That is a lot of reports at once. Try again in ${Math.ceil(sent.retryAfterSeconds / 60)} minutes; your words are still here.`);
    else setProblem("Could not send it just now. Your words are still here; try again in a moment.");
  }

  const length = text.trim().length;
  return (
    <>
      <button type="button" onClick={open} className="underline-offset-4 hover:underline" data-testid="report-problem" {...readyMark(hydrated)}>
        Report a problem
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="report-problem-title"
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-rule-strong/70 bg-paper p-5 text-ink shadow-xl backdrop:bg-ink/30"
        data-testid="report-dialog"
        data-phase={phase}
      >
        <h2 id="report-problem-title" className="text-lg font-semibold">
          Report a problem <span className="font-mincho text-sm font-normal opacity-70">不具合の報告</span>
        </h2>

        {phase === "checking" ? <p className="mt-3 text-sm text-muted">One moment…</p> : null}

        {phase === "paused" ? (
          <p className="mt-3 text-sm text-muted" data-testid="report-paused">
            Reporting is paused for a moment. Please try again a little later.
          </p>
        ) : null}

        {phase === "sent" ? (
          <p className="mt-3 text-sm" data-testid="report-sent">
            Thank you. It has reached us, with the page you were on.
          </p>
        ) : null}

        {phase === "writing" || phase === "sending" ? (
          <form
            className="mt-3 flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <label htmlFor="report-body" className="text-sm text-muted">
              What went wrong? The page you are on goes with it.
            </label>
            <textarea
              id="report-body"
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={REPORT_LIMITS.bodyMax}
              rows={5}
              className={`${INPUT_CLASS} h-auto`}
              data-testid="report-body"
              autoFocus
            />
            {problem ? (
              <p role="alert" className="text-sm text-shu" data-testid="report-problem-text">
                {problem}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={phase === "sending" || length < REPORT_LIMITS.bodyMin}
              className={`self-end rounded-full bg-ink px-4 text-sm font-medium text-paper disabled:opacity-50 ${TAP_HEIGHT}`}
              data-testid="report-send"
            >
              {phase === "sending" ? "Sending…" : "Send"}
            </button>
          </form>
        ) : null}

        <form method="dialog" className="mt-3 flex justify-end">
          <button type="submit" className={`text-sm text-muted underline-offset-4 hover:underline ${TAP_HEIGHT}`} data-testid="report-close">
            Close
          </button>
        </form>
      </dialog>
    </>
  );
}
