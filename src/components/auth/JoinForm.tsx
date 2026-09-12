"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";

import {
  BUTTON_BASE,
  BUTTON_STRONG,
  INPUT_CLASS,
  PANEL_CLASS,
  TONE_CLASS,
} from "@/components/ui/ui.constants";
import { CODE_WORDS } from "@/lib/invite/inviteCode";
import type { RegistrationMode } from "@/lib/site/site.types";

/**
 * The door.
 *
 * Google first: one button, and a member is in. A player with no account
 * types the three words they were given instead; the operator may use an
 * email and token. Everything ends the same way — a signed cookie — and
 * nobody is asked twice.
 */
export function JoinForm({
  next,
  googleReady,
  pending,
  initialCode = "",
  operator = false,
  registration = "invite-only",
  notice = "",
}: {
  next: string;
  googleReady: boolean;
  /** A Google account at the door that is not yet a member: one code makes it one. */
  pending: { name: string; email: string } | null;
  /** A code carried in the address, from an invitation link. */
  initialCode?: string;
  /** The operator's own door, reached by address only: /join?operator=1. */
  operator?: boolean;
  /**
   * How the operator has set signing up. The door only says what it is; the
   * routes behind it are what enforce it. Defaulted to the strict mode so that
   * a caller who forgets to pass it describes the site as tighter than it is,
   * never looser.
   */
  registration?: RegistrationMode;
  /** A line the operator put on the door. Empty is the ordinary case. */
  notice?: string;
}) {
  const router = useRouter();
  const mode: "invite" | "admin" = operator ? "admin" : "invite";
  /*
   * Nobody new, and this visitor is nobody yet. Said plainly rather than by
   * offering a code field that cannot work — a door that takes an answer it
   * will refuse is worse than one that says it is shut. The operator's own door
   * is never affected: `operator=1` puts the form in admin mode above.
   */
  const shut = mode === "invite" && registration === "closed";
  const [code, setCode] = useState(initialCode);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // An invite code is the door for someone with no Google account. Someone
  // who has one sees only the button; the code stays out of the way until
  // they say they need it — or until a code arrived with the link.
  const [showInviteCode, setShowInviteCode] = useState(initialCode !== "");
  // Whether there is anything on the page for "Enter" to submit — the same
  // condition the invite-code field itself shows under, plus the operator's
  // door, which always has its own fields.
  const showSubmit =
    mode === "admin" || (!shut && (!googleReady || pending !== null || showInviteCode));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "invite"
            ? { kind: "invite", code }
            : { kind: "admin", email, token },
        ),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(
          response.status === 429
            ? "Too many attempts. Wait a minute and try again."
            : (body?.error ?? "That was not accepted."),
        );
        setBusy(false);
        return;
      }

      router.replace(next);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className={`${PANEL_CLASS} flex w-full max-w-md flex-col gap-4`}
    >
      <div className="flex flex-col gap-1">
        {/*
          The same precedence as the sentence below it, which is the operator's
          door first. Before signing up could be closed there were only three
          states and `pending` could not collide with the operator's door; now
          it can — /join?operator=1 in a browser Google knows — and the heading
          and the sentence must not answer that differently.
          締切 is the word a club uses when it has stopped taking names.
        */}
        <h1 className="font-mincho text-2xl font-bold">
          {mode === "admin" ? "管理" : shut ? "締切" : pending !== null ? "ようこそ" : "合言葉"}
        </h1>
        <p className="text-sm text-muted">
          {mode === "admin"
            ? "Sign in as the operator."
            : shut
              ? "Itsutsu is not taking new members just now. If you already have an account, sign in with Google and you are in as usual."
              : pending !== null
                ? registration === "open"
                  ? `Welcome, ${pending.name || pending.email}. Press Enter and you are in.`
                  : `Welcome, ${pending.name || pending.email}. One more thing: the ${CODE_WORDS} words you were given. After this, Google alone lets you in.`
                : registration === "open"
                  ? "Sign in with Google and you are in — no code needed."
                  : "Sign in with Google. No account? The words you were given will let you in instead."}
        </p>
      </div>

      {notice !== "" ? (
        <p
          className={`rounded-xl border px-3 py-2 text-sm ${TONE_CLASS.calm}`}
          data-testid="join-notice"
        >
          {notice}
        </p>
      ) : null}

      {googleReady && pending === null ? (
        <>
          <button
            type="button"
            // NextAuth starts sign-in from a POST with its CSRF token; a plain link only bounces back here.
            onClick={() => void signIn("google", { callbackUrl: `/api/session/google?next=${next}` })}
            className={`${BUTTON_BASE} ${BUTTON_STRONG} w-full py-2`}
            data-testid="google-signin"
            data-next={next}
          >
            Continue with Google
          </button>
          {mode === "invite" && !showInviteCode && !shut ? (
            <button
              type="button"
              onClick={() => setShowInviteCode(true)}
              className="text-center text-xs text-muted underline underline-offset-4"
              data-testid="show-invite-code"
            >
              No Google account? Use an invite code instead
            </button>
          ) : mode === "admin" ? (
            <p className="text-center text-xs text-muted">or, with the operator token</p>
          ) : null}
        </>
      ) : null}

      {mode === "invite" ? (
        !shut && (!googleReady || pending !== null || showInviteCode) && (
          <label className="flex flex-col gap-1">
            <span className="text-sm">Invite code</span>
            <input
              className={`${INPUT_CLASS} font-mono`}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="hoshi-kuma-nami"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus={showInviteCode}
              data-testid="invite-code"
            />
            <span className="text-xs text-muted">
              Capitals, spaces or hyphens — any of them work.
            </span>
          </label>
        )
      ) : (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-sm">Email</span>
            <input
              type="email"
              className={INPUT_CLASS}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              data-testid="admin-email"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm">Operator token</span>
            <input
              type="password"
              className={INPUT_CLASS}
              value={token}
              onChange={(event) => setToken(event.target.value)}
              autoComplete="current-password"
              data-testid="admin-token"
            />
          </label>
        </>
      )}

      {error !== null ? (
        <p
          className={`rounded-xl border px-3 py-2 text-sm ${TONE_CLASS.warn}`}
          role="alert"
          data-testid="join-error"
        >
          {error}
        </p>
      ) : null}

      {showSubmit ? (
        <div className="flex flex-col items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className={`${BUTTON_BASE} ${BUTTON_STRONG} w-full py-2`}
            data-testid="join-submit"
          >
            {busy ? "Checking…" : "Enter"}
          </button>
          {pending !== null ? (
            <Link href="/api/auth/signout" className="text-xs text-muted underline underline-offset-4">
              Not you? Use another account
            </Link>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
