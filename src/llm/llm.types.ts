/** Public LlmTypes contracts, kept as a convenient import for provider adapters. */
export interface LLM {
    generate(request: LLMRequest): Promise<LLMResponse>;
    generateStructured<T>(request: StructuredLLMRequest): Promise<T>;
}

export interface LLMRequest {
    system?: string;
    prompt: string;
}

export type JsonSchema = Record<string, unknown>;

export interface StructuredLLMRequest extends LLMRequest {
    schema: JsonSchema;
    schemaName: string;
}

export interface LLMResponse {
    text: string;
}


// --rag service
export type RagSource = {
    filename: string;
    pageNumber: number | null;
    chunkIndex: number | null;
};

export type RagAnswer = {
    answer: string;
    confidence: "high" | "medium" | "low";
    sources: RagSource[];
};

export const ANSWER_SCHEMA = {
    type: "object",
    additionalProperties: false,
    properties: {
        answer: {type: "string"},
        confidence: {type: "string", enum: ["high", "medium", "low"]},
        sources: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    filename: {type: "string"},
                    pageNumber: {type: ["integer", "null"]},
                    chunkIndex: {type: ["integer", "null"]},
                },
                required: ["filename", "pageNumber", "chunkIndex"],
            },
        },
    },
    required: ["answer", "confidence", "sources"],
} as const;