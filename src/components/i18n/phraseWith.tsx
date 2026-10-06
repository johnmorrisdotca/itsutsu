import { Fragment, type ReactNode } from "react";

/**
 * A phrase with a node where a placeholder was: a link where `{source}` is.
 *
 * `say` fills placeholders with text, and a sentence that has to hold a link or
 * a picture in the middle of it puts that piece wherever the reader's language
 * does. Asked with no value for the name, `say` hands the phrase back with the
 * placeholder standing, and this splits it around each one it was given a node
 * for.
 */
export function phraseWith(template: string, nodes: Readonly<Record<string, ReactNode>>): ReactNode {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const name = /^\{(\w+)\}$/.exec(part)?.[1];
    return <Fragment key={index}>{name !== undefined && name in nodes ? nodes[name] : part}</Fragment>;
  });
}
