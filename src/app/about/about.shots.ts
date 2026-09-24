import type { ShotProps } from "@/components/about/about.types";

/**
 * The screenshots of the site on the About page, in `public/art/about/`.
 *
 * Taken from a local copy of the site with games played between the computer
 * players, at 1280×860 on a desk and at 390×844 on a phone (twice the pixels,
 * as a phone's screen has). The two wallpapers are the files the Download
 * button saved, made smaller to keep the page light. Retake them when the
 * pages they show change shape; `about.coverage.test.ts` fails if a file named
 * here is missing.
 */
const DESK = { width: 1280, height: 860 } as const;
const PHONE = { width: 780, height: 1688, phone: true } as const;

export const SHOTS = {
  boardDesk: { src: "/art/about/board-desktop.jpg", alt: "The practice board on a desk: a Gomoku game twelve moves in, with the side panel saying Black can force a win.", ...DESK },
  boardPhone: { src: "/art/about/board-phone.jpg", alt: "The same practice board on a phone, the board filling the width of the screen.", ...PHONE },
  setUp: { src: "/art/about/set-up.jpg", alt: "The set-up screen's list of computer players, each with a grade or a style, with Rafa Duarte chosen.", ...DESK },
  vsComputer: { src: "/art/about/vs-computer.jpg", alt: "A Gomoku game against a computer player: the board, the move list with Every position under it, private notes, the confirm switch, and a row of emoji and ready-made notes to send with a move.", ...DESK },
  replayDesk: { src: "/art/about/replay-desktop.jpg", alt: "A finished Reversi game between Kyu and Dan: the head-to-head card, and the board with its slider at move 33 of 60.", ...DESK },
  replayPhone: { src: "/art/about/replay-phone.jpg", alt: "The same finished game on a phone, with the slider under the board.", ...PHONE },
  pictureWindow: { src: "/art/about/picture-window.jpg", alt: "The picture window: a Go game as rows of small boards, one per move, with the options for a long game and a Download button.", ...DESK },
  wallDesk: { src: "/art/about/wall-reversi-desktop.jpg", alt: "A downloaded picture of a whole Reversi game: sixty small boards in six rows, filling a widescreen image.", width: 1600, height: 900 },
  wallPhone: { src: "/art/about/wall-connect6-phone.jpg", alt: "A downloaded picture of a Connect6 game shaped for a phone, tall and narrow, with the game's details in the last tiles.", ...PHONE },
  gamePage: { src: "/art/about/game-page.jpg", alt: "The Go page: the board, the object of the game, the games played here, and the final positions of recent games in the side column.", ...DESK },
  famous: { src: "/art/about/famous.jpg", alt: "The Famous games page, opening with the four games of the 2016 Google DeepMind Challenge Match between Lee Sedol and AlphaGo.", ...DESK },
  computerPlayer: { src: "/art/about/computer-player.jpg", alt: "A computer player's page, listing for each game how it measured against the grades on either side of it.", ...DESK },
  xpBoard: { src: "/art/about/xp-board.jpg", alt: "The XP board, with filters for people or computers and for experience earned here or everywhere.", ...DESK },
} as const satisfies Record<string, ShotProps>;
