"use client";

import dynamic from "next/dynamic";

import { HachinosuHive } from "./hachinosu/HachinosuHive";

/*
 * THE PREVIEWS OF THE PUZZLES THAT DRAW THEIR OWN BOARD, for the set-up screen (`PuzzleBoardPreview`), each what its solve draws.
 * Hitofude's and Kuniate's are made in the browser only: a board is searched for, and the packages that hold a country's shape and flag are fetched there.
 */
export const HitofudePreview = dynamic(() => import("./hitofude/HitofudePreview").then((module) => module.HitofudePreview), { ssr: false });
export const KuniatePreview = dynamic(() => import("./kuniate/KuniatePreview").then((module) => module.KuniatePreview), { ssr: false });

/** An example hive in each language: a hive is drawn from its letters, so the list of words is not fetched to show one. */
const HIVE_PREVIEWS: Readonly<Record<number, { centre: string; letters: string }>> = { 1: { centre: "a", letters: "treslo" }, 2: { centre: "e", letters: "tarsin" }, 3: { centre: "e", letters: "narstu" } };

export function HachinosuPreview({ size }: { size: number }) {
  const hive = HIVE_PREVIEWS[size] ?? HIVE_PREVIEWS[1]!;
  return <HachinosuHive centre={hive.centre} letters={hive.letters} />;
}
