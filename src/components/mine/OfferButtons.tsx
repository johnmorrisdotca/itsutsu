"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Paired } from "@/components/i18n/Paired";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { OFFER_ACTIONS, type OfferAction } from "@/lib/history/offers.types";
import { MY_GAMES_COPY } from "./mine.constants";

/**
 * ANSWERING AN OFFER: accept, decline, or take it back.
 *
 * The same three buttons wherever an offer is shown — in the queue on /play
 * and beside the board — because they are the same act, and a second copy of
 * them would drift in what it called declining and in what it did afterwards.
 *
 * NOTHING ASKS "ARE YOU SURE" HERE, and that is a decision rather than an
 * omission. `ConfirmButton` exists for things that cannot be taken back, and
 * none of these three is one: declining costs nobody anything and the offer
 * can be made again, withdrawing is somebody taking back their own question,
 * and accepting starts a game that can then be given up like any other. A
 * question in front of "Decline" would make refusing feel like a thing with
 * consequences, which is exactly what John asked for it not to be.
 *
 * A refusal is SAID. The three routes answer 409 to an offer somebody has
 * already answered — two tabs, or the other person withdrawing while this page
 * sat open — and a button that swallowed that would look like a button that
 * does nothing, which is the fault `ResignButton` was fixed for.
 */
export function OfferButtons({
  id,
  side,
  onDone,
}: {
  id: string;
  /** Which side of the offer this reader is on; it decides which buttons show. */
  side: "to-me" | "from-me";
  /** For a caller that redraws itself rather than leaning on the router. */
  onDone?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [refused, setRefused] = useState<string | null>(null);

  async function answer(action: OfferAction) {
    setBusy(true);
    try {
      const response = await fetch(`/api/games/${id}/offer/${action}`, { method: "POST" });
      if (response.ok) {
        setRefused(null);
        onDone?.();
        /*
         * `refresh` rather than a push, even for Accept — which does hand back
         * a path. This component is drawn in two places and only one of them
         * is the board; re-rendering where the reader already is lets the
         * queue's own row become a game, and the board's panel become a board,
         * without either having to know which it is.
         */
        router.refresh();
        return;
      }
      const said = (await response.json().catch(() => null)) as { error?: string } | null;
      setRefused(said?.error ?? FAILED[action]);
    } finally {
      setBusy(false);
    }
  }

  const copy = MY_GAMES_COPY.offer;
  return (
    <span className="flex flex-col items-end gap-1">
      {refused === null ? null : (
        <span className="text-xs text-ochre" role="status" data-testid="offer-refused">
          {refused}
        </span>
      )}
      <span className="flex flex-wrap items-center gap-2">
        {side === "to-me" ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void answer(OFFER_ACTIONS.accept)}
              className={`${BUTTON_BASE} ${BUTTON_STRONG} px-2 py-1 text-xs`}
              data-testid="offer-accept"
            >
              <Paired en={copy.accept.label} kanji={copy.accept.kanji} kanjiClassName="opacity-70" />
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void answer(OFFER_ACTIONS.decline)}
              className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2 py-1 text-xs`}
              data-testid="offer-decline"
            >
              <Paired en={copy.decline.label} kanji={copy.decline.kanji} kanjiClassName="opacity-70" />
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void answer(OFFER_ACTIONS.withdraw)}
            className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2 py-1 text-xs`}
            data-testid="offer-withdraw"
          >
            <Paired en={copy.withdraw.label} kanji={copy.withdraw.kanji} kanjiClassName="opacity-70" />
          </button>
        )}
      </span>
    </span>
  );
}

/** What to say when the server said no and gave no words of its own. */
const FAILED: Record<OfferAction, string> = {
  accept: MY_GAMES_COPY.offer.acceptFailed,
  decline: MY_GAMES_COPY.offer.declineFailed,
  withdraw: MY_GAMES_COPY.offer.withdrawFailed,
};
