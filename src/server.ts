import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import {COLLECTION_NAME} from "./config/config.js";
import {createEmbedder} from "./embedding/embedder.js";
import {RetrievalService} from "./services/retrieval-service.js";
import {QdrantVectorDB} from "./vector-db/qdrant-vector-db.js";
import {createLLM} from "./llm/create-llm.js";
import {RagService} from "./services/rag-service.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, '../public')));

const db = new QdrantVectorDB();
const retrieval = new RetrievalService(db, createEmbedder(), COLLECTION_NAME);
const ragService = new RagService(retrieval, createLLM());

app.post('/api/rag/query', async (req, res) => {
    const { query } = req.body;

    if (typeof query !== 'string' || query.trim() === '') {
        return res.status(400).json({ error: 'Query must be a non-empty string' });
    }

    if (query.length > 2000) {
        return res.status(400).json({ error: 'Query too long' });
    }

    try {
        const result = await ragService.answer(query);
        res.json({
            answer: result.answer,
            sources: result.sources
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
