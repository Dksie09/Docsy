import puppeteer from 'puppeteer';
import { URL } from 'url';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Setup dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(dirname(__dirname), '../.env') });

// Universal documentation helpers
function isInternalDocLink(baseUrl, link) {
    try {
        const baseUrlObj = new URL(baseUrl);
        const linkUrlObj = new URL(link);

        // Check if it's the same domain
        if (linkUrlObj.hostname !== baseUrlObj.hostname) return false;

        // Common documentation URL patterns
        const docPatterns = [
            '/docs/',
            '/documentation/',
            '/guide/',
            '/manual/',
            '/reference/',
            '/api/',
            '/learn/',
            '/latest/',
            '/dg/',
            '/dev/'
        ];

        return docPatterns.some(pattern =>
            linkUrlObj.pathname.includes(pattern) ||
            baseUrlObj.pathname.includes(pattern));
    } catch {
        return false;
    }
}

function normalizeUrl(url) {
    try {
        const urlObj = new URL(url);
        urlObj.hash = '';
        return urlObj.toString();
    } catch {
        return url;
    }
}

async function extractPageData(page, baseUrl) {
    return await page.evaluate((baseUrl) => {
        // Common documentation page selectors
        const possibleMainContentSelectors = [
            'main',
            'article',
            '.content',
            '.documentation',
            '.documentation-content',
            '.docs-content',
            '.markdown-body',
            '.main-content',
            '#main-content',
            '#content',
            '.container[role="main"]',
            '[role="main"]',
            '.doc-content'
        ];

        let mainContent = null;
        for (const selector of possibleMainContentSelectors) {
            mainContent = document.querySelector(selector);
            if (mainContent) break;
        }
        mainContent = mainContent || document.body;

        // Get navigation structure
        const navSelectors = [
            'nav',
            '.sidebar',
            '.nav-sidebar',
            '.docs-sidebar',
            '.table-of-contents',
            '#table-of-contents'
        ];

        let navigation = [];
        for (const selector of navSelectors) {
            const navElement = document.querySelector(selector);
            if (navElement) {
                navigation = Array.from(navElement.querySelectorAll('a')).map(link => ({
                    text: link.textContent.trim(),
                    href: link.href
                }));
                break;
            }
        }

        // Get breadcrumbs
        const breadcrumbSelectors = [
            '.breadcrumb',
            '.breadcrumbs',
            '[aria-label="breadcrumb"]',
            '.path-nav'
        ];

        let breadcrumbs = [];
        for (const selector of breadcrumbSelectors) {
            const breadcrumbElement = document.querySelector(selector);
            if (breadcrumbElement) {
                breadcrumbs = Array.from(
                    breadcrumbElement.querySelectorAll('li, .breadcrumb-item, a')
                ).map(item => item.textContent.trim());
                break;
            }
        }

        // Get all sections with their content
        const sections = Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(heading => {
            let content = '';
            let element = heading.nextElementSibling;

            while (element && !['H1', 'H2', 'H3', 'H4'].includes(element.tagName)) {
                // Skip if this element is a child of another section
                if (!element.closest('h1, h2, h3, h4')) {
                    content += element.textContent + '\n';
                }
                element = element.nextElementSibling;
            }

            return {
                heading: heading.textContent.trim(),
                content: content.trim(),
                id: heading.id || '',
                level: parseInt(heading.tagName.charAt(1))
            };
        });

        // Extract code examples
        const codeBlocks = Array.from(
            document.querySelectorAll('pre code, .highlight, .code-block, pre.highlight')
        ).map(block => ({
            language: block.className.match(/language-(\w+)/)?.[1] ||
                block.className.match(/(\w+)$/)?.[1] || 'txt',
            code: block.textContent.trim()
        }));

        // Get meta information
        const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
        const metaKeywords = document.querySelector('meta[name="keywords"]')?.content || '';

        // Find related links
        const relatedSelectors = [
            '.related',
            '.related-links',
            '.see-also',
            '.related-content',
            '.further-reading'
        ];

        let relatedLinks = [];
        for (const selector of relatedSelectors) {
            const relatedElement = document.querySelector(selector);
            if (relatedElement) {
                relatedLinks = Array.from(relatedElement.querySelectorAll('a')).map(link => ({
                    text: link.textContent.trim(),
                    href: link.href
                }));
                break;
            }
        }

        // Get page title with fallbacks
        const title = document.querySelector('h1')?.textContent.trim() ||
            document.title.trim() ||
            "Untitled Page";

        return {
            title,
            url: window.location.href,
            breadcrumbs,
            meta: {
                description: metaDescription,
                keywords: metaKeywords
            },
            sections,
            navigation,
            codeBlocks,
            relatedLinks,
            pageText: mainContent.textContent.trim()
        };
    }, baseUrl);
}

