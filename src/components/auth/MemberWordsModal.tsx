"use client";

import { useEffect, useRef, useState } from "react";

import { WORDS_COPY } from "@/components/mine/mine.constants";
import {
  emptyArrangement,
  reconcileArrangement,
  swapBoxes,
  type Arrangement,
} from "@/components/mine/phraseArrangement";
import { WordCandidates } from "@/components/mine/WordCandidates";
import { WordTiles } from "@/components/mine/WordTiles";
import { BUTTON_QUIET, BUTTON_STRONG, BUTTON_TAP } from "@/components/ui/ui.constants";
import { PHRASE_LENGTH } from "@/lib/phrase/phrase";

import { ADMIN_WORDS_COPY, wordsDate } from "./admin.constants";
import type { AdminDrawFields, MemberWordsModalProps } from "./admin.types";

/**
 * The operator choosing a member's four words, from the Members list.
 *
 * THE MEMBER'S OWN WORDS TAB, OPENED BY SOMEBODY ELSE. `WordTiles` and
 * `WordCandidates` are the same components `PhraseSetup` draws — imported, not
 * copied — so the four boxes, the candidate tiles, the refresh icon, the drag
 * and the arrow keys all behave identically. They have to: this is the same
 * act, and two pickers that drift apart are two things to learn and one of them
 * will be the one his daughter used last.
 *
 * WHAT IS DIFFERENT IS WHO IS AT THE SCREEN, and that changes exactly three
 * things:
 *
 *  1. THE REPLACE QUESTION COMES FIRST. A phrase cannot be read back, so
 *     replacing one silently is a way to lock somebody out of their own games.
 *     Where the list says there are already words, this asks before it draws a
 *     single candidate — and the route refuses the save without the confirm
 *     anyway, which is what catches a member who set their own words in the
 *     minutes since the list was drawn.
 *  2. THE WORDS MUST BE HANDED OVER. On the member's own tab the person picking
 *     is the person who needs them. Here they are two people, so the
 *     acknowledgement says "to give to this member" and the panel says the
 *     words cannot be shown to anybody again, including to the operator.
 *  3. THERE IS NO REMOVE. Taking somebody's last way into their account away is
 *     not an operator's convenience, and `credentials.ts` refuses it for the
 *     member themselves; nothing here offers it.
 *
 * NO TEXT BOX, HERE ANY MORE THAN THERE. The picker IS the security design —
 * four words offered at random are as strong as random however deliberately
 * anybody felt they were choosing, and a box to type them in would make the
 * phrase exactly as strong as an adult's taste in words. The one input on this
 * screen is the checkbox. `memberWordsModal.coverage.test.ts` fails the build
 * if another appears, the same gate `phraseSetup.coverage.test.ts` keeps over
 * the member's tab.
 *
 * THE WORDS NEVER OUTLIVE THIS COMPONENT. They live in its state and nowhere
 * else — not the address, not a log, not the response to the save — and
 * closing or saving clears it.
 */
