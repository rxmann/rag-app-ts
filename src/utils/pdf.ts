import { readFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist";

export type PdfPage = {
  pageNumber: number;
  text: string;
};

/**
 * Extracts text from a PDF one page at a time, so chunks can keep a page
 * number. Pages with no extractable text (images, blank pages) are skipped.
 */
export const extractPdfPages = async (filePath: string): Promise<PdfPage[]> => {
  const file = await readFile(filePath);
  const pdf = await getDocument({
    data: new Uint8Array(file),
    // Node has no DOM; these keep pdfjs from reaching for browser-only bits.
    isEvalSupported: false,
    useSystemFonts: false,
  }).promise;

  const pages: PdfPage[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    const text = normaliseWhitespace(
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" "),
    );

    if (text) pages.push({ pageNumber, text });
  }

  await pdf.destroy();
  return pages;
};

const normaliseWhitespace = (text: string) =>
  text.replace(/\s+/g, " ").trim();
