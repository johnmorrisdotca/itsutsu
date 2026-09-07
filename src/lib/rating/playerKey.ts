/** The name as compared: trimmed, lower case, inner whitespace collapsed. Shared by server and client. */
export function playerKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
