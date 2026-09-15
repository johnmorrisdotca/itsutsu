"use client";

import QRCode from "qrcode";
import { useState, type FormEvent } from "react";

import { BUTTON_BASE, BUTTON_QUIET, INPUT_CLASS, PANEL_CLASS } from "@/components/ui/ui.constants";
import type { InviteFriendsProps, InviteReply } from "./inviteFriends.types";

/**
 * A link that lets one friend in. The member asks for it, gets a one-use
 * code wrapped in the join address, and sends it however they like — the
 * QR is for a phone across the table.
 *
 * Or the site emails it, where the site can send email: one click, one
 * address, one email, and a fresh code for each, so a code in somebody's inbox
 * is never also the one on the screen. When the email is refused — the day's
 * or the month's allowance used, or one person's — the reason is shown and the
 * link is shown with it, so the member can still send it themselves.
 */
export function InviteFriends({ canEmail }: InviteFriendsProps) {
  const [link, setLink] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  async function invite(sendTo?: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    const response = await fetch(
      "/api/invites/mine",
      sendTo === undefined
        ? { method: "POST" }
        : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sendTo }) },
    );
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "That invitation could not be made.");
      setBusy(false);
      return;
    }
    const reply = (await response.json()) as InviteReply;
    if (sendTo !== undefined && reply.emailed === true) {
      setNotice(`Sent to ${sendTo}. The invitation in it lets one person in and is good for a month.`);
      setAddress("");
      setBusy(false);
      return;
    }
    const url = `${window.location.origin}/join?code=${encodeURIComponent(reply.code)}`;
    setLink(url);
    setCopied(false);
    setQr(await QRCode.toDataURL(url, { width: 240, margin: 1 }));
    if (sendTo !== undefined) {
      setNotice(`${reply.notice ?? "The email was not sent."} The link below works: send it yourself.`);
    }
    setBusy(false);
  }

  function emailIt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const to = address.trim();
    if (to !== "") void invite(to);
  }

  async function copy() {
    if (link === null) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="invite-friends">
      <h2 className="flex items-baseline gap-2 font-semibold">
        Invite a friend <span className="font-mincho text-xs font-normal opacity-70">招待</span>
      </h2>
      <p className="text-sm text-muted">
        A link that lets one person in, good for a month. Send it any way you like
        {canEmail ? ", or have the site email it to them" : ""}; once they are in, challenge them from the players
        page.
      </p>
      {link === null ? (
        <span>
          <button type="button" onClick={() => void invite()} disabled={busy} className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3 py-1.5 text-sm`}>
            Make an invitation
          </button>
        </span>
      ) : (
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <input readOnly value={link} className={`${INPUT_CLASS} font-mono text-xs`} onFocus={(e) => e.currentTarget.select()} />
            <span className="flex gap-2">
              <button type="button" onClick={copy} className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3 py-1 text-xs`}>
                {copied ? "Copied" : "Copy link"}
              </button>
              <button type="button" onClick={() => void invite()} disabled={busy} className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3 py-1 text-xs`}>
                Another
              </button>
            </span>
          </div>
          {qr !== null ? (
            // eslint-disable-next-line @next/next/no-img-element -- a data URL drawn here
            <img src={qr} alt="QR code for the invitation" className="size-32 rounded-md border border-rule bg-ivory p-1" />
          ) : null}
        </div>
      )}
      {canEmail ? (
        <form onSubmit={emailIt} className="flex flex-wrap items-center gap-2" data-testid="invite-by-email">
          <label htmlFor="invite-email" className="sr-only">
            Their email address
          </label>
          <input
            id="invite-email"
            type="email"
            required
            maxLength={254}
            autoComplete="off"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="their email address"
            className={`${INPUT_CLASS} min-w-0 flex-1 text-sm`}
          />
          <button type="submit" disabled={busy} className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3 py-1.5 text-sm`}>
            Email an invitation
          </button>
        </form>
      ) : null}
      {notice !== null ? <p className="text-xs text-ink-soft" role="status">{notice}</p> : null}
      {error !== null ? <p className="text-xs text-shu">{error}</p> : null}
    </section>
  );
}
