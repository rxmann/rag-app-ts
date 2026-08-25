import "dotenv/config";
import Groq from "groq-sdk";
import {GroqLLM} from "./groq-llm.js";
import type {LLM} from "./llm.types.js";

export const createLLM = (): LLM => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY is required to use the Groq LlmTypes");
    }

    return new GroqLLM(
        new Groq({
            apiKey,
        }),
        process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    );
};
