import { createHash } from "node:crypto";

/**
 * Qdrant point ids must be an unsigned integer or a UUID, so we derive a
 * deterministic UUID from the chunk's identity. Re-ingesting the same PDF then
 * overwrites the same points instead of duplicating them.
 */
export const chunkId = (
  documentId: string,
  pageNumber: number,
  chunkIndex: number,
): string => uuidFromString(`${documentId}:${pageNumber}:${chunkIndex}`);

/** Stable id for a document, derived from its filename and owning gym. */
export const documentIdFor = (gymId: string, filename: string): string =>
  uuidFromString(`${gymId}:${filename}`);

/** A UUID-shaped hash. Not a real v5 UUID - the shape is what Qdrant needs. */
const uuidFromString = (value: string): string => {
  const hex = createHash("sha1").update(value).digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
};
