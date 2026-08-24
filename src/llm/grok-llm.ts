import Groq from "groq-sdk";
import type {LLM, LLMRequest, LLMResponse, StructuredLLMRequest} from "./llm.types.js";

export class GroqLLM implements LLM {
    constructor(
        private readonly client: Groq,
        private readonly model: string,
    ) {}

    async generate(request: LLMRequest): Promise<LLMResponse> {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                ...(request.system
                    ? [{role: "system" as const, content: request.system}]
                    : []),
                {
                    role: "user" as const,
                    content: request.prompt,
                },
            ],
        });

        return {
            text: response.choices[0]?.message?.content ?? "",
        };
    }

    async generateStructured<T>(request: StructuredLLMRequest): Promise<T> {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                ...(request.system ? [{role: "system" as const, content: request.system}] : []),
                {role: "user" as const, content: request.prompt},
            ],
            temperature: 0,
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: request.schemaName,
                    strict: true,
                    schema: request.schema,
                },
            },
        });

        const text = response.choices[0]?.message?.content;
        if (!text) {
            throw new Error("Groq returned an empty structured response");
        }

        try {
            return JSON.parse(text) as T;
        } catch (error) {
            throw new Error("Groq returned invalid JSON", {cause: error});
        }
    }
}
