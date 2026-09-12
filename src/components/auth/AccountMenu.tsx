"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

export type Who = { signedIn: boolean; admin: boolean; email: string | null; name: string | null; picture: string | null; member: boolean };

const fetcher = async (url: string): Promise<Who | null> => {
  const response = await fetch(url);
  return response.ok ? response.json() : null;
};

/**
 * Who is signed in, in the header. A stranger sees the way in; a member sees
 * their name — the Google picture when there is one — and the way out. An
 * invite-only visitor has no name to show, so they see only the way out.
 */
export function AccountMenu({ initial }: { initial: Who }) {
  const router = useRouter();
  // The server already knows who is here; the first paint uses that, so nothing flashes in.
  const { data, mutate } = useSWR("/api/session", fetcher, { fallbackData: initial });
  const say = useSpeaker();
  /*
   * Read here rather than at the element, because there are early returns
   * below it and a hook may not sit after one. Signing out is a button, so
   * a press before React attaches does nothing; the mark is what a spec
   * waits on instead of guessing.
   */
  const hydrated = useHydrated();

  if (data === undefined) return null;
  if (data === null || !data.signedIn) {
    return (
      <Link href="/join" className="whitespace-nowrap font-medium hover:underline underline-offset-4" data-testid="sign-in">
        {say.say("account.signIn")}
      </Link>
    );
  }

  async function signOut() {
    await fetch("/api/session", { method: "DELETE" });
    await mutate();
    router.push("/");
    router.refresh();
  }

  const label = data.name || data.email || "Guest";
  return (
    <span className="flex items-center gap-2 whitespace-nowrap" data-testid="account-menu" {...readyMark(hydrated)}>
      {data.picture ? (
        // eslint-disable-next-line @next/next/no-img-element -- a Google avatar URL, not ours to optimise
        <img src={data.picture} alt="" className="size-5 rounded-full" referrerPolicy="no-referrer" />
      ) : null}
      {data.member || data.admin ? (
        <Link href="/me" className="max-w-32 truncate text-ink-soft underline-offset-4 hover:underline" title={data.email ?? undefined} data-testid="me-link">
          {label}
        </Link>
      ) : null}
      <button
        type="button"
        onClick={signOut}
        className="text-muted underline-offset-4 hover:underline"
        data-testid="sign-out"
      >
        {say.say("account.signOut")}
      </button>
    </span>
  );
}
