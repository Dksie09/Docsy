import { HfInference } from "@huggingface/inference";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(dirname(__dirname), '../.env') });

// Check if token is available
if (!process.env.HUGGINGFACE_TOKEN) {
    console.error("Hugging Face token is missing. Please set HUGGINGFACE_TOKEN in .env file.");
    process.exit(1);
}

const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);

export async function generateEmbedding(text) {
    try {
        const embedding = await hf.featureExtraction({
            model: 'sentence-transformers/all-MiniLM-L6-v2',
            inputs: text
        });
        return embedding;
    } catch (error) {
        console.error("Embedding generation failed:", error);
        throw new Error("Failed to generate embedding: " + error.message);
    }
}