import Link from "next/link";

import { PLAY_BUTTON } from "@/components/ui/ui.constants";

/**
 * THE ONE PLAY BUTTON on a game's page and on its rules page: very large,
 * straight under the game's picture, leading to the set-up screen.
 *
 * John, 2026-09-25, at a rules page whose only way to start was a line of
 * text under the last rule: "so many play buttons… the Play being at the
 * bottom… probably should be at the Top… Perhaps the Play button, when
 * viewing a single Game Page or Rules page, should be under the Big Image? in
 * a very large button." One word, one place, one size, on every page that
 * is about one game. Whether to play alone, a friend or the computer is
 * chosen on the set-up screen, not here.
 */
export function PlayButton({ href, testId = "game-set-up", label = "Play →" }: { href: string; testId?: string; /** Said in the reader's language where the page is translated. */ label?: string }) {
  return (
    <Link href={href} className={PLAY_BUTTON} data-testid={testId}>
      {label}
    </Link>
  );
}
