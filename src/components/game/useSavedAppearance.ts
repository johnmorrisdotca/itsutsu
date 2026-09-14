"use client";

import { useEffect, useRef, useState } from "react";

import { sameAppearance } from "@/components/board/appearance";
import type { Appearance } from "@/components/board/board.types";
import { keepaliveFetch } from "@/lib/api/keepaliveFetch";

import { pendingSave } from "./pendingSave";
import { forgetUnsaved, rememberUnsaved, unsavedAppearance } from "./unsavedAppearance";

/**
 * How long a choice waits before it is written, so clicking through several
 * themes to find one is one save rather than several racing to the server.
 */
const SAVE_WAIT_MS = 500;

/**
 * Keeps a member's board on their account.
 *
 * A player dresses the board where they use it — in the game, not on a
 * settings page — so the choice is made there and kept here. Signed in, it
 * follows them to a phone; signed out, this does nothing at all and the
 * browser's own copy is the only one, as it always was.
 *
 * Writes only on a real change. A board is redrawn constantly, and saying
 * the same thing to the server on every render is the shape of thing that
 * has already cost this site a day.
 *
 * AND A CHOICE IS KEPT HOWEVER FAST THE PAGE IS LEFT. Two halves, because the
 * ways of leaving fail differently:
 *
 * - The write waits half a second, and that wait's timer belonged to the page,
 *   so leaving inside it — closing the tab, a link off the board, a phone
 *   switching away — lost the choice outright. What is still waiting is now sent
 *   the moment the page is going (`pagehide`), is hidden (`visibilitychange`) or
 *   the board leaves the page (unmount), through `keepaliveFetch` so the write
 *   outlives the page. One timer, as before; nothing polled.
 * - A reload is faster than any of that: it asks for the new page before the old
 *   one hears it is going, so even a flushed save lands just after the server has
 *   drawn the reloaded board from the account. So the choice is also kept in this
 *   browser until the account confirms it (`unsavedAppearance`), the reloaded
 *   board draws it, and this sends it again.
 *
 * WHY NOT SAVE AT ONCE, since every appearance control is a click. Because a
 * member trying themes clicks several in a second, and several writes in flight
 * together can land in any order — leaving the account on a theme they had
 * already moved past — and saving at once would still lose the reload race.
 */
export function useSavedAppearance(appearance: Appearance, signedIn: boolean): void {
  const last = useRef<Appearance | null>(null);
  // A choice that could not be saved is not worth interrupting a game for: it stays in this browser and goes next time.
  const [save] = useState(() =>
    pendingSave<Appearance>((value) => {
      void keepaliveFetch("/api/me", "PATCH", { appearance: value })
        .then((response) => {
          if (response.ok) forgetUnsaved(value);
        })
        .catch(() => undefined);
    }, SAVE_WAIT_MS),
  );

  useEffect(() => {
    if (!signedIn) return;
    if (last.current === null) {
      last.current = appearance;
      /*
       * The first appearance seen is what the account already holds — it came
       * from there — so it is remembered rather than written back. UNLESS it is a
       * choice this browser still holds unconfirmed, which the board drew in the
       * account's place: that one has not reached the account, so it goes again.
       */
      const waiting = unsavedAppearance();
      if (waiting !== null && sameAppearance(waiting, appearance)) save.set(appearance);
      return;
    }
    if (sameAppearance(last.current, appearance)) return;
    last.current = appearance;
    rememberUnsaved(appearance);
    save.set(appearance);
  }, [appearance, signedIn, save]);

  useEffect(() => {
    const whenHidden = () => {
      if (document.visibilityState === "hidden") save.flush();
    };
    window.addEventListener("pagehide", save.flush);
    document.addEventListener("visibilitychange", whenHidden);
    return () => {
      window.removeEventListener("pagehide", save.flush);
      document.removeEventListener("visibilitychange", whenHidden);
      // The board is leaving the page: what is still waiting goes now rather than never.
      save.flush();
    };
  }, [save]);
}
