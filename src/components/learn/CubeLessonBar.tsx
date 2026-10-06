"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { LESSON_SPEED_ORDER, type LessonSpeed } from "@/lib/learn/cubeLesson";

const SPEED_WORDS = {
  slow: "cubemethod.speedSlow",
  normal: "cubemethod.speedNormal",
  fast: "cubemethod.speedFast",
} as const;

/**
 * THE CONTROLS OF A STEP PLAYED AS A LESSON: play and pause, a move back and a
 * move on, the step again from its start, and how fast. Beside the move the
 * lesson stands at and its scrubber (`CubeReplayPanel`), which is where the
 * lesson is said and moved; this is only what plays it.
 */
export function CubeLessonBar({
  playing,
  atStart,
  atEnd,
  speed,
  onPlay,
  onPause,
  onBack,
  onOn,
  onReplay,
  onSpeed,
}: {
  playing: boolean;
  atStart: boolean;
  atEnd: boolean;
  speed: LessonSpeed;
  onPlay: () => void;
  onPause: () => void;
  onBack: () => void;
  onOn: () => void;
  onReplay: () => void;
  onSpeed: (speed: LessonSpeed) => void;
}) {
  const say = useSpeaker();
  const button = `${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`;
  return (
    <div className="flex flex-col gap-2" data-testid="cube-step-bar">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={button} onClick={onBack} disabled={atStart} data-testid="cube-step-back">
          ‹ {say.say("replay.back")}
        </button>
        <button type="button" className={button} onClick={playing ? onPause : onPlay} data-testid="cube-step-play" data-playing={playing ? "true" : "false"}>
          {playing ? `❚❚ ${say.say("replay.pause")}` : `▶ ${say.say("replay.play")}`}
        </button>
        <button type="button" className={button} onClick={onOn} disabled={atEnd} data-testid="cube-step-on">
          {say.say("replay.forward")} ›
        </button>
        <button type="button" className={button} onClick={onReplay} data-testid="cube-step-replay">
          {say.say("cubemethod.replayStep")}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={say.say("cubemethod.speedLabel")}>
        <span className="text-sm text-muted">{say.say("cubemethod.speedLabel")}</span>
        {LESSON_SPEED_ORDER.map((one) => (
          <button key={one} type="button" className={`${BUTTON_BASE} ${speed === one ? BUTTON_STRONG : BUTTON_QUIET} ${TAP_HEIGHT}`} aria-pressed={speed === one} onClick={() => onSpeed(one)} data-testid={`cube-step-speed-${one}`}>
            {say.say(SPEED_WORDS[one])}
          </button>
        ))}
      </div>
    </div>
  );
}
