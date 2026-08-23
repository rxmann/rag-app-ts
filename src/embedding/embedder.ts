import { EMBEDDING_PROVIDER } from "../config/config.js";
import type { Vector } from "../types/types.js";
import { LocalEmbedder } from "./local-embedder.js";
import { QdrantInferenceEmbedder } from "./qdrant-inference-embedder.js";

/**
 * Turns text into something a VectorDB can store or search with.
 *
 * Documents and queries are separate methods because some models want different
 * prefixes for each ("passage: ..." vs "query: ...").
 */
export interface Embedder {
  readonly dimensions: number;
  embedDocuments(texts: string[]): Promise<Vector[]>;
  embedQuery(text: string): Promise<Vector>;
}

/** Plain switch, not a factory pattern - just keeps the choice in one place. */
export const createEmbedder = (): Embedder =>
  EMBEDDING_PROVIDER === "qdrant"
    ? new QdrantInferenceEmbedder()
    : new LocalEmbedder();
