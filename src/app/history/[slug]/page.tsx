import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { variantFor } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { RecordPage } from "../RecordPage";

export async function generateMetadata({ params }: PageProps<"/history/[slug]">): Promise<Metadata> {
  const variant = variantFor((await params).slug);
  return {
    title: variant === null ? "Record 棋譜" : `${RULE_VARIANT_DISPLAY[variant].label} · Record 棋譜`,
  };
}

/** One game's record: every finished game of that kind. */
export default async function GameRecordPage({ params, searchParams }: PageProps<"/history/[slug]">) {
  const variant = variantFor((await params).slug);
  if (variant === null) notFound();
  return <RecordPage variant={variant} params={await searchParams} />;
}
