export interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

const URL_PATTERN = /https?:\/\/[^\s<>"'`]+/i;
const MAX_HTML_BYTES = 300_000;
const FETCH_TIMEOUT_MS = 4_000;

export function extractFirstUrl(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = text.match(URL_PATTERN);
  return match ? match[0].replace(/[),.;!?]+$/, "") : null;
}

function isPrivateIp(address: string) {
  if (address === "::1" || address === "0:0:0:0:0:0:0:1") return true;
  if (address.startsWith("fe80:") || address.startsWith("fc") || address.startsWith("fd")) {
    return true;
  }
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

async function assertPublicUrl(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Unsupported protocol");
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("Private host");
  }

  const { lookup } = await import("node:dns/promises");
  const results = await lookup(hostname, { all: true });
  if (!results.length || results.some((result) => isPrivateIp(result.address))) {
    throw new Error("Private address");
  }
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function readMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["'][^>]*>`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeEntities(match[1]);
  }
  return null;
}

function readTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1] ? decodeEntities(match[1].replace(/\s+/g, " ")) : null;
}

function resolveImage(image: string | null, base: URL): string | null {
  if (!image) return null;
  try {
    const resolved = new URL(image, base);
    return resolved.protocol === "http:" || resolved.protocol === "https:"
      ? resolved.toString()
      : null;
  } catch {
    return null;
  }
}

/**
 * Best-effort OpenGraph scraper for the first URL in a message.
 * Never throws; returns null on any failure so message sending is unaffected.
 * Blocks localhost/private addresses to avoid SSRF from user-supplied links.
 */
export async function buildLinkPreview(
  text: string | null | undefined
): Promise<LinkPreview | null> {
  const rawUrl = extractFirstUrl(text);
  if (!rawUrl) return null;

  let url: URL;
  try {
    url = new URL(rawUrl);
    await assertPublicUrl(url);
  } catch {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "ChatMeetBot/1.0 (+link-preview)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;

    const html = (await response.text()).slice(0, MAX_HTML_BYTES);

    const title =
      readMeta(html, "og:title") ??
      readMeta(html, "twitter:title") ??
      readTitle(html);
    const description =
      readMeta(html, "og:description") ??
      readMeta(html, "twitter:description") ??
      readMeta(html, "description");
    const image = resolveImage(
      readMeta(html, "og:image") ?? readMeta(html, "twitter:image"),
      url
    );
    const siteName = readMeta(html, "og:site_name") ?? url.hostname;

    if (!title && !description && !image) return null;

    return {
      url: url.toString(),
      title: title?.slice(0, 300) ?? null,
      description: description?.slice(0, 500) ?? null,
      image,
      siteName: siteName?.slice(0, 120) ?? null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
