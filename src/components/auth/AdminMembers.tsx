"use client";

import { Paired } from "@/components/i18n/Paired";
import { useState } from "react";
import useSWR from "swr";

import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Button, RowActions } from "@/components/ui/Controls";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import type { MemberSummary } from "@/lib/auth/memberRoster";
import { MEMBER_KINDS } from "@/lib/auth/memberKind";
import { PlayerName } from "@/components/players/PlayerName";
import { ADMIN_WORDS_COPY } from "./admin.constants";
import { MemberKindBadge } from "./MemberKindBadge";
import { MemberWordsModal } from "./MemberWordsModal";
import type { WordsSubject } from "./admin.types";

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
 *
 * PEOPLE ONLY. The computer players used to be listed here among them, badged
 * as robots, and they are seven rows the operator never does anything to — so
 * they have a tab of their own (`AdminBots`) showing what an operator actually
 * wants to know about a program. The split is `memberKind`'s, which is the
 * site's one answer to what a member IS: their rows carry both `botTier` and
 * `unclaimableBecause: "computer"` and agree either way.
 *
 * THE KEPT RECORDS STAY HERE. They are people — a record of somebody's games
 * from before this site — and the controls on this list are the ones you point
 * at a person. Two rows do not make a tab, and the badge already says which
 * they are.
 *
 * WORDS 合言葉 is the third way a member's four words can be set: the member's
 * own tab, sitting in at a game, and the operator here. The link is a LINK —
 * the list asks the server for nothing per row, and the modal draws its first
 * four candidates only once it is open. What the row knows already is the DATE
 * words were last set, which came down with the list.
 */
export function AdminMembers() {
  const { data, mutate } = useSWR<{
    items: MemberSummary[];
    total?: number;
    people?: number;
    robots?: number;
    shown?: number;
  }>("/api/members", json);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** The member whose Words modal is open, or null. One at a time. */
  const [words, setWords] = useState<WordsSubject | null>(null);

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

  /*
   * The people. A program is a member row like any other and is counted as one
   * everywhere else on the site; this list is the operator's view of WHO IS
   * HERE, and the Bots tab is the view of what plays for the site.
   */
  const members = (data?.items ?? []).filter((member) => member.kind !== MEMBER_KINDS.robot);
  /*
   * The number of members, not the number of rows on screen. The heading used
   * to print the length of the list it had been given, which is capped — so a
   * site with nine hundred members reported two hundred, in the one place
   * somebody goes to find out how many there are.
   *
   * `people` rather than `total` now that the programs are shown elsewhere:
   * counting them in a heading over a list they are not in is the same fault
   * one category along. The route works it out from the list it already has.
   */
  const total = data?.people ?? data?.total ?? members.length;
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
                    <PlayerName name={member.name} memberId={member.id} fallback="" whole />
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
                {/*
                  Whether there are four words on this account, and since when.
                  The DATE is the only thing that can be said about a phrase —
                  it is hashed and cannot be shown again to anybody — and it is
                  what the operator weighs before replacing one. Said on rows
                  that could have words at all: a kept record or a computer
                  player has nobody to hand them to, and "No words" against one
                  of those would read as something missing.
                */}
                {member.mayHavePhrase ? (
                  <span data-testid="member-words-state">
                    {" · "}
                    {member.phraseSetAt === null
                      ? ADMIN_WORDS_COPY.rowUnset
                      : ADMIN_WORDS_COPY.rowSet(day(member.phraseSetAt))}
                  </span>
                ) : null}
                {member.bannedNote === "" ? "" : ` · ${member.bannedNote}`}
              </span>
            </span>
            <RowActions>
            {/*
              WORDS 合言葉. Setting a credential is the one thing here that
              gives somebody a way IN rather than taking one away, so it is
              offered only where there is an account to get into —
              `mayHavePhrase` is `canBeClaimed`, answered on the server.
              Pressing it opens the member's own picker in a modal; nothing is
              asked of the server until it is open.
            */}
            {member.mayHavePhrase ? (
              <Button
                onClick={() => setWords({ id: member.id, name: member.name, phraseSetAt: member.phraseSetAt })}
                title={ADMIN_WORDS_COPY.linkTitle}
                data-testid="member-words"
              >
                <Paired
                  en={ADMIN_WORDS_COPY.link}
                  kanji={ADMIN_WORDS_COPY.linkKanji}
                  kanjiClassName="font-mincho text-xs opacity-70"
                />
              </Button>
            ) : null}
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
      {/*
        One modal for whichever row asked for it, mounted only while it is open
        — so the list holds no picker, makes no draw, and has nothing of
        anybody's words in it until the operator opens one.
      */}
      {words === null ? null : (
        <MemberWordsModal
          member={words}
          onClose={() => setWords(null)}
          /*
            Read the list again rather than patching the row: the date is the
            server's to state, and one request after a save is the same thing
            every other control on this list already does.
          */
          onSaved={() => void mutate()}
        />
      )}
    </section>
  );
}
