import { titleWithKanji } from "@/components/games/pageTitles";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { currentSpeaker, speakerFor } from "@/lib/i18n/currentLocale";
import type { Speaker } from "@/lib/i18n/i18n";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import { SITE_NAME } from "@/lib/i18n/siteName";
import { CONTACT_ADDRESS } from "@/lib/mail/mail.constants";
import { STOP_API_PATH, verifyStopToken, type StopKind } from "@/lib/mail/mailStop";
import { stopStateOf } from "@/lib/mail/mailStopWrite";

export async function generateMetadata() {
  return { title: titleWithKanji(await currentSpeaker(), "auth.stop.title", "配信停止"), robots: { index: false } };
}

/** What each kind of email is called in a sentence, as a phrase: the reader's language says it, not the mail module. */
const KIND_WORDS: Readonly<Record<StopKind, PhraseKey>> = { "your-turn": "auth.stop.wordsYourTurn", "game-over": "auth.stop.wordsGameOver" };

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
  // The language of the email that led here: the member's own, which the token names. Nobody is signed in, so
  // without one the page answers as any page does (a language just chosen, the browser's own).
  const say = state === null ? await currentSpeaker() : await speakerFor(state.language);
  const words = stop === null ? "" : say.say(KIND_WORDS[stop.mail]);
  const said = stop === null || typeof done !== "string" ? null : doneWords(done, words, say);

  return (
    <Page>
      <SiteHeader />
      <div lang={say.tag} className="flex flex-col gap-6" data-testid="stop-language" data-locale={say.locale}>
        {/* The title is a node, so it is drawn as the member's language says it whatever the frame is in (a string would be paired by the frame's). */}
        <PageTitle title={<>{say.say("auth.stop.title")}</>} kanji={say.pairsWithKanji ? "配信停止" : ""} lead={say.say("auth.stop.lead", { site: SITE_NAME })} />

        {stop === null || state === null ? (
          <p className="text-sm" data-testid="stop-unknown">
            {say.say("auth.stop.unknown", { address: CONTACT_ADDRESS })}
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
              now={say.say(state.kindOn ? "auth.stop.youGet" : "auth.stop.youDoNotGet", { words })}
              stopLabel={say.say("auth.stop.stopKind", { words })}
              turnOn={say.say("auth.stop.turnOn")}
              testId="stop-kind"
            />
            <StopChoice
              token={token}
              what="all"
              on={state.allOn}
              now={say.say(state.allOn ? "auth.stop.allOn" : "auth.stop.allOff", { site: SITE_NAME })}
              stopLabel={say.say("auth.stop.stopAll", { site: SITE_NAME })}
              turnOn={say.say("auth.stop.turnOn")}
              testId="stop-all"
            />
            <p className="text-xs text-muted">
              {say.say("auth.stop.signedInNote", { address: CONTACT_ADDRESS })}
            </p>
          </section>
        )}
      </div>
    </Page>
  );
}

/** One answer: what is true now, and the one press that changes it. */
function StopChoice({ token, what, on, now, stopLabel, turnOn, testId }: { token: string; what: string; on: boolean; now: string; stopLabel: string; turnOn: string; testId: string }) {
  return (
    <form method="post" action={`${STOP_API_PATH}?token=${encodeURIComponent(token)}`} className="flex flex-col gap-2" data-testid={testId} data-on={on}>
      <p className="text-sm">{now}</p>
      <input type="hidden" name="what" value={what} />
      <input type="hidden" name="on" value={on ? "0" : "1"} />
      <button type="submit" className={`${BUTTON_BASE} ${on ? BUTTON_STRONG : BUTTON_QUIET} self-start`} data-testid={`${testId}-press`}>
        {on ? stopLabel : turnOn}
      </button>
    </form>
  );
}

/** What the press just did, in a sentence; null for anything else in the address. */
function doneWords(done: string, words: string, say: Speaker): string | null {
  if (done === "all-off") return say.say("auth.stop.doneAllOff", { site: SITE_NAME });
  if (done === "all-on") return say.say("auth.stop.doneAllOn", { site: SITE_NAME });
  if (done.endsWith("-off")) return say.say("auth.stop.doneOff", { words });
  if (done.endsWith("-on")) return say.say("auth.stop.doneOn", { words });
  return null;
}
