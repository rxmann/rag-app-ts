import {log} from "node:console";
import {COLLECTION_NAME, EMBEDDING_PROVIDER} from "./config/config.js";
import {createEmbedder} from "./embedding/embedder.js";
import {RetrievalService} from "./services/retrieval-service.js";
import {QdrantVectorDB} from "./vector-db/qdrant-vector-db.js";
import {createLLM} from "./llm/create-llm.js";
import {RagService} from "./services/rag-service.js";

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

    log(`Query: "${query}" (embeddings: ${EMBEDDING_PROVIDER})`);
    const answer = await new RagService(retrieval, createLLM()).answer(query);
    log(JSON.stringify(answer, null, 2));
};

main();
