import { QdrantClient } from "@qdrant/js-client-rest";
import { log } from "node:console";
import { QDRANT_API_KEY, QDRANT_URL } from "../config.js";
import type {
  ChunkMetadata,
  DocumentChunk,
  RetrievedChunk,
  SearchOptions,
  Vector,
} from "../types.js";
import type { VectorDB } from "./vector-db.js";

/** Points sent per upsert request. */
const UPSERT_BATCH_SIZE = 100;

export class QdrantVectorDB implements VectorDB {
  private readonly client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      url: QDRANT_URL,
      apiKey: QDRANT_API_KEY,
    });
  }

  async ensureCollection(collection: string, vectorSize: number) {
    if (await this.client.collectionExists(collection).then((r) => r.exists)) {
      return;
    }

    await this.client.createCollection(collection, {
      vectors: { size: vectorSize, distance: "Cosine" },
    });

    // Indexed so filtering by gym/document stays cheap as the collection grows.
    await this.client.createPayloadIndex(collection, {
      field_name: "gymId",
      field_schema: "keyword",
    });
    await this.client.createPayloadIndex(collection, {
      field_name: "documentId",
      field_schema: "keyword",
    });

    log(`Collection "${collection}" created.`);
  }

  async upsert(collection: string, chunks: DocumentChunk[]) {
    for (let i = 0; i < chunks.length; i += UPSERT_BATCH_SIZE) {
      const batch = chunks.slice(i, i + UPSERT_BATCH_SIZE);
      await this.client.upsert(collection, {
        wait: true,
        points: batch.map((chunk) => ({
          id: chunk.id,
          vector: chunk.vector,
          payload: { ...chunk.metadata },
        })),
      });
    }
  }

  async search(
    collection: string,
    vector: Vector,
    options: SearchOptions = {},
  ): Promise<RetrievedChunk[]> {
    const filter = buildFilter(options);

    const { points } = await this.client.query(collection, {
      query: vector,
      limit: options.limit ?? 3,
      with_payload: true,
      ...(filter && { filter }),
    });

    return points.map((point) => ({
      id: String(point.id),
      score: point.score,
      metadata: point.payload as unknown as ChunkMetadata,
    }));
  }
}

/** Translates our provider-agnostic options into a Qdrant payload filter. */
const buildFilter = ({ gymId, documentId }: SearchOptions) => {
  const must = [
    ...(gymId ? [{ key: "gymId", match: { value: gymId } }] : []),
    ...(documentId ? [{ key: "documentId", match: { value: documentId } }] : []),
  ];
  return must.length ? { must } : undefined;
};
