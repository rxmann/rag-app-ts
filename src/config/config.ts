import "dotenv/config";

/** Qdrant connection - unchanged from the original prototype. */
export const QDRANT_URL = process.env.QDRANT_URL as string;
export const QDRANT_API_KEY = process.env.QDRANT_API_KEY as string;

/**
 * One collection for the whole gym knowledge base. Gym and document identity
 * live in the payload, so multiple gyms can share it later.
 */
export const COLLECTION_NAME =
  process.env.QDRANT_COLLECTION ?? "gym_knowledge_base";

/**
 * "local"  - embed with fastembed in this process (dense vectors, works with any VectorDB)
 * "qdrant" - let Qdrant Cloud embed server-side (what the prototype did)
 *
 * Both use all-MiniLM-L6-v2 at 384 dimensions, so they are interchangeable
 * against the same collection.
 */
export const EMBEDDING_PROVIDER = (process.env.EMBEDDING_PROVIDER ?? "local") as
  | "local"
  | "qdrant";

export const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
export const VECTOR_SIZE = 384;

/** Which gym the ingested documents belong to. */
export const GYM_ID = process.env.GYM_ID ?? "demo-gym";

/** Characters per chunk, and how much neighbouring chunks overlap. */
export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 150;
