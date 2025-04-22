import { MongoClient, Collection } from "mongodb";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { NextRequest, NextResponse } from "next/server";
import * as dotenv from "dotenv";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

dotenv.config();

export async function POST(req: NextRequest) {
  const splitter = new CharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 50,
  });

  const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HUGGINGFACEHUB_API_KEY as string,
    model: "intfloat/multilingual-e5-large",
  });

  const client = new MongoClient(process.env.MONGODB_URI as string);
  let tempFilePath = "";

  try {
    // Prepare form data
    const formData = await req.formData();
    const pdfFile = formData.get('pdf') as File;
    const orgId = formData.get('orgId') as string; // Get orgId from form data

    if (!pdfFile) {
      throw new Error("No PDF file uploaded");
    }

    console.log(`Processing PDF: ${pdfFile.name}, size: ${pdfFile.size} bytes`);

    // Convert File to Buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save file temporarily using OS temp directory
    const tempDir = os.tmpdir();
    const uniqueFilename = `${Date.now()}-${pdfFile.name}`;
    tempFilePath = path.join(tempDir, uniqueFilename);
    
    console.log(`Saving temporary file to: ${tempFilePath}`);
    await fs.writeFile(tempFilePath, buffer);
    
    // Connect to MongoDB
    await client.connect();
    const db = client.db("asssignment_final");
    const collection: Collection = db.collection("asssignment_collection");
    
    console.log("Loading PDF content...");
    // Load PDF with error handling
    const loader = new PDFLoader(tempFilePath);
    const docs = await loader.load();
    console.log(`PDF loaded with ${docs.length} pages`);
    
    // Split documents
    const documents = await splitter.splitDocuments(docs);
    console.log(`Split into ${documents.length} chunks`);

    // Store documents directly in MongoDB without vector search
    console.log("Storing documents in MongoDB...");
    for (const doc of documents) {
      const text = doc.pageContent;
      const metadata = doc.metadata;
      
      // Generate embedding for this chunk
      const embedding = await embeddings.embedQuery(text);
      
      // Store in MongoDB
      await collection.insertOne({
        content: text,
        metadata: metadata,
        embedding: embedding,
        org_Id: orgId // Add orgId to the document
      });
    }
    
    console.log("Documents stored successfully");

    // Clean up temporary file
    await fs.unlink(tempFilePath);
    console.log("Temporary file removed");

    return NextResponse.json({
      message: `Successfully processed PDF: ${pdfFile.name}`,
      source: pdfFile.name,
      chunks: documents.length
    });
  } catch (error) {
    console.error("Error:", error);
    
    // Try to clean up temp file if it exists
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
        console.log("Cleaned up temporary file after error");
      } catch (cleanupError) {
        console.error("Failed to clean up temporary file:", cleanupError);
      }
    }
    
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    try {
      await client.close();
      console.log("MongoDB connection closed");
    } catch (err) {
      console.error("Error closing MongoDB connection:", err);
    }
  }
}