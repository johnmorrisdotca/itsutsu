import { createElement, Fragment, type ReactNode } from "react";

/**
 * A sentence with links or styled figures standing where its `{names}` are.
 *
 * `say(key, vars)` fills a placeholder with text, which is no use where the
 * thing that belongs there is a link or a styled number: the sentence has to
 * stay ONE phrase, because the reader's language decides where the link falls
 * ("level 5, Joystick, is where you are" and "あなたはレベル5にいます" put it
 * in different places). This splits the translated sentence at each
 * `{placeholder}` and puts the node in its place, and leaves a name nobody
 * supplied standing as it is written, which is a bug that reads as a bug.
 *
 * Pure and free of the DOM, so a server page and a client component both use it.
 */
export function weave(template: string, parts: Readonly<Record<string, ReactNode>>): ReactNode {
  return template.split(/(\{\w+\})/g).map((piece, index) => {
    const name = /^\{(\w+)\}$/.exec(piece)?.[1];
    const node = name !== undefined && Object.hasOwn(parts, name) ? parts[name] : piece;
    return node === "" ? null : createElement(Fragment, { key: index }, node);
  });
}
