"use client";

import dynamic from "next/dynamic";

/**
 * MEXICAN TRAIN'S TABLE AND ITS MY GAMES CARD, LOADED IN THE BROWSER ONLY.
 *
 * Both read a game kept in this browser, which the server cannot see: on the
 * server the table draws its empty room and the card nothing, so a server
 * render of them does no work a reader sees. Loading them here keeps the
 * rules, the computer player and the table's drawing out of the server's
 * bundle altogether (the deploy measures every function's size), and the
 * page arrives with the table's room kept (`min-h`) until the browser fills it.
 */
export const TrainGameClient = dynamic(() => import("./TrainGame").then((module) => module.TrainGame), {
  ssr: false,
  loading: () => <section className="min-h-[32rem]" data-testid="train-game" data-ready="false" aria-busy="true" />,
});

export const TrainCardClient = dynamic(() => import("./TrainCard").then((module) => module.TrainCard), { ssr: false });
