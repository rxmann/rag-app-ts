import type {
  DocumentChunk,
  RetrievedChunk,
  SearchOptions,
  Vector,
} from "../types.js";

/**
 * The only vector-store operations this application needs. Nothing in here is
 * Qdrant-specific, so a FaissVectorDB can be added without touching the
 * ingestion or retrieval services.
 *
 * There is no connect()/getClient() on purpose: a client is a provider detail,
 * and every operation below is already self-contained.
 */
export interface VectorDB {
  /** Create the collection if it does not exist yet. Safe to call repeatedly. */
  ensureCollection(collection: string, vectorSize: number): Promise<void>;

  upsert(collection: string, chunks: DocumentChunk[]): Promise<void>;

  search(
    collection: string,
    vector: Vector,
    options?: SearchOptions,
  ): Promise<RetrievedChunk[]>;
}
