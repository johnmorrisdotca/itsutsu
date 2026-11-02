"use client";

import type { ComponentProps } from "react";

import { useRevealOnMount } from "./useRevealOnMount";

/** A `div` that is scrolled into view when it appears, for a result drawn under a board (`useRevealOnMount` says why). */
export function RevealOnMount(props: ComponentProps<"div">) {
  const ref = useRevealOnMount<HTMLDivElement>();
  return <div ref={ref} {...props} />;
}
