import { log } from "node:console";
import { COLLECTION_NAME, EMBEDDING_PROVIDER, GYM_ID } from "./config.js";
import { createEmbedder } from "./embedding/embedder.js";
import { DocumentIngestionService } from "./services/document-ingestion-service.js";
import { QdrantVectorDB } from "./vector-db/qdrant-vector-db.js";

const PDF_PATH = "./assets/fitness-handbook.pdf";

/**
 * Ingestion is an explicit one-time operation - run it yourself with
 * `pnpm ingest`. Searching never triggers it.
 */
const main = async () => {
  const db = new QdrantVectorDB();
  const embedder = createEmbedder();
  const ingestion = new DocumentIngestionService(db, embedder, COLLECTION_NAME);

  log(`Ingesting ${PDF_PATH} (embeddings: ${EMBEDDING_PROVIDER})...`);
  const result = await ingestion.ingestPdf(PDF_PATH, { gymId: GYM_ID });

  log(
    `Done. ${result.chunkCount} chunks from ${result.pageCount} pages ` +
      `-> "${COLLECTION_NAME}" (documentId: ${result.documentId})`,
  );
};

main();
