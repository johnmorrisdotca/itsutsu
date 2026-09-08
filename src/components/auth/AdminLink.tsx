"use client";

import Link from "next/link";
import useSWR from "swr";

const fetcher = async (url: string): Promise<{ admin: boolean } | null> => {
  const response = await fetch(url);
  return response.ok ? response.json() : null;
};

/** A link to /admin, shown to the operator only. Everyone else sees nothing here. */
export function AdminLink({ initial }: { initial: { admin: boolean } }) {
  const { data } = useSWR("/api/session", fetcher, { fallbackData: initial });
  if (data?.admin !== true) return null;
  return (
    <Link href="/admin" className="whitespace-nowrap hover:underline underline-offset-4" data-testid="admin-link">
      Admin <span className="font-mincho text-muted">管理</span>
    </Link>
  );
}
