"use client";

import dynamic from "next/dynamic";

/** Pachisi's table and My games card, loaded in the browser only, as Mexican Train's are (`trainClient.tsx`). */
export const PachisiTableClient = dynamic(() => import("./PachisiTable").then((module) => module.PachisiTable), {
  ssr: false,
  loading: () => <section className="min-h-[32rem]" data-testid="pachisi-table" data-ready="false" aria-busy="true" />,
});

export const PachisiCardClient = dynamic(() => import("./PachisiCard").then((module) => module.PachisiCard), { ssr: false });
