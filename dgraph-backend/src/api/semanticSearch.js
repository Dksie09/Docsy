import express from "express";
import bodyParser from "body-parser";
import { performSemanticSearch } from "../embeddings/performSemanticSearch.js";
import cors from "cors";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(dirname(__dirname), '../.env') });
// Add this to semanticSearch.js after dotenv.config()
console.log('Environment variables loaded:', {
    HUGGINGFACE_TOKEN: process.env.HUGGINGFACE_TOKEN ? 'Set' : 'Not set',
    DGRAPH_ENDPOINT: process.env.DGRAPH_ENDPOINT ? 'Set' : 'Not set',
    PORT: process.env.PORT
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Semantic Search Endpoint
app.post("/api/semanticSearch", async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: "Query parameter is missing." });
    }

    try {
        const results = await performSemanticSearch(query);
        if (results.length === 0) {
            return res.json({ fallback: true, message: "No relevant data found in Dgraph." });
        }
        res.json(results);
    } catch (error) {
        console.error("Semantic search failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});