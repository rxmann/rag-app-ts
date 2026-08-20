/**
 * Splits text into overlapping windows of roughly `size` characters.
 *
 * The window end is nudged back to the nearest sentence break (or failing that,
 * a space) so chunks don't stop mid-word. The overlap carries a little context
 * across the boundary, which stops an answer that straddles two chunks from
 * being lost. Deliberately the simple strategy - no token counting, no
 * structure awareness.
 */
export const chunkText = (
  text: string,
  size: number,
  overlap: number,
): string[] => {
  if (overlap >= size) {
    throw new Error("chunk overlap must be smaller than chunk size");
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = findBreakpoint(text, start, start + size);
    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end >= text.length) break;
    start = end - overlap;
  }

  return chunks;
};

/**
 * Looks for a sentence end, then any whitespace, in the last quarter of the
 * window. Falls back to a hard cut when the text has no usable break.
 */
const findBreakpoint = (text: string, start: number, end: number): number => {
  if (end >= text.length) return text.length;

  const earliest = start + Math.floor((end - start) * 0.75);
  const window = text.slice(earliest, end);

  const sentence = window.search(/[.!?]\s(?=[^\s])/);
  if (sentence !== -1) return earliest + sentence + 2;

  const space = window.lastIndexOf(" ");
  if (space !== -1) return earliest + space + 1;

  return end;
};
