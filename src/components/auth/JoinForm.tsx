"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
  BUTTON_BASE,
  BUTTON_QUIET,
  BUTTON_STRONG,
  INPUT_CLASS,
  PANEL_CLASS,
  TONE_CLASS,
} from "@/components/ui/ui.constants";
import { CODE_WORDS } from "@/lib/invite/inviteCode";

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
}: {
  next: string;
  googleReady: boolean;
  /** A Google account at the door that is not yet a member: one code makes it one. */
  pending: { name: string; email: string } | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"invite" | "admin">("invite");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
        <h1 className="font-mincho text-2xl font-bold">
          {pending !== null ? "ようこそ" : mode === "invite" ? "合言葉" : "管理"}
        </h1>
        <p className="text-sm text-muted">
          {pending !== null
            ? `Welcome, ${pending.name || pending.email}. One more thing: the ${CODE_WORDS} words you were given. After this, Google alone lets you in.`
            : mode === "invite"
              ? "Sign in with Google, or enter the words you were given."
              : "Sign in as the operator."}
        </p>
      </div>

      {googleReady && pending === null ? (
        <>
          <a
            href={`/api/auth/signin/google?callbackUrl=${encodeURIComponent(
              `/api/session/google?next=${next}`,
            )}`}
            className={`${BUTTON_BASE} ${BUTTON_STRONG} w-full py-2`}
            data-testid="google-signin"
          >
            Continue with Google
          </a>
          <p className="text-center text-xs text-muted">
            {mode === "invite" ? "or, with an invite code" : "or, with the operator token"}
          </p>
        </>
      ) : null}

      {mode === "invite" ? (
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
            data-testid="invite-code"
          />
          <span className="text-xs text-muted">
            Capitals, spaces or hyphens — any of them work.
          </span>
        </label>
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

      <div className="flex items-center justify-between gap-3">
        <button
          type="submit"
          disabled={busy}
          className={`${BUTTON_BASE} ${googleReady && pending === null ? BUTTON_QUIET : BUTTON_STRONG}`}
          data-testid="join-submit"
        >
          {busy ? "Checking…" : "Enter"}
        </button>
        {pending === null ? (
          <button
            type="button"
            className="text-xs text-muted underline underline-offset-4"
            onClick={() => {
              setMode(mode === "invite" ? "admin" : "invite");
              setError(null);
            }}
            data-testid="toggle-mode"
          >
            {mode === "invite" ? "I'm the operator" : "I have an invite code"}
          </button>
        ) : (
          <Link href="/api/auth/signout" className="text-xs text-muted underline underline-offset-4">
            Not you? Use another account
          </Link>
        )}
      </div>
    </form>
  );
}
