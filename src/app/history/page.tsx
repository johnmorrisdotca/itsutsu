import { RecordPage } from "@/components/history/RecordPage";

export const metadata = {
  title: "Record 棋譜",
  description: "Every game played, with the stones in the order they were laid.",
};

/** The whole record. */
export default async function HistoryPage({ searchParams }: PageProps<"/history">) {
  return <RecordPage params={await searchParams} />;
}
