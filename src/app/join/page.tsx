import { getServerSession } from "next-auth";
import Link from "@/components/ui/Link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AskForInvite } from "@/components/auth/AskForInvite";
import { JoinForm } from "@/components/auth/JoinForm";
import { stampInviteRequestForm } from "@/lib/auth/inviteRequestStamp";
import { LanguagePicker } from "@/components/layout/LanguagePicker";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { languageOptions } from "@/lib/i18n/dictionaries";
import { LANG_PARAM } from "@/lib/i18n/i18n.constants";
import { versionStamps } from "@/lib/version";
import { BrandAvatar, BrandWordmark } from "@/components/layout/BrandMarks";
import { isAdminEmail } from "@/lib/auth/admin";
import { currentSession } from "@/lib/auth/currentSession";
import { authOptions, isGoogleAuthConfigured } from "@/lib/auth/google";
import { findMember } from "@/lib/auth/members";
import { safeDestination } from "@/lib/auth/redirect";
import { fetchSiteSettings } from "@/lib/site/siteStore";

export async function generateMetadata() {
  return { title: (await currentSpeaker()).say("auth.join.title"), robots: { index: false, follow: false } };
}

/**
 * The door. Google is the front of it; an invite code is the side of it.
 *
 * Somebody already in is sent where they were going. Somebody Google knows
 * but we do not — a fresh account with no invite behind it — is asked for
 * the code, once; after that, Google alone lets them in.
 */
export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  const params = await searchParams;
  const say = await currentSpeaker();
  const stamps = versionStamps();
  const next = safeDestination(typeof params.next === "string" ? params.next : null);

  if ((await currentSession()) !== null) redirect(next);

  const google = await getServerSession(authOptions);
  const email = google?.user?.email ?? null;
  const pending =
    email !== null && !isAdminEmail(email) && (await findMember(email)) === null
      ? { name: google?.user?.name ?? "", email }
      : null;
  /*
   * What the operator has said about signing up, so the door can say it too.
   * The door only DESCRIBES this; the decision is made in `/api/session` and
   * `/api/session/google`, which is where a member is actually created. A page
   * that guessed at the rule separately would be a second copy of it.
   */
  const site = await fetchSiteSettings();

  return (
    <div className="paper flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <header className="flex flex-col items-center gap-4">
        <BrandAvatar className="size-24" />
        <BrandWordmark className="h-8 w-auto" />
      </header>
      {typeof params.error === "string" ? (
        <p className="max-w-sm text-center text-sm text-shu" data-testid="join-error" data-width-reason="a short notice centred on the doorstep, which has no page frame">
          {say.say("auth.join.googleFailed", { error: params.error })}
        </p>
      ) : null}
      <JoinForm
        next={next}
        googleReady={isGoogleAuthConfigured()}
        pending={pending}
        initialCode={typeof params.code === "string" ? params.code.slice(0, 80) : ""}
        operator={params.operator === "1"}
        registration={site.registration}
        notice={site.joinNotice}
      />
      {/*
        THE WAY TO ASK, for somebody who arrived knowing nobody. Only while the
        door is invite-only: open, nobody needs to ask; closed, the operator
        shut it on purpose. Offered to somebody Google has just signed in and
        who is being asked for a code as well — they are the likeliest to have
        none. See `AskForInvite` for how a person is told apart from a script.
      */}
      {site.registration === "invite-only" ? (
        <AskForInvite stamp={await stampInviteRequestForm()} open={params.ask === "1"} />
      ) : null}
      <p className="flex items-baseline gap-3 font-mono text-xs text-muted tabular-nums" data-testid="join-version">
        <span className="font-sans font-semibold text-ink-soft">{say.say("chrome.stage")}</span>
        <span>{stamps.semver}</span>
        <span className="opacity-70">{stamps.roman}</span>
        <span className="font-mincho opacity-70">{stamps.kanji}</span>
      </p>
      {/* The doorstep has no footer, so the two pages a stranger should read before asking are here. */}
      <span className="flex gap-3">
        <Link href="/privacy" className="text-xs text-muted underline underline-offset-4" data-testid="join-privacy">
          {say.say("nav.privacy")}
        </Link>
        <Link href="/terms" className="text-xs text-muted underline underline-offset-4" data-testid="join-terms">
          {say.say("auth.join.terms")}
        </Link>
      </span>
      {/* The doorstep has no footer either, so the picker is here: a visitor who is not reading English can choose the language before they sign in. */}
      <div className="text-xs text-muted" data-testid="join-language">
        <Suspense fallback={null}>
          <LanguagePicker options={languageOptions()} current={say.locale} param={LANG_PARAM} label={say.say("site.language")} />
        </Suspense>
      </div>
    </div>
  );
}
