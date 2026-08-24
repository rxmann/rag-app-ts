import type {RetrievedChunk} from "../types/vector-types.js";
import {RetrievalService} from "./retrieval-service.js";
import {ANSWER_SCHEMA, type LLM, type RagAnswer} from "../llm/llm.types.js";
import {log} from "node:console";


export class RagService {
    constructor(
        private readonly retrieval: RetrievalService,
        private readonly llm: LLM,
    ) {
    }

    async answer(query: string, limit = 5): Promise<RagAnswer> {
        const chunks = await this.retrieval.retrieve(query, {limit});
        const context = chunks.map(formatChunk).join("\n\n");
        log(`Context: ${context}`)

        return this.llm.generateStructured<RagAnswer>({
            schemaName: "rag_answer",
            schema: ANSWER_SCHEMA,
            system: "You answer questions using only the supplied context. If the context does not contain the answer, say so clearly. Cite only sources present in the context. Return concise, useful answers.",
            prompt: `Question:\n${query}\n\nContext:\n${context || "No relevant context was found."}`,
        });
    }
}

const formatChunk = (chunk: RetrievedChunk): string => {
    const {filename, pageNumber, chunkIndex, text} = chunk.metadata;
    return `[source: ${filename}; page: ${pageNumber ?? "unknown"}; chunk: ${chunkIndex ?? "unknown"}; score: ${chunk.score.toFixed(3)}]\n${text}`;
};
