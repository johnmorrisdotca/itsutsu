"use client";

import { useState } from "react";
import useSWR from "swr";

import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Button } from "@/components/ui/Controls";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import type { MemberSummary } from "@/lib/auth/members";

const json = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("not the operator");
  return response.json();
};

/** A day, written the same on the server and in the browser. */
function day(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * The members, and what the operator may do about one.
 *
 * Shutting an account stops it on its next request and revokes the invite it
 * came in by. Nothing is deleted: the games they played are the other
 * player's games too, and a rating is a fact about both of them.
 */
export function AdminMembers() {
  const { data, mutate } = useSWR<{ items: MemberSummary[] }>("/api/members", json);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function change(body: Record<string, unknown>, email: string) {
    setBusy(email);
    setError(null);
    const response = await fetch("/api/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(null);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "That did not go through.");
      return;
    }
    await mutate();
  }

  const members = data?.items ?? [];

  return (
    <section className="flex flex-col gap-3" data-testid="admin-members">
      <h2 className="flex items-baseline gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        Members <span className="font-mincho text-[0.8rem] font-normal tracking-normal">会員</span>
        <span className="font-normal tracking-normal">{members.length}</span>
      </h2>
      <p className="text-xs text-muted">
        Shutting an account ends its session on the next request and revokes the invite it came in by. The games and the
        rating stay: the other player played those games too.
      </p>
      {error !== null ? <p className="text-xs text-shu">{error}</p> : null}
      <ul className="flex flex-col gap-1.5">
        {members.map((member) => (
          <li
            key={member.email}
            className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm ${
              member.bannedAt === null ? "border-rule" : "border-shu/40 bg-shu-soft"
            }`}
            data-testid="admin-member"
            data-email={member.email}
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">
                {member.name.trim() === "" ? <span className="text-muted">No name yet</span> : member.name}
                {member.bannedAt === null ? null : (
                  <span className="ml-2 rounded-full border border-shu/40 px-2 py-0.5 text-[0.65rem] font-semibold text-shu">
                    Shut 停止
                  </span>
                )}
              </span>
              <span className="truncate text-xs text-muted">
                {member.email} · joined {day(member.createdAt)} · seen {day(member.lastSeenAt)}
                {member.bannedNote === "" ? "" : ` · ${member.bannedNote}`}
              </span>
            </span>
            {member.name.trim() === "" ? null : (
              <ConfirmButton
                label="Take the name off"
                question={`Take ${member.name.trim()}'s name off? They keep the account, the games and the rating; only the name goes, and they are asked for a new one.`}
                confirm="Take it off"
                onConfirm={() => void change({ email: member.email, name: "" }, member.email)}
                disabled={busy === member.email}
                testId="take-name-off"
              />
            )}
            {/*
              Opening an account again asks nothing: it undoes something and
              takes nothing away. Shutting one does both, so it asks.
            */}
            {member.bannedAt === null ? (
              <ConfirmButton
                label="Shut the account"
                question={`Shut ${member.name.trim() || member.email}'s account? It stops working on their next request and the invite they came in by is revoked. Their games and their rating stay exactly as they are.`}
                confirm="Shut it"
                onConfirm={() => void change({ email: member.email, banned: true }, member.email)}
                disabled={busy === member.email}
                strong
                testId="ban-member"
              />
            ) : (
              <Button
                onClick={() => void change({ email: member.email, banned: false }, member.email)}
                disabled={busy === member.email}
                data-testid="ban-member"
              >
                Open it again
              </Button>
            )}
          </li>
        ))}
      </ul>
      {members.length === 0 ? <p className={`${PANEL_CLASS} text-sm text-muted`}>Nobody has joined yet.</p> : null}
    </section>
  );
}
