"use client";

import dynamic from "next/dynamic";

/**
 * TENKA'S DRAWN DICE, CARDS AND DECK, LOADED IN THE BROWSER ONLY, as the
 * other tables' are (`yachtClient.tsx`): `TenkaDressed.tsx` reaches Korokoro's
 * dice and Toranpu's card art, which a page that only shows the set-up screen
 * or the rules never needs, and which the server must not carry in its
 * function. Each stands in with an empty box of its own size until the code
 * arrives, so nothing around it moves.
 */
export const DressedDieClient = dynamic(() => import("./TenkaDressed").then((module) => module.DressedDie), {
  ssr: false,
  loading: () => <span className="block size-9 shrink-0" aria-hidden="true" />,
});

export const DressedCardClient = dynamic(() => import("./TenkaDressed").then((module) => module.DressedCard), {
  ssr: false,
  loading: () => <span className="block h-[5.5rem] w-16 shrink-0" aria-hidden="true" />,
});

export const DressedBackClient = dynamic(() => import("./TenkaDressed").then((module) => module.DressedBack), {
  ssr: false,
  loading: () => <span className="block h-[5.5rem] w-16 shrink-0" aria-hidden="true" />,
});
