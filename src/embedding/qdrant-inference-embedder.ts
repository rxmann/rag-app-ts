import { EMBEDDING_MODEL, VECTOR_SIZE } from "../config.js";
import type { Vector } from "../types.js";
import type { Embedder } from "./embedder.js";

/**
 * Defers embedding to Qdrant Cloud's built-in inference: instead of a dense
 * vector we hand the VectorDB the text and the model name, and Qdrant embeds it
 * server-side. This is what the original prototype did.
 *
 * Nothing here touches the network. Only works with providers that can embed -
 * a local Faiss index would need LocalEmbedder instead.
 */
export class QdrantInferenceEmbedder implements Embedder {
  readonly dimensions = VECTOR_SIZE;

  async embedDocuments(texts: string[]): Promise<Vector[]> {
    return texts.map((text) => ({ text, model: EMBEDDING_MODEL }));
  }

  async embedQuery(text: string): Promise<Vector> {
    return { text, model: EMBEDDING_MODEL };
  }
}
