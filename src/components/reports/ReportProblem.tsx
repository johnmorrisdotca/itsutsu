"use client";

import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { LocalTime } from "@/components/ui/LocalTime";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, INPUT_CLASS, TAP_HEIGHT, TONE_CLASS } from "@/components/ui/ui.constants";
import { newReporterRef } from "@/lib/reports/reportDraft";
import { prepareScreenshot, type PreparedScreenshot } from "@/lib/reports/reportScreenshot";
import { reportingOpen, submitReport } from "@/lib/reports/reports.actions";
import { REPORT_IMAGE_TYPES, REPORT_LIMITS, REPORTER_REF_KEY } from "@/lib/reports/reports.constants";
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
 * is on, and the window says so, with the date, before anything is sent (John,
 * 2026-09-24: both sites' windows "should show the Date of the report"). The
 * buttons are the site's own, `BUTTON_BASE` with `BUTTON_QUIET` or
 * `BUTTON_STRONG`, like every other window here. A signed-in reader's name on this site goes too; a stranger's
 * nothing. The browser is told apart by a random id it keeps, never by
 * anything that is a person.
 */
export function ReportProblem({ version }: { version: string }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const dialog = useRef<HTMLDialogElement>(null);
  const [phase, setPhase] = useState<Phase>("checking");
  const [text, setText] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  // When the window was opened: the date the report will carry, shown before it is sent.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  // A screenshot to go with it, picked or pasted, already made small enough to send.
  const [shot, setShot] = useState<PreparedScreenshot | null>(null);
  const [shotProblem, setShotProblem] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  async function attach(file: Blob) {
    setShotProblem(null);
    const prepared = await prepareScreenshot(file);
    if ("problem" in prepared) {
      setShotProblem(prepared.problem);
      return;
    }
    if (shot) URL.revokeObjectURL(shot.preview);
    setShot(prepared);
  }

  function detach() {
    if (shot) URL.revokeObjectURL(shot.preview);
    setShot(null);
    setShotProblem(null);
  }

  async function open() {
    setProblem(null);
    setOpenedAt(new Date().toISOString());
    dialog.current?.showModal();
    // Half-written words are kept across a close; anything else asks again.
    if (phase === "writing") return;
    setPhase("checking");
    setPhase((await reportingOpen()) ? "writing" : "paused");
  }

  async function send() {
    setPhase("sending");
    setProblem(null);
    const sent = await submitReport({ body: text, path: pathname, reporterRef: reporterRef(), image: shot?.base64 ?? null });
    if (sent.ok) {
      setText("");
      detach();
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
      {/* A word in the colophon's row, and still a fingertip tall on a phone: see `TAP_HEIGHT`. */}
      <button
        type="button"
        onClick={open}
        className={`inline-flex items-center underline-offset-4 hover:underline ${TAP_HEIGHT}`}
        data-testid="report-problem"
        {...readyMark(hydrated)}
      >
        Report a problem
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="report-problem-title"
        className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-2xl border border-rule-strong/70 bg-paper p-0 text-ink shadow-xl backdrop:bg-ink/30"
        data-testid="report-dialog"
        data-phase={phase}
      >
        <header className="border-b border-rule bg-ivory/70 px-5 pt-4 pb-3">
          <h2 id="report-problem-title" className="text-lg font-semibold">
            Report a problem <span className="font-mincho text-sm font-normal opacity-70">不具合の報告</span>
          </h2>
          <p className="mt-1 text-sm text-muted">
            Tell us what went wrong and what you were doing. With it we keep the page you were on, the version, the date
            and a screenshot if you add one, and nothing else.
          </p>
        </header>

        <div className="flex flex-col gap-3 px-5 pt-4 pb-5">
          {phase === "checking" ? <p className="text-sm text-muted">One moment…</p> : null}

          {phase === "paused" ? (
            <p className="text-sm text-muted" data-testid="report-paused">
              Reporting is paused for a moment. Please try again a little later.
            </p>
          ) : null}

          {phase === "sent" ? (
            <p className={`rounded-xl border px-3 py-2 text-sm ${TONE_CLASS.good}`} data-testid="report-sent">
              Thank you. It has reached us, with the page you were on.
            </p>
          ) : null}

          {phase === "writing" || phase === "sending" ? (
            <form
              id="report-form"
              className="flex flex-col gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
            >
              <label htmlFor="report-body" className="text-sm font-medium">
                What happened?
              </label>
              <textarea
                id="report-body"
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={REPORT_LIMITS.bodyMax}
                rows={5}
                placeholder="The move I made went on the wrong point, on a phone, after I pressed Undo."
                className={`${INPUT_CLASS} h-auto`}
                data-testid="report-body"
                autoFocus
                onPaste={(event) => {
                  // A picture pasted into the box is the screenshot; pasted words stay words.
                  const file = Array.from(event.clipboardData.files).find((one) => one.type.startsWith("image/"));
                  if (!file) return;
                  event.preventDefault();
                  void attach(file);
                }}
              />
              <div className="flex flex-wrap items-center gap-3">
                {shot ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element -- a picture made in this browser, not a page asset */}
                    <img src={shot.preview} alt="The screenshot that will go with the report" className="h-16 w-auto rounded-md border border-rule" data-testid="report-shot-preview" />
                    <button type="button" onClick={detach} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="report-shot-remove">
                      Remove the screenshot
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => picker.current?.click()} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="report-shot-add">
                      Add a screenshot
                    </button>
                    <span className="text-xs text-muted">or paste one into the box</span>
                  </>
                )}
                <input
                  ref={picker}
                  type="file"
                  accept={REPORT_IMAGE_TYPES.join(",")}
                  className="hidden"
                  data-testid="report-shot-file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void attach(file);
                  }}
                />
              </div>
              {shotProblem ? (
                <p role="alert" className="text-sm text-shu" data-testid="report-shot-problem">
                  {shotProblem}
                </p>
              ) : null}
              {problem ? (
                <p role="alert" className="text-sm text-shu" data-testid="report-problem-text">
                  {problem}
                </p>
              ) : null}
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs text-muted" data-testid="report-carries">
                <dt>Page</dt>
                <dd className="min-w-0 truncate font-mono text-ink-soft" data-testid="report-page">
                  {pathname}
                </dd>
                <dt>Version</dt>
                <dd className="font-mono text-ink-soft">{version}</dd>
                {shot ? (
                  <>
                    <dt>Screenshot</dt>
                    <dd className="text-ink-soft" data-testid="report-shot-size">
                      {Math.max(1, Math.round(shot.bytes / 1024))} KB
                    </dd>
                  </>
                ) : null}
                <dt>Date</dt>
                <dd className="text-ink-soft" data-testid="report-date">
                  {openedAt ? <LocalTime at={openedAt} style="dateTime" /> : null}
                </dd>
              </dl>
            </form>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
              data-testid="report-close"
            >
              Close
            </button>
            {phase === "writing" || phase === "sending" ? (
              <button
                type="submit"
                form="report-form"
                disabled={phase === "sending" || length < REPORT_LIMITS.bodyMin}
                className={`${BUTTON_BASE} ${BUTTON_STRONG}`}
                data-testid="report-send"
              >
                {phase === "sending" ? "Sending…" : "Send it"}
              </button>
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
