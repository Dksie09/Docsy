import fetch from "node-fetch";

const DGRAPH_GRAPHQL_ENDPOINT = process.env.DGRAPH_ENDPOINT ||
    "https://blue-surf-1350041.us-east-1.aws.cloud.dgraph.io/graphql";

export async function queryDgraph(query) {
    // Convert embedding to text search for now
    const searchQuery = `
        query SearchPages($searchTerm: String!) {
            queryPage(filter: { 
                or: [
                    { title: { anyofterms: $searchTerm }},
                    { content: { alloftext: $searchTerm }}
                ]
            }, first: 5) {
                title
                url
                content
            }
        }
    `;

    try {
        const response = await fetch(DGRAPH_GRAPHQL_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.DGRAPH_TOKEN}`
            },
            body: JSON.stringify({
                query: searchQuery,
                variables: {
                    searchTerm: query  // Using the raw query text instead of embedding
                }
            }),
        });

        const result = await response.json();
        if (result.errors) {
            console.error("Dgraph query errors:", result.errors);
            throw new Error("Failed to fetch results from Dgraph.");
        }

        return result.data?.queryPage || [];
    } catch (error) {
        console.error("Dgraph query failed:", error);
        throw error;
    }
}