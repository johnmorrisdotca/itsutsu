"use client";

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
 * A player types the three words they were given; the operator signs in with
 * their email and token. Both exchange what they typed for a signed cookie and
 * are never asked for it again.
 */
export function JoinForm({
  next,
  googleReady,
}: {
  next: string;
  googleReady: boolean;
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
          {mode === "invite" ? "合言葉" : "管理"}
        </h1>
        <p className="text-sm text-muted">
          {mode === "invite"
            ? `Enter the ${CODE_WORDS} words you were given.`
            : "Sign in as the operator."}
        </p>
      </div>

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

      {mode === "admin" && googleReady ? (
        <>
          <a
            href={`/api/auth/signin/google?callbackUrl=${encodeURIComponent(
              `/api/session/google?next=${next}`,
            )}`}
            className={`${BUTTON_BASE} ${BUTTON_QUIET} w-full`}
            data-testid="google-signin"
          >
            Continue with Google
          </a>
          <p className="text-center text-xs text-muted">
            or use the operator token
          </p>
        </>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <button
          type="submit"
          disabled={busy}
          className={`${BUTTON_BASE} ${BUTTON_STRONG}`}
          data-testid="join-submit"
        >
          {busy ? "Checking…" : "Enter"}
        </button>
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
      </div>
    </form>
  );
}
