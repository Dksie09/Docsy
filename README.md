
# Docsy

Docsy is a smart Chrome extension that simplifies navigating documentation. It finds the exact information you need, saving you time and effort. 

<p style="font-size: small;">Powered by <a href="https://hypermode.com/">hypermode</a></p>

## Features
- **Smart Search**: Quickly find relevant documentation sections using semantic search.
- **AI Responses**: Get concise answers to your questions with Modus + LLaMA.
- **Keyboard Shortcut**: Open the extension with `Alt + Space`.


## Demo


https://github.com/user-attachments/assets/b9d5c852-7f5d-406e-9880-4aa56102a961



## File Structure

Here’s an overview of the project structure:

```
Docsy/
├── dgraph-backend/          # Handles data storage and semantic search
│   ├── src/
│   │   └── crawler/         # Crawlers for indexing documentation
│   ├── package.json         # Dependencies for the backend
│   └── .env                 # Configuration for Dgraph
├── extension/               # Chrome extension frontend
│   ├── public/              # Static assets (icons, manifest)
│   ├── src/
│   │   └── App.tsx          # Main React app
│   ├── manifest.json        # Chrome extension manifest
│   └── tailwind.config.js   # TailwindCSS configuration
├── modus-backend/           # AI query processing
│   ├── assembly/            # AssemblyScript logic for Modus
│   ├── modus.json           # Configuration for Modus
│   └── package.json         # Dependencies for Modus backend
└── README.md                # Project documentation
```

## Installation

### Prerequisites
- **Node.js**
- **Dgraph Cloud Account**
- **Modus CLI**

### Steps
1. **Clone the Repository**
   ```bash
   git clone https://github.com/Dksie09/Docsy.git
   cd ai-doc-extension
   ```

2. **Install Dependencies**
   ```bash
   cd extension
   npm install
   cd ../dgraph-backend
   npm install
   cd ../modus-backend
   npm install -g @hypermode/modus-cli
   ```

3. **Set Up Dgraph**
   - Create an account on [Dgraph Cloud](https://dgraph.io/).
   - Deploy the following schema in the GraphQL Schema tab:
     ```graphql
     type Page {
       id: ID!
       title: String! @search(by: [term])
       url: String! @search(by: [term])
       content: String @search(by: [fulltext])
       embedding: [Float!]
       headings: [Heading!] @hasInverse(field: "parentPage")
     }
     type Heading {
       id: ID!
       title: String! @search(by: [term])
       embedding: [Float!]
       parentPage: Page!
     }
     ```
4.  **Set Up Environment Variables**

   - **In `dgraph-backend`**, create a `.env` file with the following content:
     ```env
     HUGGINGFACE_TOKEN=
     DGRAPH_ENDPOINT=
     DGRAPH_TOKEN=
     PORT=3001
     ```

   - **In `extension`**, create a `.env` file with the following content:
     ```env
     GRAPHQL_API_URL=http://localhost:8686/graphql
     DGRAPH_API_URL=http://localhost:3001/api/semanticSearch
     ```

5. **Build and Load the Chrome Extension**
   ```bash
   cd ../extension
   npm run build
   ```
   - Open `chrome://extensions/` in Chrome.
   - Enable "Developer Mode" and load the `extension/build` folder.

6. **Run Backend Services**
   - **Dgraph Backend:**
     ```bash
     cd ../dgraph-backend
     npm start
     ```
   - **Modus Backend:**
     ```bash
     cd ../modus-backend
     modus dev
     ```

## Usage
1. Open the extension via the toolbar or `Alt + Space`.
2. Enter a query, e.g., "Where is this configuration option?"
3. View AI-generated answers and relevant documentation links.

## Contributing
We welcome contributions! Here’s how to get started:
1. Fork the repo.
2. Create a branch (`git checkout -b feature/new-feature`).
3. Commit changes (`git commit -m "Add new feature"`).
4. Push (`git push origin feature/new-feature`).
5. Create a Pull Request.

## Resources
- [Docsy Blog]()
- [Modus Docs](https://modus.hypermode.io/)
- [Dgraph Docs](https://dgraph.io/docs/)
- [Hypermode Community](https://discord.gg/hypermode)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
