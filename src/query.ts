import {log} from "node:console";
import {COLLECTION_NAME, EMBEDDING_PROVIDER, GYM_ID} from "./config/config.js";
import {createEmbedder} from "./embedding/embedder.js";
import {RetrievalService} from "./services/retrieval-service.js";
import {QdrantVectorDB} from "./vector-db/qdrant-vector-db.js";

/** Retrieval smoke test: pnpm query "how many rest days should I take" */
const main = async () => {
    const query = process.argv.slice(2).join(" ");
    if (!query) {
        log('Usage: pnpm query "your question"');
        process.exitCode = 1;
        return;
    }

    const db = new QdrantVectorDB();
    const retrieval = new RetrievalService(db, createEmbedder(), COLLECTION_NAME);

    log(`Query: "${query}" (embeddings: ${EMBEDDING_PROVIDER})\n`);
    const chunks = await retrieval.retrieve(query, {limit: 3});

    if (!chunks.length) {
        log("No results. Has the PDF been ingested? Run `pnpm ingest` first.");
        return;
    }

    for (const chunk of chunks) {
        const meta = chunk.metadata;
        log(`[score ${chunk.score.toFixed(3)}] ${meta.item_name ?? "Item"} (${meta.category ?? "General"}) - ${meta.price ?? ""}`);
        log(`${meta.description ?? meta.text}\n`);
    }
};

main();
