/**
 * A vector to store or search with.
 *
 * Either a dense vector we computed ourselves, or a request for the provider to
 * embed the text server-side (Qdrant Cloud inference). Providers that cannot
 * embed - Faiss, for example - only accept the dense form.
 */
export type Vector = number[] | ServerSideInference;

export type ServerSideInference = {
  text: string;
  model: string;
};

export const isDenseVector = (vector: Vector): vector is number[] =>
  Array.isArray(vector);

/** Everything we know about a chunk, stored as the payload alongside its vector. */
export type ChunkMetadata = {
  documentId: string;
  filename: string;
  /** Tenant. One collection holds many gyms; this is how we tell them apart. */
  gymId: string;
  pageNumber: number;
  chunkIndex: number;
  text: string;
};

/** A chunk ready to be written to a vector database. */
export type DocumentChunk = {
  id: string;
  vector: Vector;
  metadata: ChunkMetadata;
};

/** A chunk read back out of a vector database. */
export type RetrievedChunk = {
  id: string;
  score: number;
  metadata: ChunkMetadata;
};

export type SearchOptions = {
  limit?: number;
  gymId?: string;
  documentId?: string;
};
