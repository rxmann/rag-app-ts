import type {Embedder} from "../embedding/embedder.js";
import type {RetrievedChunk, SearchOptions} from "../types/vector-types.js";
import type {VectorDB} from "../vector-db/vector-db.js";

/**
 * query -> embedding -> VectorDB.search() -> RetrievedChunk[]
 *
 * The retrieval half of RAG, and nothing more. Whatever generates an answer from
 * these chunks sits on top of this - it does not belong in here.
 */
export class RetrievalService {
    constructor(
        private readonly db: VectorDB,
        private readonly embedder: Embedder,
        private readonly collection: string,
    ) {
    }

    async retrieve(
        query: string,
        options: SearchOptions = {},
    ): Promise<RetrievedChunk[]> {
        const vector = await this.embedder.embedQuery(query);
        return this.db.search(this.collection,
            vector,
            options
        );
    }
}
