"use server";

import { MongoClient, Collection } from "mongodb";
// Add OpenAI embeddings import
import { OpenAIEmbeddings } from "@langchain/openai";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { NextRequest, NextResponse } from "next/server";
import * as dotenv from "dotenv";
import puppeteer from "puppeteer";
import type { Page } from 'puppeteer'; // Add explicit type import
import fs from 'fs';
import path from 'path';
// Import tiktoken for token counting
const { encoding_for_model } = require("tiktoken");

dotenv.config();

interface Source {
  type: "file" | "pdf" | "url";
  path?: string;
  url?: string;
}

// Helper function to normalize URLs for comparison
function normalizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    // Remove hash fragments and normalize path
    parsedUrl.hash = '';
    
    // Remove query parameters that don't affect content (like tracking params)
    // Keep only essential query parameters if needed
    parsedUrl.search = '';
    
    // Convert to lowercase for case-insensitive comparison
    let hostname = parsedUrl.hostname.toLowerCase();
    
    // Handle www vs non-www versions
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    parsedUrl.hostname = hostname;
    
    // Remove trailing slash if present (except for root)
    if (parsedUrl.pathname.length > 1 && parsedUrl.pathname.endsWith('/')) {
      parsedUrl.pathname = parsedUrl.pathname.slice(0, -1);
    }
    
    return parsedUrl.toString();
  } catch (e) {
    return url; // Return original if parsing fails
  }
}

// Function to count characters (excluding spaces and punctuation)
function countCharacters(text: string): number {
  if (typeof text !== "string") return 0;
  const cleanText = text.replace(/[\s\p{P}]/gu, ""); // Remove spaces and punctuation
  return cleanText.length;
}

// Function to count tokens with chunking specifically for GPT-4
async function countTokensGPT4(text: string): Promise<number> {
  try {
    if (typeof text !== "string") {
      // Suppress console warning
      return 0;
    }
    const enc = encoding_for_model("gpt-4");
    const chunkSize = 500;
    let totalTokens = 0;
    
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.substring(i, i + chunkSize);
      try {
        const tokens = enc.encode(chunk);
        totalTokens += tokens.length;
      } catch (e: any) {
        // Suppress console warning
      }
    }
    enc.free();
    return totalTokens;
  } catch (error: any) {
    // Suppress console error
    return 0;
  }
}

// Calculate additional tokens needed for API request formatting
function calculateRequestOverhead(documentCount: number): number {
  const baseOverhead = 10;
  const perDocumentOverhead = 5;
  return baseOverhead + (perDocumentOverhead * documentCount);
}

// Estimate output tokens
function estimateOutputTokens(inputTokens: number, isEmbedding = true): number {
  if (isEmbedding) return 0;
  return Math.ceil(inputTokens * 0.5);
}

// Auto-scroll function for puppeteer
async function autoScroll(page: Page) {
  try {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight || totalHeight >= 10000) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Suppress scroll wait log
  } catch (scrollError) {
    // Suppress scrolling error
    throw scrollError;
  }
}

