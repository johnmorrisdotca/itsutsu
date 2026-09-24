"use client";

import { useEffect, useEffectEvent, useState } from "react";

import { Button } from "@/components/ui/Controls";

import { REPLAY_BUTTONS, REPLAY_STEP_MS } from "./replay.constants";

/**
 * FIRST, BACK, PLAY, FORWARD, LAST: the buttons under a scrubber.
 *
 * John, 2026-09-24: "we might want a first and last and autoplay, if it can be
 * done elegantly." A finished game's replay had four of them and no Play; a
 * board on one screen had only the scrubber. Both draw this row now, so the two
 * cannot drift apart.
 *
 * Play steps one position every `REPLAY_STEP_MS` on a timer in the browser. It
 * only moves the index, the way the scrubber does, so it asks the server
 * nothing. Pressed at the last position it starts again from the first. It
 * stops at the end, and at any press of the other four; dragging the scrubber
 * while it plays carries on from wherever the reader let go, like a video.
 *
 * `index` and `last` are positions on the caller's own timeline, 0 being the
 * empty board. `onGo` is how the caller moves, the same door its scrubber uses.
 */
export function ReplayButtons({
  index,
  last,
  onGo,
  testId,
}: {
  index: number;
  last: number;
  onGo: (index: number) => void;
  /** Prefix for each button's test id, so a page with two records can tell them apart. */
  testId: string;
}) {
  const [playing, setPlaying] = useState(false);
  const running = playing && index < last;

  const step = useEffectEvent(() => {
    if (index + 1 >= last) setPlaying(false);
    onGo(index + 1);
  });

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(step, REPLAY_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [running, index]);

  function go(target: number) {
    setPlaying(false);
    onGo(target);
  }

  function toggle() {
    if (running) {
      setPlaying(false);
      return;
    }
    if (index >= last) onGo(0);
    setPlaying(true);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => go(0)} disabled={index === 0} data-testid={`${testId}-start`}>
        {REPLAY_BUTTONS.start}
      </Button>
      <Button onClick={() => go(index - 1)} disabled={index === 0} data-testid={`${testId}-back`}>
        {REPLAY_BUTTONS.back}
      </Button>
      <Button onClick={toggle} disabled={last === 0} strong={running} data-testid={`${testId}-play`}>
        {running ? REPLAY_BUTTONS.pause : REPLAY_BUTTONS.play}
      </Button>
      <Button onClick={() => go(index + 1)} disabled={index >= last} data-testid={`${testId}-forward`}>
        {REPLAY_BUTTONS.forward}
      </Button>
      <Button onClick={() => go(last)} disabled={index >= last} data-testid={`${testId}-end`}>
        {REPLAY_BUTTONS.end}
      </Button>
    </div>
  );
}
