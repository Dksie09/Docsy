import fetch from "node-fetch";
import { DocumentationLink } from "../classes";
import { JSON } from "json-as";

export async function fetchDgraphLinks(
  baseUrl: string,
  query: string,
): DocumentationLink[] {
  const DGRAPH_API = "http://localhost:3001/api/semanticSearch";

  try {
    const response = await fetch(DGRAPH_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (errorText.includes("daily limit")) {
        console.warn("Dgraph rate limit reached. Falling back to Modus AI.");
      } else {
        console.error(errorText);
      }
      return []; // Fallback to an empty array if Dgraph fails
    }

    const data = await response.json();
    return data.map((link: any) => ({
      title: link.title || "Untitled",
      url: link.url,
      snippet: link.snippet || "",
    }));
  } catch (error) {
    const errorMessage = (error as any) || "Unknown error";
    console.error(errorMessage);
    return [];
  }
}

export function scrapeAndProvideData(baseUrl: string): string {
  try {
    console.log(`Scraping data from: ${baseUrl}`);
    return `Scraped data from ${baseUrl}`;
  } catch (error) {
    const errorMessage = (error as any) || "Unknown error";
    console.error(errorMessage);
    return "";
  }
}
