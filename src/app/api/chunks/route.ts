"use server";

import { MongoClient, Collection } from "mongodb";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import HfInference from "@huggingface/inference";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { NextRequest, NextResponse } from "next/server";
import * as dotenv from "dotenv";
import puppeteer from "puppeteer";

dotenv.config();

interface Source {
  type: "file" | "pdf" | "url";
  path?: string;
  url?: string;
}

export async function POST(req: NextRequest) {
  const splitter = new CharacterTextSplitter({
    chunkSize: 256,
    chunkOverlap: 20,
  });

  const embeddingModel = new HuggingFaceInferenceEmbeddings({
    model: "intfloat/multilingual-e5-large",
    apiKey: process.env.HUGGINGFACEHUB_API_KEY!,
    // Remove stripNewLines as it's not a valid property for HuggingFaceInferenceEmbeddingsParams
  });

  const client = new MongoClient(process.env.MONGODB_URI as string);

  try {
    const { source, orgId }: { source: Source, orgId: string } = await req.json();

    if (!source || source.type !== "url" || !source.url) {
      throw new Error("Invalid source: URL is required");
    }

    if (!orgId) {
      throw new Error("Organization ID is required");
    }

    console.log(`Navigating to: ${source.url}`);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(source.url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    console.log("Page loaded successfully");

    await autoScroll(page);
    console.log("Scrolling completed");

    const textContent = await page.evaluate(() => {
      const elements = document.querySelectorAll("h1, h2, h3, h4, h5, h6, p");
      return Array.from(elements)
        .map((el) => el.textContent?.trim())
        .filter((text) => text && text.length > 0)
        .join(" ");
    });

    console.log("Extracted text content, length:", textContent.length);

    const sentences = textContent
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 30 && s.length <= 500);

    const chunkedText: string[] = [];
    let tempText = "";

    for (const sentence of sentences) {
      if (tempText.length + sentence.length <= 512) {
        tempText += sentence + " ";
      } else {
        chunkedText.push(tempText.trim());
        tempText = sentence + " ";
      }
    }

    if (tempText.trim().length > 0) {
      chunkedText.push(tempText.trim());
    }

    const documents = await splitter.createDocuments(
      chunkedText,
      chunkedText.map(() => ({ source: source.url }))
    );

    console.log("Chunked text into", documents.length, "chunks.");

    await client.connect();
    const db = client.db("asssignment_final");
    const collection: Collection = db.collection("asssignment_collection");

    for (const doc of documents) {
      // Simplified text cleaning focused on basic content
      const text = String(doc.pageContent)
        .trim()
        // Remove all special characters and keep only basic text
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();

      try {
        if (text.length > 512) {
          console.log('Text too long, truncating to 512 characters');
          // Clean truncation at word boundary
          const words = text.substring(0, 512).split(' ');
          words.pop(); // Remove potentially partial word
          const truncatedText = words.join(' ');
          
          try {
            // Create embedding with single sentence
            const embedding = await embeddingModel.embedQuery(truncatedText);
            await collection.insertOne({
              content: truncatedText,
              metadata: doc.metadata,
              embedding,
              org_Id: orgId // Add orgId to the document
            });
          } catch (embeddingError) {
            console.error('Error with embedding model:', embeddingError.message);
            // Skip problematic chunks instead of trying alternative processing
            continue;
          }
        } else {
          const embedding = await embeddingModel.embedQuery(text);
          await collection.insertOne({
            content: text,
            metadata: doc.metadata,
            embedding,
            org_Id: orgId // Add orgId to the document
          });
        }
      } catch (error) {
        console.error('Error embedding text:', text.substring(0, 100) + '...', error);
        continue;
      }
    }

    console.log("Embeddings stored in MongoDB");

    await browser.close();

    return NextResponse.json({
      message: `Successfully processed ${source.type}`,
      source: source.url,
    });
  } catch (error) {
    console.error("Error:", error);
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

async function autoScroll(page: puppeteer.Page) {
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
    console.log("Scroll wait completed");
  } catch (scrollError) {
    console.error("Scrolling error:", scrollError);
    throw scrollError;
  }
}
