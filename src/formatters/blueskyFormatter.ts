const MAX_GRAPHEMES = 300;
const segmenter = new Intl.Segmenter();

export function formatBluesky(raw: string): string {
  const trimmed = raw.trim();
  const graphemes = [...segmenter.segment(trimmed)];
  if (graphemes.length <= MAX_GRAPHEMES) return trimmed;
  return graphemes.slice(0, MAX_GRAPHEMES).map((s) => s.segment).join('');
}