async function crawlDocumentation(startUrl, maxPages = 100) {
    const browser = await puppeteer.launch({ headless: "new" });
    const visitedUrls = new Set();
    const queue = [startUrl];
    const pages = [];
    let processedPages = 0;

    console.log('Starting documentation crawler...');
    console.log(`Base URL: ${startUrl}`);

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Universal-DocsBot-Crawler/1.0');

        while (queue.length > 0 && processedPages < maxPages) {
            const url = normalizeUrl(queue.shift());

            if (visitedUrls.has(url)) continue;
            visitedUrls.add(url);

            console.log(`Crawling (${processedPages + 1}/${maxPages}):`, url);

            try {
                await page.goto(url, {
                    waitUntil: 'networkidle0',
                    timeout: 30000
                });

                const pageData = await extractPageData(page, startUrl);

                // Get all links
                const links = await page.evaluate(() =>
                    Array.from(document.querySelectorAll('a[href]'))
                        .map(a => a.href)
                );

                // Filter and queue new internal doc links
                const newLinks = links
                    .filter(link => isInternalDocLink(startUrl, link))
                    .filter(link => !visitedUrls.has(normalizeUrl(link)));

                console.log(`Found ${newLinks.length} new documentation links`);
                queue.push(...newLinks);

                pages.push({
                    ...pageData,
                    timestamp: new Date().toISOString()
                });

                processedPages++;

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.error(`Error processing ${url}:`, error.message);
            }
        }
    } finally {
        await browser.close();
    }

    console.log(`Crawling complete. Processed ${processedPages} pages.`);
    return pages;
}

async function storeCrawledData(pages) {
    console.log('Preparing to store', pages.length, 'pages');

    const mutation = `
        mutation AddPages($pages: [AddPageInput!]!) {
            addPage(input: $pages) {
                page {
                    id
                    title
                    url
                }
            }
        }
    `;

    const pageInputs = pages.map(page => ({
        title: page.title || "Untitled Page",
        url: page.url,
        content: `
            ${page.breadcrumbs?.join(' > ') || ''}
            
            ${page.meta?.description || ''}
            
            ${page.pageText}
            
            Sections:
            ${page.sections.map(s =>
            `${'#'.repeat(s.level)} ${s.heading}${s.id ? ` {#${s.id}}` : ''}\n${s.content}`
        ).join('\n\n')}
            
            Code Examples:
            ${page.codeBlocks.map(c => `Language: ${c.language}\n${c.code}`).join('\n\n')}
            
            Related Links:
            ${page.relatedLinks.map(l => `${l.text}: ${l.href}`).join('\n')}
        `.trim()
    }));

    try {
        const response = await fetch(process.env.DGRAPH_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DGRAPH_TOKEN}`
            },
            body: JSON.stringify({
                query: mutation,
                variables: { pages: pageInputs }
            })
        });

        const result = await response.json();
        if (result.errors) {
            console.error('Dgraph errors:', result.errors);
        }
        return result;
    } catch (error) {
        console.error('Failed to store crawled data:', error);
        throw error;
    }
}

async function queryDgraph(url) {
    const query = `
        query CheckUrl($url: String!) {
            queryPage(filter: { url: { allofterms: $url } }) {
                id
                url
                title
            }
        }
    `;

    try {
        const response = await fetch(process.env.DGRAPH_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DGRAPH_TOKEN}`
            },
            body: JSON.stringify({
                query: query,
                variables: { url: url }
            })
        });

        const result = await response.json();
        if (result.errors) {
            console.error('Dgraph query errors:', result.errors);
            return [];
        }

        return result.data?.queryPage || [];
    } catch (error) {
        console.error('Failed to query Dgraph:', error);
        throw error;
    }
}
async function crawlAndStore(startUrl) {
    console.log(`Starting crawl from ${startUrl}`);

    // Check if the base URL is already in Dgraph
    const existingPages = await queryDgraph(startUrl);
    if (existingPages.length > 0) {
        console.log("Base URL already crawled. Skipping...");
        return;
    }

    const crawledPages = await crawlDocumentation(startUrl);

    if (crawledPages.length > 0) {
        console.log("Storing data in Dgraph...");
        await storeCrawledData(crawledPages);
        console.log("Crawl and store complete!");
    } else {
        console.log("No pages were crawled!");
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const startUrl = process.argv[2];
    if (!startUrl) {
        console.error('Please provide a URL to crawl');
        process.exit(1);
    }

    console.log('Environment check:', {
        DGRAPH_ENDPOINT: process.env.DGRAPH_ENDPOINT ? 'Set' : 'Not set',
        DGRAPH_TOKEN: process.env.DGRAPH_TOKEN ? 'Set' : 'Not set'
    });

    crawlAndStore(startUrl)
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Crawl failed:', error);
            process.exit(1);
        });
}