/**
 * Returns the input URL only if it uses an http(s) scheme.
 * Otherwise returns "#" to prevent javascript:/data:/vbscript: injection.
 */
export function safeExternalHref(url: string | null | undefined): string {
  if (!url) return "#";
  try {
    const u = new URL(url, "https://placeholder.invalid");
    if (u.protocol === "http:" || u.protocol === "https:") return url;
  } catch {
    // fallthrough
  }
  return "#";
}
