import { http, models } from "@hypermode/modus-sdk-as";
import {
  OpenAIChatModel,
  SystemMessage,
  UserMessage,
} from "@hypermode/modus-sdk-as/models/openai/chat";
import { JSON } from "json-as";
import { DocumentationResponse } from "./classes";

export function sayHello(name: string | null = null): string {
  return `Hello, ${name || "World"}!`;
}
export function sayBye(name: string | null = null): string {
  return `Bye, ${name || "World"}!`;
}

export function generateDocumentationResponse(
  question: string,
  currentUrl: string,
): string {
  // Step 1: Determine documentation type using AI if not in predefined list
  let docType = determineDocumentation(currentUrl);

  if (docType === "General") {
    docType = inferDocumentationContext(currentUrl);
  }

  // Step 2: Generate a response using the inferred documentation context
  const response = generateText(
    `You are an assistant for ${docType} documentation.`,
    question,
  );

  const result: DocumentationResponse = {
    success: true,
    documentation: docType,
    response: response,
  };

  return JSON.stringify<DocumentationResponse>(result);
}

function determineDocumentation(url: string): string {
  if (url.includes("aws")) return "AWS";
  if (url.includes("react")) return "React";
  if (url.includes("nextjs")) return "Next.js";
  return "General"; // Fallback to general if no match
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

function generateText(instruction: string, prompt: string): string {
  const model = models.getModel<OpenAIChatModel>("text-generator");

  const input = model.createInput([
    new SystemMessage(instruction),
    new UserMessage(prompt),
  ]);

  input.temperature = 0.7;
  const output = model.invoke(input);

  return output.choices[0].message.content.trim();
}
