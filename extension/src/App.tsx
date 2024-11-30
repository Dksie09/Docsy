import React, { useState, useEffect } from "react";
import {
  Send,
  Sparkles,
  AlertTriangle,
  Loader,
  ArrowUpRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

const DGRAPH_API_URL = process.env.DGRAPH_API_URL || "";

interface DocumentationLink {
  title: string;
  url: string;
}

const App: React.FC = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [links, setLinks] = useState<DocumentationLink[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    chrome.storage.local.get(["query", "response", "links"], (result) => {
      if (result.query) setQuery(result.query);
      if (result.response) setResponse(result.response);
      if (result.links) setLinks(result.links);
    });

    return () => {
      chrome.storage.local.set({ query, response, links });
    };
  }, []);

  const loadingStates = [
    { message: "Initializing page scraper... 🕷️", time: 7000 },
    { message: "Vectorizing document content... 📊", time: 7000 },
    { message: "Computing embeddings via LLM... 🧮", time: 7000 },
    { message: "Querying Dgraph database... 🔍", time: 7000 },
    { message: "Running semantic similarity search... 🎯", time: 7000 },
    { message: "Performing vector space analysis... 📐", time: 7000 },
    { message: "Processing context window... 🪟", time: 7000 },
    { message: "Generating LLM response... 🤖", time: 8000 },
    { message: "Formatting markdown output... ✨", time: 9000 },
  ];

  const checkDgraphHealth = async () => {
    try {
      const response = await fetch(DGRAPH_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "test query" }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        return "**Warning:** Dgraph rate limit reached. Results **might** substantially differ from the actual documentation.";
      }
      return null;
    } catch (err) {
      return "**Warning:** Dgraph backend is unreachable. Results may be limited.";
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setWarning(null);

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const currentUrl = tabs[0]?.url || "";

      if (!currentUrl.includes("docs") && !currentUrl.includes("developer")) {
        setWarning(
          "**Warning:** It seems like you're not on a documentation page. The response might not be accurate!"
        );
      }

      // Set up loading states with delays
      loadingStates.forEach(({ message, time }) => {
        setTimeout(() => setStatus(message), time);
      });

      // Get Dgraph health status but don't show warning yet
      const dgraphWarning = await checkDgraphHealth();

      setTimeout(() => {
        chrome.runtime.sendMessage({ action: "processQuery", query }, (res) => {
          if (res?.success) {
            setResponse(res.data.response);
            setLinks(res.data.links || []);

            // Now show the Dgraph warning if it exists, along with the response
            if (dgraphWarning) {
              setWarning(dgraphWarning);
            }
            // Add any other warnings from the response
            if (res.data.warning) {
              setWarning((prev) =>
                prev ? `${prev}\n\n${res.data.warning}` : res.data.warning
              );
            }
          } else {
            setError("**Error:** Something went wrong! Try again later.");
          }
          setStatus(null);
          setLoading(false);
        });
      }, 9000);
    });

    setQuery(""); // Clear input field after submitting
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleSearch();
    }
  };

  const handleLinkClick = (url: string) => {
    chrome.runtime.sendMessage({ action: "openLink", url }, (response) => {
      if (response.success) {
        console.log("Link opened successfully");
      } else {
        console.error("Failed to open link");
      }
    });
  };

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.altKey || event.metaKey) && event.code === "Space") {
        document.getElementById("query-input")?.focus();
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  return (
    <div className="w-[400px] min-h-[200px] bg-gradient-to-b from-indigo-100 to-purple-100 rounded-2xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-500" />
        <h1 className="text-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
          Doc Assistant
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="relative">
          <textarea
            id="query-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What would you like to know?"
            className="w-full h-28 px-4 py-3 rounded-lg border border-indigo-300 bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none placeholder-gray-400 text-gray-700 resize-none transition-all"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="absolute bottom-3 right-3 p-2 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      {/* Loading Status */}
      {status && (
        <div className="mb-4 p-3 rounded-lg bg-blue-100 text-blue-800 flex items-start gap-2">
          <Loader className="w-5 h-5 mt-1 animate-spin" />
          <span className="text-sm font-medium">{status}</span>
        </div>
      )}

      {/* Warning */}
      {warning && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-100 text-yellow-800 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 mt-1" />
          <ReactMarkdown className="prose prose-sm">{warning}</ReactMarkdown>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-800 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 mt-1" />
          <ReactMarkdown className="prose prose-sm">{error}</ReactMarkdown>
        </div>
      )}

      {/* Relevant Docs */}
      {links.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            Relevant Docs:
          </h2>
          <div className="flex flex-wrap gap-2">
            {links.map((link, index) => (
              <div
                key={index}
                onClick={() => handleLinkClick(link.url)}
                className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-purple-600 transition cursor-pointer"
              >
                {link.title}
                <ArrowUpRight className="w-4 h-4" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="bg-white rounded-lg shadow-inner p-4 overflow-x-auto">
          <ReactMarkdown
            className="prose prose-sm text-gray-800"
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {response}
          </ReactMarkdown>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-gray-500 text-sm">
        Press <kbd className="bg-gray-200 px-1 rounded">Alt</kbd> +{" "}
        <kbd className="bg-gray-200 px-1 rounded">Space</kbd> to toggle the
        extension on/off.
      </div>
    </div>
  );
};

export default App;
