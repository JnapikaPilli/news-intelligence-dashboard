/**
 * Strips citation tags, XML artifacts, and footnote markers
 * that Claude sometimes includes in generated summaries.
 */
export function cleanSummary(text) {
  if (!text) return "";
  return text
    .replace(/]*>/gi, "")           // opening <cite ...> tags
    .replace(/<\/antml:cite>/gi, "")               // closing </cite> tags
    .replace(/<[^>]+>/g, "")                   // any remaining HTML/XML tags
    .replace(/\[\d+(?:[-,]\d+)*\]/g, "")       // [1], [2-3], [1,2] footnote markers
    .replace(/\s{2,}/g, " ")                   // collapse double spaces
    .trim();
}
