import type { ShotProps } from "@/components/about/about.types";
import type { Speaker } from "@/lib/i18n/i18n";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";

/**
 * The screenshots of the site on the About page, in `public/art/about/`.
 *
 * Taken from a local copy of the site with games played between the computer
 * players, at 1280×860 on a desk and at 390×844 on a phone (twice the pixels,
 * as a phone's screen has). The two wallpapers are the files the Download
 * button saved for AlphaGo against Lee Sedol, one in each shape, made smaller
 * to keep the page light. Retake them when the
 * pages they show change shape; `about.coverage.test.ts` fails if a file named
 * here is missing.
 */
const DESK = { width: 1280, height: 860 } as const;
const PHONE = { width: 780, height: 1688, phone: true } as const;

/** Each picture, with the phrase that describes it: the pictures are of the English site, so the description says so. */
export const SHOTS = {
  boardDesk: { src: "/art/about/board-desktop.jpg", alt: "about.shots.boardDesk", ...DESK },
  boardPhone: { src: "/art/about/board-phone.jpg", alt: "about.shots.boardPhone", ...PHONE },
  setUp: { src: "/art/about/set-up.jpg", alt: "about.shots.setUp", ...DESK },
  vsComputer: { src: "/art/about/vs-computer.jpg", alt: "about.shots.vsComputer", ...DESK },
  replayDesk: { src: "/art/about/replay-desktop.jpg", alt: "about.shots.replayDesk", ...DESK },
  replayPhone: { src: "/art/about/replay-phone.jpg", alt: "about.shots.replayPhone", ...PHONE },
  pictureWindow: { src: "/art/about/picture-window.jpg", alt: "about.shots.pictureWindow", ...DESK },
  wallDesk: { src: "/art/about/wall-alphago-desktop.jpg", alt: "about.shots.wallDesk", width: 1600, height: 900 },
  wallPhone: { src: "/art/about/wall-alphago-phone.jpg", alt: "about.shots.wallPhone", ...PHONE },
  gamePage: { src: "/art/about/game-page.jpg", alt: "about.shots.gamePage", ...DESK },
  famous: { src: "/art/about/famous.jpg", alt: "about.shots.famous", ...DESK },
  computerPlayer: { src: "/art/about/computer-player.jpg", alt: "about.shots.computerPlayer", ...DESK },
  xpBoard: { src: "/art/about/xp-board.jpg", alt: "about.shots.xpBoard", ...DESK },
} as const satisfies Record<string, Omit<ShotProps, "alt"> & { alt: PhraseKey }>;

type ShotName = keyof typeof SHOTS;

/** A picture's props with its description in the reader's language. */
export function shot(say: Speaker, name: ShotName): ShotProps {
  const { alt, ...rest } = SHOTS[name];
  return { ...rest, alt: say.say(alt) };
}