export function MemberWordsModal({ member, onClose, onSaved }: MemberWordsModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  /*
   * Whether the operator has agreed to replace the words that are there. It
   * starts as "nothing to replace" when the row has none, which is most rows —
   * so `false` here always means a question that is still outstanding rather
   * than one nobody asked.
   */
  const [replacing, setReplacing] = useState(member.phraseSetAt === null);
  /** The date the words being replaced were set, as of the server, once known. */
  const [setAt, setSetAt] = useState<string | null>(member.phraseSetAt);
  const [ticket, setTicket] = useState<string | null>(null);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [arranged, setArranged] = useState<Arrangement>(() => emptyArrangement());
  const [offered, setOffered] = useState<string[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const done = slots.length === PHRASE_LENGTH && slots.every((word) => word !== null);
  const remaining = arranged.filter((word) => word === null).length;

  /**
   * That a first draw has been asked for.
   *
   * A ref rather than state, and it is not belt and braces: an effect runs
   * twice in development, and a second fresh draw would discard the ticket the
   * first one had already put four candidates on screen for.
   */
  const started = useRef(false);

  /** Asks for the first four candidates, once, whenever the pick may begin. */
  function startPick(): void {
    if (started.current) return;
    started.current = true;
    void draw({});
  }

  // The same dialog mechanics as `IdleModal`: the native element, so the page
  // behind is inert, Escape closes, and focus is trapped without a trap. The
  // pick starts here for a member with no words — the equivalent of pressing
  // "Choose your four words" on their own tab — and waits for the replace
  // question to be answered for a member who has some.
  useEffect(() => {
    const element = dialog.current;
    if (element !== null && !element.open) element.showModal();
    if (member.phraseSetAt === null) startPick();
    // Once, on open. Nothing in the pick belongs to a later render of it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function draw(body: Record<string, unknown>): Promise<void> {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/admin/members/${encodeURIComponent(member.id)}/phrase/draw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? ADMIN_WORDS_COPY.drawFailed);
      return;
    }
    const state = (await response.json()) as AdminDrawFields;
    setTicket(state.ticket);
    setSlots(state.slots);
    setOffered(state.offered);
    setArranged((shown) => reconcileArrangement(shown, state.slots));
    /*
     * The server's answer about this member, not the list's. If they set their
     * own words in the meantime, the question is asked here rather than at the
     * save — and `setAt` is kept up to date either way, so the sentence the
     * operator reads names the right date.
     */
    setSetAt(state.member.setAt);
    if (state.member.set && member.phraseSetAt === null) setReplacing(false);
  }

  /** The operator has said to replace what is there. Now the pick may start. */
  function agreeToReplace(): void {
    setReplacing(true);
    startPick();
  }

  /** A kept word tapped: out it goes, by the slot the TICKET holds it in. */
  function takeOut(word: string): void {
    const at = slots.indexOf(word);
    if (at === -1) return;
    void draw({ ticket, drop: at });
  }

  /** A word carried to another box. The browser's business alone; nothing is sent. */
  function move(from: number, to: number): void {
    setArranged((shown) => swapBoxes(shown, from, to));
  }

  async function save(): Promise<void> {
    if (ticket === null || !acknowledged) return;
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/admin/members/${encodeURIComponent(member.id)}/phrase`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      /*
       * THE SIGNED TICKET AND NOTHING THE BROWSER ARRANGED. A phrase is a set:
       * the boxes are the operator's own aid to remembering them and the order
       * never reaches the server — see `phraseArrangement.ts`. `replacing` is
       * sent only when it is true, because the field means "I was asked and I
       * said yes" and sending false would be saying it about a question nobody
       * put.
       */
      body: JSON.stringify(replacing ? { ticket, acknowledged: true, replacing: true } : { ticket, acknowledged: true }),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; confirmNeeded?: boolean; phraseSetAt?: string | null }
        | null;
      /*
       * The one refusal that is a question rather than a fault: words appeared
       * on this account since the pick opened. The four that were chosen are
       * still good — the ticket is unspent — so the operator answers the
       * question and presses Save again.
       */
      if (payload?.confirmNeeded === true) {
        setReplacing(false);
        setSetAt(payload.phraseSetAt ?? null);
        setError(null);
        return;
      }
      setError(payload?.error ?? ADMIN_WORDS_COPY.saveFailed);
      return;
    }
    // Done with the words the moment they are set: nothing here keeps them.
    setTicket(null);
    setSlots([]);
    setArranged(emptyArrangement());
    setOffered([]);
    setSaved(true);
    onSaved();
  }

  const asking = !replacing;
  const name = member.name.trim() === "" ? member.id : member.name.trim();

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="member-words-title"
      className="m-auto w-[min(44rem,calc(100vw-2rem))] rounded-2xl border border-rule bg-paper p-5 text-ink shadow-2xl backdrop:bg-ink/60 backdrop:backdrop-blur-sm"
      data-testid="member-words-modal"
    >
      <div className="flex flex-col gap-4">
        <h2 id="member-words-title" className="flex flex-wrap items-baseline gap-2 text-lg font-semibold">
          {ADMIN_WORDS_COPY.title} {name}
          <span className="font-mincho text-base font-normal opacity-70">{ADMIN_WORDS_COPY.linkKanji}</span>
        </h2>

        {saved ? (
          <div className="flex flex-col gap-3" data-testid="member-words-saved">
            <WordTiles words={emptyArrangement()} mode="kept" />
            <p className="text-base">{ADMIN_WORDS_COPY.savedFor(name)}</p>
            <p className="text-sm text-muted">{ADMIN_WORDS_COPY.savedKept}</p>
            <button
              type="button"
              onClick={onClose}
              className={`${BUTTON_TAP} ${BUTTON_STRONG} self-start`}
              data-testid="member-words-done"
            >
              {ADMIN_WORDS_COPY.done}
            </button>
          </div>
        ) : asking ? (
          /*
           * THE REPLACE QUESTION, and it is asked before anything is drawn. The
           * operator is about to take away a credential somebody may be using
           * at this moment, so the date it was set is in the question — that is
           * the one thing that can be known about a hashed phrase, and it is
           * what turns "there is already one" into something anybody can
           * decide about.
           */
          <div className="flex flex-col gap-3" data-testid="member-words-replace">
            <WordTiles words={emptyArrangement()} mode="kept" />
            <p className="text-base font-semibold">{ADMIN_WORDS_COPY.replaceTitle}</p>
            <p className="text-sm text-ink-soft">
              {ADMIN_WORDS_COPY.replaceQuestion(setAt === null ? "" : wordsDate(setAt))}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={agreeToReplace}
                className={`${BUTTON_TAP} ${BUTTON_QUIET} text-shu`}
                data-testid="member-words-replace-confirm"
              >
                {ADMIN_WORDS_COPY.replaceYes}
              </button>
              <button
                type="button"
                onClick={onClose}
                className={`${BUTTON_TAP} ${BUTTON_STRONG}`}
                data-testid="member-words-replace-cancel"
              >
                {ADMIN_WORDS_COPY.replaceNo}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4" data-testid="member-words-picker">
            <p className="text-sm text-muted">{ADMIN_WORDS_COPY.lead(name)}</p>
            <WordTiles words={arranged} mode="picking" busy={busy} onTakeOut={takeOut} onMove={move} />
            <p className="text-sm text-muted">{WORDS_COPY.arrange}</p>

            {!done ? (
              offered.length === 0 ? (
                <p className="text-sm text-muted">{WORDS_COPY.finding}</p>
              ) : (
                <WordCandidates
                  offered={offered}
                  busy={busy}
                  remaining={remaining}
                  onKeep={(index) => void draw({ ticket, keep: index })}
                  onRefresh={() => void draw({ ticket })}
                />
              )
            ) : (
              <div className="flex flex-col gap-3 rounded-2xl border border-ochre/40 bg-ochre-soft p-4">
                <p className="text-base font-semibold">{WORDS_COPY.writeDown}</p>
                <p className="text-sm text-ink-soft">{ADMIN_WORDS_COPY.handOver(name)}</p>
                <label className="flex min-h-12 items-center gap-3 text-base">
                  <input
                    type="checkbox"
                    className="size-5 shrink-0"
                    checked={acknowledged}
                    onChange={(event) => setAcknowledged(event.target.checked)}
                    data-testid="member-words-acknowledge"
                  />
                  {ADMIN_WORDS_COPY.acknowledge}
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={!acknowledged || busy}
                    onClick={() => void save()}
                    className={`${BUTTON_TAP} ${BUTTON_STRONG}`}
                    data-testid="member-words-save"
                  >
                    {ADMIN_WORDS_COPY.save}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAcknowledged(false);
                      void draw({});
                    }}
                    className="min-h-12 px-1 py-2 text-sm text-muted underline underline-offset-4"
                  >
                    {WORDS_COPY.startOver}
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="min-h-12 self-start px-1 py-2 text-sm text-muted underline underline-offset-4"
              data-testid="member-words-cancel"
            >
              {WORDS_COPY.cancel}
            </button>
          </div>
        )}

        {error !== null ? (
          <p className="text-sm text-shu" data-testid="member-words-error">
            {error}
          </p>
        ) : null}
      </div>
    </dialog>
  );
}
