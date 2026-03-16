const MAX_CHARS = 3000;

export function formatLinkedIn(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.length > MAX_CHARS ? trimmed.slice(0, MAX_CHARS) : trimmed;
}
