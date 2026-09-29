"use client";

import dynamic from "next/dynamic";

/**
 * The local game card, loaded on the client only. What it shows lives in
 * local storage, which the server cannot see, so skipping the server render
 * is what lets it read once and be right, rather than render empty and then
 * correct itself.
 */
export const LocalGameCardClient = dynamic(
  () =>
    Promise.all([import("./LocalGameCard"), import("./LocalPartyCard"), import("./MahjongTableCard")]).then(([board, party, mahjong]) => {
      /* The board kept on this device, the pass-and-play Kumimoji and the Mahjong table: all wait on Pass and play. */
      function LocalGames() {
        return (
          <>
            <board.LocalGameCard />
            <party.LocalPartyCard />
            <mahjong.MahjongTableCard />
          </>
        );
      }
      return LocalGames;
    }),
  { ssr: false },
);
