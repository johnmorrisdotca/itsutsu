"use client";

import Link from "next/link";
import useSWR from "swr";

import { useSpeaker } from "@/components/i18n/LocaleProvider";

const fetcher = async (url: string): Promise<{ admin: boolean } | null> => {
  const response = await fetch(url);
  return response.ok ? response.json() : null;
};

/** A link to /admin, shown to the operator only. Everyone else sees nothing here. */
export function AdminLink({ initial }: { initial: { admin: boolean } }) {
  const { data } = useSWR("/api/session", fetcher, { fallbackData: initial });
  const say = useSpeaker();
  if (data?.admin !== true) return null;
  return (
    <Link href="/admin" className="whitespace-nowrap hover:underline underline-offset-4" data-testid="admin-link">
      {/*
        No kanji in the navigation. John: "fine drop them all now" — the bar
        reads in one language, so this reads Admin like everything beside it.
        The Admin PAGE keeps its 管理 in its own heading, which is a different
        thing and was not what he asked about.

        Which is why this is `say` and not `Paired`. A Japanese reader gets
        管理 as the whole label, an English reader gets Admin — one word each,
        no pairing either way. That is the bar reading in one language, kept
        for both of them, rather than the kanji creeping back in beside the
        English on the one link that used to carry it.
      */}
      {say.say("nav.admin")}
    </Link>
  );
}
