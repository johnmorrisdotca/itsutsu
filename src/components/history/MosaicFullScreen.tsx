"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * A WALLPAPER AT THE SIZE OF THE SCREEN. John, 2026-10-02, on a solved Meikyuu
 * level's wallpaper window: "They should be able to see full screen the game
 * they played because it's a pretty image." The window beside it holds the
 * picture small, with its choices; this is the picture itself, edge to edge on
 * a dark ground, the shape it is saved in, with Download and Close beside it
 * and nothing else.
 *
 * A <dialog> opened with `showModal`, so Esc closes it (and only it, when it
 * stands over the window it was opened from). The picture is left to the
 * browser's own pinch and scroll (`touch-action`), never to a script of ours:
 * a phone's pinch zooms the page, and a zoomed picture can be panned.
 *
 * Mounted only while open, by the panel that holds the picture.
 */
export function MosaicFullScreen({ url, alt, shape, onClose, children }: { url: string; alt: string; shape: string; onClose: () => void; children: ReactNode }) {
  const say = useSpeaker();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (element !== null && !element.open) element.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      // Closing is ours to do: left to the browser, one Escape can close this and the window under it together.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-label={alt}
      className="fixed inset-0 m-0 flex h-dvh max-h-none w-dvw max-w-none flex-col overflow-hidden border-0 bg-[#0f0c09] p-0 text-ivory backdrop:bg-black"
      data-testid="mosaic-full"
    >
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-2 [touch-action:pan-x_pan-y_pinch-zoom]">
        {/* eslint-disable-next-line @next/next/no-img-element -- a picture made in this browser a moment ago */}
        <img src={url} alt={alt} className="h-full w-full object-contain" data-testid="mosaic-full-picture" data-shape={shape} />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-white/15 bg-black/60 px-3 py-2 text-sm" data-testid="mosaic-full-controls">
        {children}
        <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-white/40 px-4 font-semibold text-ivory hover:bg-white/10" data-testid="mosaic-full-close">
          {say.say("mosaic.close")} <span aria-hidden="true">×</span>
        </button>
      </div>
    </dialog>
  );
}
