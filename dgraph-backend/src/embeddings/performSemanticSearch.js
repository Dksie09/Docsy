import { generateEmbedding } from "./generateEmbedding.js";
import { queryDgraph } from "../dgraph/queryDgraph.js";

// export async function performSemanticSearch(query) {
//     try {
//         const embedding = await generateEmbedding(query);
//         const results = await queryDgraph(embedding);

//         return results.map((page) => ({
//             title: page.title,
//             url: page.url,
//             snippet: page.content?.slice(0, 200) || "No content available.",
//         }));
//     } catch (error) {
//         console.error("Error in performSemanticSearch:", error);
//         throw new Error("Semantic search failed.");
//     }
// }

export async function performSemanticSearch(query) {
    try {
        // For now, we'll skip the embedding generation
        const results = await queryDgraph(query);

        return results.map((page) => ({
            title: page.title,
            url: page.url,
            snippet: page.content?.slice(0, 200) || "No content available.",
        }));
    } catch (error) {
        console.error("Error in performSemanticSearch:", error);
        throw new Error("Semantic search failed.");
    }
}