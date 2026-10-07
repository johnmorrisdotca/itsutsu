"use client";

import { useActionState, useId, useRef, useState } from "react";

import { askForInvite, issueInviteRequestStamp } from "@/app/join/askForInvite.actions";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { SITE_NAME } from "@/lib/i18n/siteName";
import { BUTTON_BASE, BUTTON_STRONG, INPUT_CLASS, PANEL_CLASS, TONE_CLASS } from "@/components/ui/ui.constants";
import { INVITE_REQUEST_FIELDS } from "./askForInvite.constants";
import type { AskForInviteState } from "./askForInvite.types";

const IDLE: AskForInviteState = { kind: "idle" };

/**
 * THE WAY IN FOR SOMEBODY WHO KNOWS NOBODY HERE.
 *
 * Folded under one line, because most people reaching /join have a code or a
 * Google account and should not have to read past a form to use it. Opened, it
 * asks three things — an address to answer, a name, a sentence — and sends
 * them to John (`askForInvite`). A native disclosure, so it opens before any
 * script has run and whether or not one ever does.
 *
 * `stamp` is when the page drew this form, signed; it is how a person is told
 * apart from a script without asking the person anything. Null where the site
 * has no secret to sign with, and the form is then not drawn at all — a form
 * whose every submission would be read as a bot is a form that lies.
 *
 * `stampOnOpen` is for the copy of the door a stranger is answered from, which
 * was drawn hours before anybody read it: its stamp would say the form was
 * drawn then, and the check that nobody sends faster than they can read would
 * always pass. So the stamp is asked for when the form is opened, which is
 * when it is drawn for somebody, and Send waits for it.
 */
export function AskForInvite({ stamp, open = false, stampOnOpen = false }: { stamp: string | null; open?: boolean; stampOnOpen?: boolean }) {
  const say = useSpeaker();
  const [state, send, sending] = useActionState(askForInvite, IDLE);
  const aboutHint = useId();
  // undefined: not asked for yet. null: asked, and the site has no secret to sign with.
  const [issued, setIssued] = useState<string | null | undefined>(undefined);
  const asked = useRef(false);
  const stampNow = stampOnOpen ? issued : stamp;
  if (stampNow === null) return null;

  function whenOpened(opened: boolean) {
    if (!stampOnOpen || !opened || asked.current) return;
    asked.current = true;
    void issueInviteRequestStamp().then(setIssued, () => {
      asked.current = false;
    });
  }

  return (
    <details
      className={`${PANEL_CLASS} w-full max-w-md`}
      open={open}
      data-testid="ask-for-invite"
      onToggle={(event) => whenOpened(event.currentTarget.open)}
    >
      <summary className="cursor-pointer text-sm font-medium" data-testid="ask-for-invite-open">
        {say.say("auth.ask.open")}
      </summary>
      {state.kind === "sent" ? (
        <p className={`mt-3 rounded-xl border px-3 py-2 text-sm ${TONE_CLASS.good}`} role="status" data-testid="ask-for-invite-sent">
          {state.message}
        </p>
      ) : (
        <form action={send} className="mt-3 flex flex-col gap-3" data-testid="ask-for-invite-form">
          <p className="text-sm text-muted">
            {say.say("auth.ask.lead", { site: SITE_NAME })}
          </p>
          <input type="hidden" name="stamp" value={stampNow ?? ""} />
          {/*
            THE FIELD NOBODY SEES. Off the screen rather than `display: none`,
            which form-filling scripts know to skip; out of the tab order and
            hidden from screen readers, so no person ever meets it. Anything
            typed here means a script typed it. See `readInviteRequest`.
          */}
          <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
            <label>
              {say.say("auth.ask.website")}
              <input type="text" name={INVITE_REQUEST_FIELDS.trap} tabIndex={-1} autoComplete="off" defaultValue="" />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-sm">{say.say("auth.ask.email")}</span>
            <input
              type="email"
              name="email"
              required
              maxLength={INVITE_REQUEST_FIELDS.emailLength}
              autoComplete="email"
              className={INPUT_CLASS}
              data-testid="ask-for-invite-email"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm">
              {say.say("auth.ask.name")} <span className="text-muted">{say.say("auth.ask.optional")}</span>
            </span>
            <input
              type="text"
              name="name"
              maxLength={INVITE_REQUEST_FIELDS.nameLength}
              autoComplete="name"
              className={INPUT_CLASS}
              data-testid="ask-for-invite-name"
            />
          </label>
          <div className="flex flex-col gap-1">
            <label className="flex flex-col gap-1">
              <span className="text-sm">
                {say.say("auth.ask.about")} <span className="text-muted">{say.say("auth.ask.optional")}</span>
              </span>
              <textarea
                name="about"
                rows={3}
                maxLength={INVITE_REQUEST_FIELDS.aboutLength}
                aria-describedby={aboutHint}
                className={INPUT_CLASS}
                data-testid="ask-for-invite-about"
              />
            </label>
            <span id={aboutHint} className="text-xs text-muted">
              {say.say("auth.ask.aboutHint")}
            </span>
          </div>
          {state.kind === "problem" ? (
            <p className={`rounded-xl border px-3 py-2 text-sm ${TONE_CLASS.warn}`} role="alert" data-testid="ask-for-invite-problem">
              {state.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={sending || stampNow === undefined}
            className={`${BUTTON_BASE} ${BUTTON_STRONG} w-full py-2`}
            data-testid="ask-for-invite-send"
          >
            {sending ? say.say("auth.ask.sending") : say.say("auth.ask.send")}
          </button>
        </form>
      )}
    </details>
  );
}
