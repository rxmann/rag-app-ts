import { basename } from "node:path";
import { CHUNK_OVERLAP, CHUNK_SIZE } from "../config.js";
import type { Embedder } from "../embedding/embedder.js";
import type { ChunkMetadata, DocumentChunk } from "../types.js";
import { chunkText } from "../utils/chunking.js";
import { chunkId, documentIdFor } from "../utils/ids.js";
import { extractPdfPages, type PdfPage } from "../utils/pdf.js";
import type { VectorDB } from "../vector-db/vector-db.js";

export type IngestOptions = {
  gymId: string;
  /** Defaults to a stable id derived from the gym and filename. */
  documentId?: string;
};

export type IngestResult = {
  documentId: string;
  pageCount: number;
  chunkCount: number;
};

/**
 * PDF -> pages -> chunks -> embeddings -> vector database.
 *
 * Depends on the VectorDB and Embedder interfaces only, so swapping either
 * implementation leaves this class untouched.
 */
export class DocumentIngestionService {
  constructor(
    private readonly db: VectorDB,
    private readonly embedder: Embedder,
    private readonly collection: string,
  ) {}

  async ingestPdf(
    filePath: string,
    options: IngestOptions,
  ): Promise<IngestResult> {
    const pages = await extractPdfPages(filePath);
    const metadata = this.toChunkMetadata(pages, filePath, options);
    const chunks = await this.embed(metadata);
    await this.store(chunks);

    return {
      documentId: metadata[0]?.documentId ?? "",
      pageCount: pages.length,
      chunkCount: chunks.length,
    };
  }

  /** Splits each page and attaches the metadata we want to retrieve later. */
  private toChunkMetadata(
    pages: PdfPage[],
    filePath: string,
    { gymId, documentId }: IngestOptions,
  ): ChunkMetadata[] {
    const filename = basename(filePath);
    const docId = documentId ?? documentIdFor(gymId, filename);

    return pages.flatMap((page) =>
      chunkText(page.text, CHUNK_SIZE, CHUNK_OVERLAP).map((text, index) => ({
        documentId: docId,
        filename,
        gymId,
        pageNumber: page.pageNumber,
        chunkIndex: index,
        text,
      })),
    );
  }

  private async embed(metadata: ChunkMetadata[]): Promise<DocumentChunk[]> {
    const vectors = await this.embedder.embedDocuments(
      metadata.map((chunk) => chunk.text),
    );

    return metadata.map((chunk, index) => {
      const vector = vectors[index];
      if (!vector) {
        throw new Error(`Embedder returned no vector for chunk ${index}`);
      }
      return {
        id: chunkId(chunk.documentId, chunk.pageNumber, chunk.chunkIndex),
        vector,
        metadata: chunk,
      };
    });
  }

  private async store(chunks: DocumentChunk[]): Promise<void> {
    await this.db.ensureCollection(this.collection, this.embedder.dimensions);
    await this.db.upsert(this.collection, chunks);
  }
}
