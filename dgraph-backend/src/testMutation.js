import fetch from "node-fetch";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Setup dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

async function addTestData() {
    const mutation = `
        mutation {
            addPage(input: [
                {
                    title: "GraphQL Basics",
                    url: "https://test.docs/graphql-basics",
                    content: "GraphQL is a query language for APIs and a runtime for fulfilling those queries with your existing data. GraphQL provides a complete and understandable description of the data in your API.",
                    embedding: [0.1, 0.2, 0.3]
                },
                {
                    title: "REST API Documentation",
                    url: "https://test.docs/rest-api",
                    content: "REST APIs are a way to create web services that are lightweight, maintainable, and scalable. A REST API is based on REST (Representational State Transfer) architecture.",
                    embedding: [0.2, 0.3, 0.4]
                }
            ]) {
                numUids
                page {
                    id
                    title
                    url
                }
            }
        }
    `;

    try {
        const response = await fetch(process.env.DGRAPH_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.DGRAPH_TOKEN}`
            },
            body: JSON.stringify({ query: mutation }),
        });

        const result = await response.json();
        console.log("Mutation result:", JSON.stringify(result, null, 2));

        if (result.errors) {
            console.error("Mutation errors:", result.errors);
        } else {
            console.log("Successfully added test pages!");
        }
    } catch (error) {
        console.error("Mutation failed:", error);
    }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    addTestData().then(() => process.exit());
}