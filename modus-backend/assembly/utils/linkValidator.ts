import { DocumentationLink } from "../classes";

// Helper function to check if a link is valid
export function checkLinks(links: DocumentationLink[]): DocumentationLink[] {
  const validLinks: DocumentationLink[] = [];

  for (let i = 0; i < links.length; i++) {
    const link = links[i];

    // Fetch the URL and check if it's valid
    const response = fetch(link.url, { method: "HEAD" });
    if (response.status == 200) {
      validLinks.push(link);
    } else {
      console.log(`Invalid link: ${link.url}`);
    }
  }

  return validLinks;
}
