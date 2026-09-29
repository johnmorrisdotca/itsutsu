"use server";

import { currentMemberId } from "@/lib/auth/currentSession";
import { prisma } from "@/lib/prisma";

import { PUZZLE_KINDS } from "../puzzles.constants";
import { KUMIMOJI_WALLPAPER_MOST } from "./wallpaper.constants";
import type { WallpaperCrossword } from "./wallpaper.types";

/**
 * THE ASKER'S OWN FINISHED CROSSWORDS, for their wallpaper — and nothing else.
 *
 * A Server Function, asked once, when the member presses Wallpaper: never on
 * a page view and never on a timer, and nothing is stored. One indexed query
 * (`memberId, finishedAt`) that reads only the three columns the picture is
 * drawn from, newest first, and no more rows than one picture holds
 * (`KUMIMOJI_WALLPAPER_MOST`). The picture itself is drawn in the browser.
 *
 * WHOSE, FROM THE SESSION ONLY. It takes no argument, so there is no member id
 * a browser could choose: a child's crosswords reach nobody but the child,
 * and nobody else's reach anybody. Somebody not signed in as a member gets an
 * empty list, the same answer as a member who has built nothing.
 */
export async function myFinishedCrosswords(): Promise<WallpaperCrossword[]> {
  const memberId = await currentMemberId();
  if (memberId === null) return [];
  const rows = await prisma.puzzleSolve.findMany({
    where: { memberId, kind: PUZZLE_KINDS.kumimoji, solved: true, answer: { not: null } },
    orderBy: { finishedAt: "desc" },
    take: KUMIMOJI_WALLPAPER_MOST,
    select: { answer: true, size: true, finishedAt: true },
  });
  return rows.map((row) => ({ answer: row.answer ?? "", size: row.size, finishedAt: row.finishedAt.toISOString() }));
}
