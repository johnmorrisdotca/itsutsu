"use client";

import { Paired } from "@/components/i18n/Paired";
import { useState } from "react";
import useSWR from "swr";

import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Button, RowActions } from "@/components/ui/Controls";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import type { MemberSummary } from "@/lib/auth/memberRoster";
import { PlayerName } from "@/components/players/PlayerName";
import { MemberKindBadge } from "./MemberKindBadge";

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
  const { data, mutate } = useSWR<{ items: MemberSummary[]; total?: number; shown?: number }>(
    "/api/members",
    json,
  );
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
  /*
   * The number of members, not the number of rows on screen. The heading used
   * to print the length of the list it had been given, which is capped — so a
   * site with nine hundred members reported two hundred, in the one place
   * somebody goes to find out how many there are.
   */
  const total = data?.total ?? members.length;
  const capped = total > members.length;

  return (
    <section className="flex flex-col gap-3" data-testid="admin-members">
      <h2 className="flex items-baseline gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        <Paired en="Members" kanji="会員" kanjiClassName="text-[0.8rem] font-normal tracking-normal" />
        <span className="font-normal tracking-normal" data-testid="member-total">
          {total}
        </span>
      </h2>
      <p className="text-xs text-muted">
        {capped ? (
          <span data-testid="member-capped">
            The {members.length} seen most recently, of {total}.{" "}
          </span>
        ) : null}
        Shutting an account ends its session on the next request and revokes the invite it came in by. The games and the
        rating stay: the other player played those games too.
      </p>
      {error !== null ? <p className="text-xs text-shu">{error}</p> : null}
      <ul className="flex flex-col gap-1.5">
        {members.map((member) => {
          // A kept record has no address, and the operator's controls all act
          // on an account reached by one. Narrowed here so the three below are
          // talking about the same known address.
          const account = member.email;
          return (
          <li
            key={member.id}
            className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm ${
              member.bannedAt === null ? "border-rule" : "border-shu/40 bg-shu-soft"
            }`}
            data-testid="admin-member"
            data-email={member.email}
          >
            <span className="flex min-w-0 flex-1 flex-col">
              {/*
                A row is a row whatever is in it, and a badge is exactly the
                kind of thing that would make one taller than its neighbours.
                The name line keeps a badge's height whether or not one is
                drawn into it — the same construction RowActions uses for the
                controls, for the same reason.
              */}
              <span className="flex min-h-7 min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                <span className="truncate">
                  {member.name.trim() === "" ? (
                    <span className="text-muted">No name yet</span>
                  ) : (
                    <PlayerName name={member.name} fallback="" whole />
                  )}
                </span>
                {/* What they are, then what has been done to them. Somebody can be a shut operator. */}
                <MemberKindBadge kind={member.kind} />
                {member.bannedAt === null ? null : (
                  <span className="shrink-0 rounded-full border border-shu/40 px-2 py-0.5 text-[0.65rem] font-semibold text-shu">
                    Shut 停止
                  </span>
                )}
              </span>
              <span className="truncate text-xs text-muted">
                {member.email} · joined {day(member.createdAt)} · seen {day(member.lastSeenAt)}
                {member.bannedNote === "" ? "" : ` · ${member.bannedNote}`}
              </span>
            </span>
            <RowActions>
            {account === null || member.name.trim() === "" ? null : (
              <ConfirmButton
                label="Take the name off"
                question={`Take ${member.name.trim()}'s name off? They keep the account, the games and the rating; only the name goes, and they are asked for a new one.`}
                confirm="Take it off"
                onConfirm={() => void change({ email: account, name: "" }, account)}
                disabled={busy === member.email}
                testId="take-name-off"
              />
            )}
            {/*
              Opening an account again asks nothing: it undoes something and
              takes nothing away. Shutting one does both, so it asks.
            */}
            {account === null ? (
              /* A kept record is not an account: there is nothing to shut. */
              <span className="text-xs text-muted">No account</span>
            ) : member.isYou ? (
              /*
               * Your own row. This used to offer to shut it, answer 200, and
               * do nothing at all, because the operator check never read the
               * ban. It reads it now — which is exactly why this cannot be
               * offered: the ban is checked on every request and the only
               * control that would undo it is behind the door it just shut.
               * An operator is named in the deployment and unnamed there.
               */
              <span className="text-xs text-muted" data-testid="cannot-shut-yourself">
                This is you
              </span>
            ) : member.bannedAt === null ? (
              <ConfirmButton
                label="Shut the account"
                question={`Shut ${member.name.trim() || member.email}'s account? It stops working on their next request and the invite they came in by is revoked. Their games and their rating stay exactly as they are.`}
                confirm="Shut it"
                onConfirm={() => void change({ email: account, banned: true }, account)}
                disabled={busy === member.email}
                strong
                testId="ban-member"
              />
            ) : (
              <Button
                onClick={() => void change({ email: account, banned: false }, account)}
                disabled={busy === member.email}
                data-testid="ban-member"
              >
                Open it again
              </Button>
            )}
            </RowActions>
          </li>
          );
        })}
      </ul>
      {members.length === 0 ? <p className={`${PANEL_CLASS} text-sm text-muted`}>Nobody has joined yet.</p> : null}
    </section>
  );
}
