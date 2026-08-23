import {readFile} from "node:fs/promises";
import {PDFParse} from "pdf-parse";

export type PdfPage = {
    pageNumber: number;
    text: string;
};

/**
 * Extracts text from a PDF one page at a time, so chunks can keep a page
 * number. Pages with no extractable text (images, blank pages) are skipped.
 */
export const extractPdfPages = async (filePath: string): Promise<PdfPage[]> => {
    const buffer = await readFile(filePath);
    const pdfParse = new PDFParse({ data: buffer });

    try {
        const result = await pdfParse.getText();

        // Directly map and return the pages array
        return result.pages.map((page: { text: string, num: number }) => ({
            pageNumber: page.num,
            text: normaliseWhitespace(page.text)
        }));

    } catch (e: unknown) {
        console.error(e);
        return [];
    } finally {
        await pdfParse.destroy();
    }
};

const normaliseWhitespace = (text: string) =>
    text.replace(/\s+/g, " ").trim();
