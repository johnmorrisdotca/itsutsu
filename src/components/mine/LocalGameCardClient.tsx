"use client";

import dynamic from "next/dynamic";

/**
 * The local game card, loaded on the client only. What it shows lives in
 * local storage, which the server cannot see, so skipping the server render
 * is what lets it read once and be right, rather than render empty and then
 * correct itself.
 */
export const LocalGameCardClient = dynamic(
  () => import("./LocalGameCard").then((module) => module.LocalGameCard),
  { ssr: false },
);
