import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { JoinForm } from "@/components/auth/JoinForm";
import { STAGE, versionStamps } from "@/lib/version";
import { BrandAvatar, BrandWordmark } from "@/components/layout/BrandMarks";
import { isAdminEmail } from "@/lib/auth/admin";
import { currentSession } from "@/lib/auth/currentSession";
import { authOptions, isGoogleAuthConfigured } from "@/lib/auth/google";
import { findMember } from "@/lib/auth/members";
import { safeDestination } from "@/lib/auth/redirect";

export const metadata = {
  title: "Join",
  robots: { index: false, follow: false },
};

/**
 * The door. Google is the front of it; an invite code is the side of it.
 *
 * Somebody already in is sent where they were going. Somebody Google knows
 * but we do not — a fresh account with no invite behind it — is asked for
 * the code, once; after that, Google alone lets them in.
 */
export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  const params = await searchParams;
  const stamps = versionStamps();
  const next = safeDestination(typeof params.next === "string" ? params.next : null);

  if ((await currentSession()) !== null) redirect(next);

  const google = await getServerSession(authOptions);
  const email = google?.user?.email ?? null;
  const pending =
    email !== null && !isAdminEmail(email) && (await findMember(email)) === null
      ? { name: google?.user?.name ?? "", email }
      : null;

  return (
    <div className="paper flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <header className="flex flex-col items-center gap-4">
        <BrandAvatar className="size-24" />
        <BrandWordmark className="h-8 w-auto" />
      </header>
      {typeof params.error === "string" ? (
        <p className="max-w-sm text-center text-sm text-shu" data-testid="join-error">
          Google sign-in did not complete. Try again, or use an invite code.
        </p>
      ) : null}
      <JoinForm
        next={next}
        googleReady={isGoogleAuthConfigured()}
        pending={pending}
        initialCode={typeof params.code === "string" ? params.code.slice(0, 80) : ""}
        operator={params.operator === "1"}
      />
      <p className="flex items-baseline gap-3 font-mono text-xs text-muted tabular-nums" data-testid="join-version">
        <span className="font-sans font-semibold text-ink-soft">{STAGE}</span>
        <span>{stamps.semver}</span>
        <span className="opacity-70">{stamps.roman}</span>
        <span className="font-mincho opacity-70">{stamps.kanji}</span>
      </p>
    </div>
  );
}
