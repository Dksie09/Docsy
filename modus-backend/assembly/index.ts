import { http, models } from "@hypermode/modus-sdk-as";
import {
  OpenAIChatModel,
  SystemMessage,
  UserMessage,
} from "@hypermode/modus-sdk-as/models/openai/chat";
import { JSON } from "json-as";
import { DocumentationResponse, DocumentationLink } from "./classes";
import { fetchDgraphLinks } from "./utils/dgraphHelper";

export function generateDocumentationResponse(
  question: string,
  currentUrl: string,
): DocumentationResponse {
  const baseUrl = extractBaseUrl(currentUrl);

  let dgraphLinks: DocumentationLink[] = [];
  if (isValidDocUrl(baseUrl)) {
    dgraphLinks = fetchDgraphLinks(baseUrl, question);
  }

  const modusResult = generateTextWithLinks(
    `You are an assistant for ${baseUrl} documentation.`,
    question,
    currentUrl,
  );

  if (dgraphLinks.length === 0) {
    console.warn("Dgraph links unavailable. Using only Modus AI links.");
  }

  const combinedLinks = mergeLinks(dgraphLinks, modusResult.links || []);

  return {
    success: true,
    documentation: baseUrl,
    response: modusResult.response,
    links: combinedLinks,
  };
}

function generateTextWithLinks(
  instruction: string,
  prompt: string,
  currentUrl: string,
): { response: string; links: DocumentationLink[] } {
  const model = models.getModel<OpenAIChatModel>("text-generator");

  const input = model.createInput([
    new SystemMessage(
      `${instruction} Use this additional context to refine your response: ${currentUrl}`,
    ),
    new UserMessage(prompt),
  ]);

  input.temperature = 0.7;
  const output = model.invoke(input);

  const content = output.choices[0].message.content.trim();

  let extractedLinks: DocumentationLink[] = [];
  if (isValidJson(content)) {
    try {
      extractedLinks = JSON.parse<DocumentationLink[]>(content);
    } catch (error) {
      const errorMessage = (error as any) || "Unknown error";
      console.error(errorMessage);
    }
  }

  return {
    response: content,
    links: extractedLinks,
  };
}

function mergeLinks(
  dgraphLinks: DocumentationLink[],
  modusLinks: DocumentationLink[],
): DocumentationLink[] {
  const seenUrls = new Set();
  const combined = [...dgraphLinks, ...modusLinks].filter((link) => {
    if (seenUrls.has(link.url)) return false;
    seenUrls.add(link.url);
    return true;
  });
  return combined;
}

function extractBaseUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.origin}${parsedUrl.pathname.split("/docs")[0]}/docs`;
  } catch (error) {
    const errorMessage = (error as any)?.message || "Unknown error";
    console.error(errorMessage);
    return "";
  }
}

function isValidDocUrl(baseUrl: string): bool {
  // Common patterns for documentation URLs
  const docPatterns = [
    "/docs",
    "/documentation",
    "/guide",
    "/manual",
    "/reference",
    "/api",
    "/learn",
    "/help",
    "/getting-started",
    "/overview",
    "/intro",
    "/tutorials",
    "/quick-start",
    "/developer",
    "/dev",
    "/examples",
    "/how-to",
    "/latest",
    "/resources",
  ];

  // Check if the base URL contains any of the documentation patterns
  return docPatterns.some((pattern) => baseUrl.includes(pattern));
}

function determineDocumentation(url: string): string {
  if (url.includes("aws")) return "AWS";
  if (url.includes("react")) return "React";
  if (url.includes("nextjs")) return "Next.js";
  if (url.includes("azure")) return "Azure";
  if (url.includes("appwrite")) return "Appwrite";
  return "General";
}

function inferDocumentationContext(url: string): string {
  const model = models.getModel<OpenAIChatModel>("text-generator");

  const input = model.createInput([
    new SystemMessage("You are an assistant that identifies documentation."),
    new UserMessage(
      `Determine the documentation type based on this URL: ${url}. Only respond with the name of the documentation, such as "AWS", "React", or "Next.js".`,
    ),
  ]);

  input.temperature = 0;
  const output = model.invoke(input);

  return output.choices[0].message.content.trim();
}

function generateText(
  instruction: string,
  prompt: string,
  currentUrl: string,
): string {
  const model = models.getModel<OpenAIChatModel>("text-generator");

  const input = model.createInput([
    new SystemMessage(
      `${instruction} Use this additional context to refine your response: ${currentUrl}`,
    ),
    new UserMessage(prompt),
  ]);

  input.temperature = 0.7;
  const output = model.invoke(input);

  return output.choices[0].message.content.trim();
}

function fetchRelevantLinks(
  docType: string,
  question: string,
): DocumentationLink[] {
  const model = models.getModel<OpenAIChatModel>("text-generator");

  const input = model.createInput([
    new SystemMessage(
      `You are an assistant for ${docType} documentation. Provide a list of relevant documentation links for the given query in strict JSON format. Each object in the array should contain "title" (a brief title of the link) and "url" (the full URL). Do not include any additional text or formatting.`,
    ),
    new UserMessage(question),
  ]);

  input.temperature = 0.5;
  const output = model.invoke(input);

  const content = output.choices[0].message.content.trim();

  // Validate JSON format and parse links
  if (isValidJson(content)) {
    return JSON.parse<DocumentationLink[]>(content);
  }

  // Fallback to an empty array for invalid JSON
  console.error(content);
  return [];
}

// Function to validate JSON structure
function isValidJson(jsonString: string): bool {
  return jsonString.startsWith("[") && jsonString.endsWith("]");
}
