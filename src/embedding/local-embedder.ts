import { EmbeddingModel, FlagEmbedding } from "fastembed";
import { VECTOR_SIZE } from "../config.js";
import type { Vector } from "../types.js";
import type { Embedder } from "./embedder.js";

const EMBED_BATCH_SIZE = 32;

/**
 * Embeds locally with fastembed (all-MiniLM-L6-v2, 384 dimensions) and returns
 * dense vectors, so the pipeline stays provider-agnostic.
 *
 * The model is ~90MB and downloaded into ./local_cache on first use.
 */
export class LocalEmbedder implements Embedder {
  readonly dimensions = VECTOR_SIZE;

  private model?: FlagEmbedding;

  async embedDocuments(texts: string[]): Promise<Vector[]> {
    const model = await this.getModel();

    const vectors: Vector[] = [];
    for await (const batch of model.passageEmbed(texts, EMBED_BATCH_SIZE)) {
      vectors.push(...batch.map((vector) => Array.from(vector)));
    }
    return vectors;
  }

  async embedQuery(text: string): Promise<Vector> {
    const model = await this.getModel();
    return model.queryEmbed(text);
  }

  /** Loaded once, on first use - initialisation downloads and warms the model. */
  private async getModel(): Promise<FlagEmbedding> {
    this.model ??= await FlagEmbedding.init({
      model: EmbeddingModel.AllMiniLML6V2,
      showDownloadProgress: true,
    });
    return this.model;
  }
}
