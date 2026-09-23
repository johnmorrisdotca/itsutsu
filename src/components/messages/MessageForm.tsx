"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Controls";
import { MESSAGE_TEXT_MAX } from "@/lib/messages/messages.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { MESSAGE_COPY } from "./messages.constants";

/**
 * The line to write in, under a conversation. Sends, then asks the page again
 * for the thread — one request each way, and nothing polled: a reply from the
 * other side arrives in their inbox and in this thread when it is next opened.
 */
export function MessageForm({ to }: { to: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [trouble, setTrouble] = useState<string | null>(null);

  async function send() {
    if (text.trim() === "") return;
    setBusy(true);
    setTrouble(null);
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, text }),
    });
    setBusy(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setTrouble(body?.error ?? MESSAGE_COPY.failed);
      return;
    }
    setText("");
    router.refresh();
  }

  return (
    <form
      className="flex flex-col gap-2"
      data-testid="message-form"
      {...readyMark(hydrated)}
      onSubmit={(event) => {
        event.preventDefault();
        void send();
      }}
    >
      <textarea
        value={text}
        maxLength={MESSAGE_TEXT_MAX}
        rows={3}
        placeholder={MESSAGE_COPY.placeholder}
        disabled={busy}
        onChange={(event) => setText(event.target.value)}
        className="w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm"
        data-testid="message-text"
      />
      {trouble !== null ? (
        <p className="text-xs text-shu" role="alert" data-testid="message-trouble">
          {trouble}
        </p>
      ) : null}
      <div className="flex">
        <Button onClick={() => void send()} disabled={busy || text.trim() === ""} strong data-testid="message-send">
          {MESSAGE_COPY.send}
        </Button>
      </div>
    </form>
  );
}