export async function POST(req: NextRequest) {
  // Increase chunk size from 256 to 1024 for bigger chunks
  const splitter = new CharacterTextSplitter({
    chunkSize: 1024,
    chunkOverlap: 100,
  });

  // Initialize OpenAI embeddings model
  const embeddingModel = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY!,
    modelName: "text-embedding-ada-002", // You can also use "text-embedding-3-small" or "text-embedding-3-large" for newer models
  });

  const client = new MongoClient(process.env.MONGODB_URI as string);
  
  // Create an array to store all log messages
  const logMessages: string[] = [];

  try {
    const { source, orgId }: { source: Source, orgId: string } = await req.json();

    if (!source || source.type !== "url" || !source.url) {
      throw new Error("Invalid source: URL is required");
    }

    if (!orgId) {
      throw new Error("Organization ID is required");
    }

    // Add to log messages instead of console.log
    logMessages.push(`Starting crawl from base URL: ${source.url}`);

    // Create a log file for URLs
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const logFilePath = path.join(logDir, `crawl-${timestamp}.log`);
    
    // Log function to file only, not console
    const logUrl = (message: string) => {
      // Add to our log messages array instead of console
      logMessages.push(message);
      fs.appendFileSync(logFilePath, message + '\n');
    };
    
    logUrl(`Crawl started at: ${new Date().toISOString()}`);
    logUrl(`Base URL: ${source.url}`);
    logUrl(`Organization ID: ${orgId}`);
    logUrl('-------------------------------------------');

    // Launch browser with headless: false to see the window
    const browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: null, // Disable the default viewport
      args: [
        '--start-maximized', // Start the browser maximized
        '--force-device-scale-factor=1', // Force 100% zoom level
        '--disable-pinch' // Disable pinch zooming
      ]
    });
    
    // Extract domain from source URL to identify internal links
    const baseUrl = new URL(source.url);
    const domain = baseUrl.hostname;
    const baseUrlPath = baseUrl.pathname;
    
    // Track visited URLs to avoid duplicates (using normalized URLs)
    const visitedUrls = new Set<string>();
    // Queue of URLs to visit
    const urlsToVisit: string[] = [source.url];
    // Store all extracted text
    const allExtractedText: string[] = [];
    
    // Maximum number of pages to crawl (adjust as needed)
    const MAX_PAGES = 100;
    let pagesVisited = 0;
    
    // Token and character counting variables
    let totalInputTokens = 0;
    let totalCharacters = 0;
    let documentTokenCounts: any[] = [];
    
    // Connect to MongoDB
    await client.connect();
    const db = client.db("asssignment_final");
    const collection: Collection = db.collection("asssignment_collection");
    
    while (urlsToVisit.length > 0 && pagesVisited < MAX_PAGES) {
      const currentUrl = urlsToVisit.shift()!;
      const normalizedCurrentUrl = normalizeUrl(currentUrl);
      
      // Skip if already visited
      if (visitedUrls.has(normalizedCurrentUrl)) {
        logUrl(`Skipping already visited URL: ${currentUrl}`);
        continue;
      }
      
      visitedUrls.add(normalizedCurrentUrl);
      pagesVisited++;
      
      logUrl(`[${pagesVisited}/${MAX_PAGES}] Navigating to: ${currentUrl}`);
      
      const page = await browser.newPage();
      
      // Set the viewport to a large size
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Set zoom level to 100%
      await page.evaluate(() => {
        document.body.style.zoom = '100%';
        document.body.style.transform = 'scale(1)';
        document.body.style.transformOrigin = '0 0';
      });
      
      try {
        // Navigate to the URL
        await page.goto(currentUrl, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });
        
        logUrl(`Page loaded successfully: ${currentUrl}`);
        
        // Reset zoom level after page load to ensure it's at 100%
        await page.evaluate(() => {
          document.body.style.zoom = '100%';
          document.body.style.transform = 'scale(1)';
          document.body.style.transformOrigin = '0 0';
          
          if (document.body.style.zoom !== '100%') {
            document.body.style.cssText += ' zoom: 100% !important;';
          }
        });
        
        // Enter full screen mode
        await page.evaluate(() => {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
          }
        });
        
        await autoScroll(page);
        logUrl("Scrolling completed");
        
        // Extract all links from the page
        const links = await page.evaluate((domain, baseUrlPath) => {
          // Get links from anchor tags
          const anchorLinks = Array.from(document.querySelectorAll('a[href]'))
            .map(a => {
              const href = a.getAttribute('href');
              if (!href) return null;
              
              try {
                // Handle relative URLs
                let fullUrl;
                if (href.startsWith('http')) {
                  fullUrl = href;
                } else if (href.startsWith('/')) {
                  fullUrl = `${window.location.protocol}//${window.location.host}${href}`;
                } else {
                  // Handle relative paths without leading slash
                  const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
                  fullUrl = `${window.location.protocol}//${window.location.host}${basePath}/${href}`;
                }
                
                const url = new URL(fullUrl);
                
                // Skip if it's not on the same domain
                if (url.hostname !== domain) return null;
                
                // Skip if it's the home page
                if (url.pathname === '/' || url.pathname === baseUrlPath) return null;
                
                // Skip common non-content URLs
                if (url.pathname.includes('/login') || 
                    url.pathname.includes('/signup') || 
                    url.pathname.includes('/contact') ||
                    url.pathname.includes('/cart') ||
                    url.pathname.includes('/checkout')) return null;
                
                return fullUrl;
              } catch (e) {
                return null;
              }
            });
            
          // Get links from link tags
          const linkTags = Array.from(document.querySelectorAll('link[href]'))
            .map(link => {
              const href = link.getAttribute('href');
              if (!href) return null;
              
              // Skip resource links like CSS, icons, etc.
              const rel = link.getAttribute('rel');
              if (rel && ['stylesheet', 'icon', 'apple-touch-icon', 'manifest'].includes(rel)) return null;
              
              try {
                // Handle relative URLs (same logic as for anchor tags)
                let fullUrl;
                if (href.startsWith('http')) {
                  fullUrl = href;
                } else if (href.startsWith('/')) {
                  fullUrl = `${window.location.protocol}//${window.location.host}${href}`;
                } else {
                  const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
                  fullUrl = `${window.location.protocol}//${window.location.host}${basePath}/${href}`;
                }
                
                const url = new URL(fullUrl);
                
                // Skip if it's not on the same domain
                if (url.hostname !== domain) return null;
                
                // Skip if it's the home page
                if (url.pathname === '/' || url.pathname === baseUrlPath) return null;
                
                return fullUrl;
              } catch (e) {
                return null;
              }
            });
          
          // Combine both types of links and filter out nulls
          return [...anchorLinks, ...linkTags].filter(url => url !== null);
        }, domain, baseUrlPath);
        
        logUrl(`Found ${links.length} links on the page`);
        
        // Add new links to the queue
        for (const link of links) {
          if (link) {
            const normalizedLink = normalizeUrl(link);
            if (!visitedUrls.has(normalizedLink)) {
              urlsToVisit.push(link);
              logUrl(`Added to queue: ${link}`);
            } else {
              logUrl(`Skipping duplicate URL: ${link}`);
            }
          }
        }
        
        // Log queue status
        logUrl(`Current queue size: ${urlsToVisit.length} URLs`);
        
        // Get all text content from the page
        const textContent = await page.evaluate(() => {
          // Select a wider range of elements to capture more text
          const elements = document.querySelectorAll("h1, h2, h3, h4, h5, h6, p, div, span, li, a, button, label, td, th");
          return Array.from(elements)
            .map((el) => el.textContent?.trim())
            .filter((text) => text && text.length > 0)
            .join(" ");
        });
        
        logUrl(`Extracted text content, length: ${textContent.length}`);
        
        if (textContent.length > 0) {
          allExtractedText.push(textContent);
          
          // Process the text from this page
          // Modified to create larger chunks by increasing the sentence length filter
          const sentences = textContent
            .split(/(?<=[.?!])\s+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 20); // Reduced minimum length to capture more content
          
          const chunkedText: string[] = [];
          let tempText = "";
          
          // Create larger chunks by increasing the max length to 1024 (matching the splitter)
          for (const sentence of sentences) {
            if (tempText.length + sentence.length <= 1024) {
              tempText += sentence + " ";
            } else {
              chunkedText.push(tempText.trim());
              tempText = sentence + " ";
            }
          }
          
          if (tempText.trim().length > 0) {
            chunkedText.push(tempText.trim());
          }
          
          // Create documents for embedding
          const documents = await splitter.createDocuments(
            chunkedText,
            chunkedText.map(() => ({ source: currentUrl }))
          );
          
          logUrl(`Chunked text into ${documents.length} chunks.`);
          
          // Count tokens and characters for each chunk and generate embeddings
          for (const doc of documents) {
            try {
              const tokenCount = await countTokensGPT4(doc.pageContent);
              const charCount = countCharacters(doc.pageContent);
              
              totalInputTokens += tokenCount;
              totalCharacters += charCount;
              
              documentTokenCounts.push({
                url: currentUrl,
                content: doc.pageContent.substring(0, 50) + "...",
                tokens: tokenCount,
                characters: charCount
              });
              
              logUrl(`Chunk stats - Tokens: ${tokenCount}, Characters: ${charCount}`);
              
              // Clean text for embedding
              const text = String(doc.pageContent)
                .trim()
                // Remove all special characters and keep only basic text
                .replace(/[^a-zA-Z0-9\s]/g, ' ')
                // Normalize whitespace
                .replace(/\s+/g, ' ')
                .trim();
              
              // Generate embedding and store in MongoDB
              if (text.length > 0) {
                try {
                  // Truncate if needed
                  let processedText = text;
                  if (text.length > 1024) {
                    logUrl('Text too long, truncating to 1024 characters');
                    // Clean truncation at word boundary
                    const words = text.substring(0, 1024).split(' ');
                    words.pop(); // Remove potentially partial word
                    processedText = words.join(' ');
                  }
                  
                  // Generate embedding
                  const embedding = await embeddingModel.embedQuery(processedText);
                  
                  // Store in MongoDB
                  await collection.insertOne({
                    content: processedText,
                    metadata: { ...doc.metadata, crawledFrom: currentUrl },
                    embedding,
                    org_Id: orgId
                  });
                  
                  logUrl(`Successfully stored embedding for chunk from ${currentUrl}`);
                } catch (embeddingError: unknown) {
                  logUrl(`Error with embedding model: ${embeddingError instanceof Error ? embeddingError.message : String(embeddingError)}`);
                }
              }
            } catch (err: any) {
              logUrl(`Error processing chunk: ${err.message}`);
            }
          }
        }
        
        await page.close();
      } catch (error: any) {
        logUrl(`Error processing page ${currentUrl}: ${error.message}`);
        await page.close();
      }
    }
    
    // Calculate token statistics
    const requestOverhead = calculateRequestOverhead(documentTokenCounts.length);
    const estimatedOutputTokens = estimateOutputTokens(totalInputTokens, true);
    const totalTokens = totalInputTokens + requestOverhead + estimatedOutputTokens;
    
    // Log token statistics
    logUrl('-------------------------------------------');
    logUrl(`Token and character counts by document: ${JSON.stringify(documentTokenCounts, null, 2)}`);
    logUrl(`Total document tokens: ${totalInputTokens}`);
    logUrl(`Total document characters: ${totalCharacters}`);
    logUrl(`Request overhead tokens: ${requestOverhead}`);
    logUrl(`Estimated output tokens: ${estimatedOutputTokens}`);
    logUrl(`Grand total tokens: ${totalTokens}`);
    logUrl('-------------------------------------------');
    
    await browser.close();

    // Now print all the log messages at once
    console.log("\n\n========== WEB CRAWLER RESULTS ==========");
    console.log(`Crawl completed for: ${source.url}`);
    console.log(`Pages visited: ${pagesVisited}`);
    console.log(`Total tokens: ${totalTokens}`);
    console.log(`Total characters: ${totalCharacters}`);
    console.log(`Total chunks: ${documentTokenCounts.length}`);
    console.log("==========================================\n");
    console.log("For detailed logs, check the log file at:");
    console.log(logFilePath);
    console.log("==========================================\n");

    return NextResponse.json({
      message: `Successfully processed ${source.type}`,
      source: source.url,
      stats: {
        pagesVisited,
        totalTokens,
        totalCharacters,
        documentTokenCounts: documentTokenCounts.length
      }
    });
  } catch (error: any) {
    // Only log the error at the end
    console.error("\n\n========== ERROR ==========");
    console.error("Error:", error instanceof Error ? error.message : "Unknown error");
    console.error("============================\n");
    
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
