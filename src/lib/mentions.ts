// Matches @username tokens: start of string or whitespace, then @ followed by
// 2-32 username characters. Avoids matching the @ inside email addresses.
const MENTION_PATTERN = /(?:^|\s)@([A-Za-z0-9._-]{2,32})/g;

export const EVERYONE_MENTION = "everyone";

export function extractMentionTokens(content: string | null | undefined): string[] {
  if (!content) return [];
  const tokens = new Set<string>();
  for (const match of content.matchAll(MENTION_PATTERN)) {
    tokens.add(match[1].toLowerCase());
  }
  return [...tokens];
}

/** Splits text into plain and mention chunks for safe rendering. */
export function splitMentionParts(content: string): Array<{ text: string; mention: boolean }> {
  const parts: Array<{ text: string; mention: boolean }> = [];
  let lastIndex = 0;
  const pattern = /(?:^|\s)@([A-Za-z0-9._-]{2,32})/g;
  for (const match of content.matchAll(pattern)) {
    const atIndex = (match.index ?? 0) + match[0].indexOf("@");
    if (atIndex > lastIndex) {
      parts.push({ text: content.slice(lastIndex, atIndex), mention: false });
    }
    parts.push({ text: `@${match[1]}`, mention: true });
    lastIndex = atIndex + 1 + match[1].length;
  }
  if (lastIndex < content.length) {
    parts.push({ text: content.slice(lastIndex), mention: false });
  }
  return parts.length ? parts : [{ text: content, mention: false }];
}
