"use client";

import { useEffect, useRef, type HTMLAttributes, type SVGAttributes } from "react";

import { hitotsuCardShapes, type HitotsuShape } from "./card.ts";
import type { HitotsuCard, HitotsuColour } from "./types.ts";
import { mountHitotsu, type HitotsuHandle, type HitotsuTableOptions } from "./ui/mount.ts";

/** One shape of the design as a React element. */
function Shape({ shape }: { shape: HitotsuShape }) {
  switch (shape.kind) {
    case "rect":
      return <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} transform={shape.transform} />;
    case "path":
      return <path d={shape.d} fill={shape.fill} />;
    case "circle":
      return <circle cx={shape.cx} cy={shape.cy} r={shape.r} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} />;
    case "text":
      return (
        <text x={shape.x} y={shape.y} textAnchor="middle" fontSize={shape.fontSize} fontWeight={shape.fontWeight} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} fontFamily={shape.fontFamily} transform={shape.transform}>
          {shape.text}
        </text>
      );
  }
}

/**
 * One card's drawing, to go inside any SVG whose box is 100 by 140: a face,
 * or the back for `null`. `called` marks a wild on the pile with the colour it
 * called. The design is `hitotsuCardShapes`, so this and `hitotsuCardSvg`
 * always agree.
 */
export function HitotsuCardDrawing({ card, called }: { card: HitotsuCard | null; called?: HitotsuColour }) {
  return (
    <>
      {hitotsuCardShapes(card, called).map((shape, at) => (
        <Shape key={at} shape={shape} />
      ))}
    </>
  );
}

/** A card as a whole SVG, sized by its parent or its own `width`: `<HitotsuCardImage card="R70" width={80} />`. */
export function HitotsuCardImage({ card, called, ...svg }: { card: HitotsuCard | null; called?: HitotsuColour } & SVGAttributes<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 140" aria-hidden="true" {...svg}>
      <HitotsuCardDrawing card={card} called={called} />
    </svg>
  );
}

export type HitotsuTableProps = HitotsuTableOptions & { onReady?: (table: HitotsuHandle) => void } & Omit<HTMLAttributes<HTMLDivElement>, keyof HitotsuTableOptions>;

const OPTION_NAMES = ["players", "rules", "size", "seed", "strings", "computerMs", "theme", "onMove", "onReady"] as const;

/**
 * A whole table, you against computers, as a React component:
 * `<HitotsuTable rules={HITOTSU_PARTY} players={["You", "Aki", "Ben"]} />`.
 *
 * A thin wrapper. The table is plain DOM (`mountHitotsu`), mounted into this
 * component's own element once the browser has it and taken back on unmount,
 * so it renders nothing on the server and needs no provider. Options are read
 * when it mounts; give it a new `key` to deal again with different ones.
 */
export function HitotsuTable(props: HitotsuTableProps) {
  const host = useRef<HTMLDivElement>(null);
  const options = useRef<HitotsuTableProps>({});
  const element: Record<string, unknown> = {};
  const given: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(props)) {
    if ((OPTION_NAMES as readonly string[]).includes(name)) given[name] = value;
    else element[name] = value;
  }
  useEffect(() => {
    options.current = given as HitotsuTableProps;
  });

  useEffect(() => {
    const target = host.current;
    if (target === null) return;
    const { onReady, ...rest } = options.current;
    const table = mountHitotsu(target, { ...rest, onMove: (game) => options.current.onMove?.(game) });
    onReady?.(table);
    return () => table.destroy();
  }, []);

  return <div ref={host} {...(element as HTMLAttributes<HTMLDivElement>)} />;
}
