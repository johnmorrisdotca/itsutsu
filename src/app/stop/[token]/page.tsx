import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { CONTACT_ADDRESS } from "@/lib/mail/mail.constants";
import { MAIL_STOP_KINDS, STOP_API_PATH, verifyStopToken } from "@/lib/mail/mailStop";
import { stopStateOf } from "@/lib/mail/mailStopWrite";

export const metadata = { title: "Stop emails", robots: { index: false } };

/**
 * WHERE AN EMAIL'S "HOW TO STOP GETTING IT" LEADS. No sign-in: the token in
 * the address says whose emails these are and which kind the link came with
 * (`mailStop.ts`), and the gate lets it through on that alone.
 *
 * Opening it changes nothing — a mail scanner fetching the link must not stop
 * anybody's email — so it says what they get now and offers one press for
 * each answer: stop this kind, stop all of it, or, once stopped, turn it back
 * on. The presses are plain forms posting to `/api/mail/stop`, which works
 * with no script at all, and come back here saying what was done.
 *
 * It names nobody. A link forwarded to somebody else shows them which emails
 * a member gets, and nothing about who.
 */
export default async function StopPage({ params, searchParams }: PageProps<"/stop/[token]">) {
  const { token } = await params;
  const { done } = await searchParams;
  const stop = await verifyStopToken(token);
  const state = stop === null ? null : await stopStateOf(stop.member, stop.mail);
  const said = stop === null || typeof done !== "string" ? null : doneWords(done, MAIL_STOP_KINDS[stop.mail].words);

  return (
    <Page>
      <SiteHeader />
      <PageTitle title="Stop emails" kanji="配信停止" lead="Choose which emails from Itsutsu you get. You do not need to sign in." />

      {stop === null || state === null ? (
        <p className="text-sm" data-testid="stop-unknown">
          This link does not stop anything: it may have been copied only in part. Write to {CONTACT_ADDRESS} and your email will be stopped by hand.
        </p>
      ) : (
        <section className="flex flex-col gap-5" data-testid="stop-page" data-kind={stop.mail} data-kind-on={state.kindOn} data-all-on={state.allOn}>
          {said === null ? null : (
            <p className="rounded-md border border-moss bg-moss/10 px-3 py-2 text-sm" role="status" data-testid="stop-done">
              {said}
            </p>
          )}

          <StopChoice
            token={token}
            what={stop.mail}
            on={state.kindOn}
            now={state.kindOn ? `You get ${MAIL_STOP_KINDS[stop.mail].words}.` : `You do not get ${MAIL_STOP_KINDS[stop.mail].words}.`}
            stopLabel={`Stop ${MAIL_STOP_KINDS[stop.mail].words}`}
            testId="stop-kind"
          />
          <StopChoice
            token={token}
            what="all"
            on={state.allOn}
            now={state.allOn ? "Itsutsu may email you about your games." : "Itsutsu sends you no email at all."}
            stopLabel="Stop all email from Itsutsu"
            testId="stop-all"
          />
          <p className="text-xs text-muted">
            Signed in, the switch for all email is also in Settings. Questions? Write to {CONTACT_ADDRESS}.
          </p>
        </section>
      )}
    </Page>
  );
}

/** One answer: what is true now, and the one press that changes it. */
function StopChoice({ token, what, on, now, stopLabel, testId }: { token: string; what: string; on: boolean; now: string; stopLabel: string; testId: string }) {
  return (
    <form method="post" action={`${STOP_API_PATH}?token=${encodeURIComponent(token)}`} className="flex flex-col gap-2" data-testid={testId} data-on={on}>
      <p className="text-sm">{now}</p>
      <input type="hidden" name="what" value={what} />
      <input type="hidden" name="on" value={on ? "0" : "1"} />
      <button type="submit" className={`${BUTTON_BASE} ${on ? BUTTON_STRONG : BUTTON_QUIET} self-start`} data-testid={`${testId}-press`}>
        {on ? stopLabel : "Turn them back on"}
      </button>
    </form>
  );
}

/** What the press just did, in a sentence; null for anything else in the address. */
function doneWords(done: string, kind: string): string | null {
  if (done === "all-off") return "Done: Itsutsu will not email you again.";
  if (done === "all-on") return "Done: Itsutsu may email you about your games again.";
  if (done.endsWith("-off")) return `Done: no more ${kind}.`;
  if (done.endsWith("-on")) return `Done: you will get ${kind} again.`;
  return null;
}
