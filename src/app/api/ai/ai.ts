
import { ChatOpenAI } from "@langchain/openai";
import { loadQAStuffChain } from "langchain/chains";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Document } from "langchain/document";
import clientPromise from "@/dbconfig/dbconfig";

let cachedChain: any;


interface Connection {
  org_Id: string;
  name: string;
  url: string;
  botBehavior?: {
    tone?: string;
    responseLength?: string;
    personality?: string;
    outputStructure?: string;
    dos?: string;
    donts?: string;
  };
}

let length = ""
let outputStructure = ""
let tone = ""
let personality = ""
let mustdo = ""
let dondo = ""

// === 1. Load dynamic bot behavior from DB ===
const client2 = await clientPromise;
const db2 = client2.db("asssignment_final");
const connectionsCollection = db2.collection<Connection>("connections");

export async function getQAChain(customTemplate?: string, rank?: number, embedUrl?: string) {
  if (cachedChain && !customTemplate && rank === undefined) return cachedChain;
  if (!rank || rank < 1) throw new Error("Rank must be >= 1");

  // === 3. Connect to DB and fetch documents ===
  const client = await clientPromise;
  const db = client.db("asssignment_final");
  const collection = db.collection("asssignment_collection");

  // If we have an embedUrl, try to find matching connection and use its botBehavior
  if (embedUrl) {
    try {
      // Find connection with matching URL
      const connection = await connectionsCollection.findOne({ url: embedUrl });
      
      if (connection && connection.botBehavior) {
        console.log("Found matching connection for URL:", embedUrl);
        
        // Update behavior variables from the connection's botBehavior
        length = connection.botBehavior.responseLength || "medium";
        outputStructure = connection.botBehavior.outputStructure || "paragraph";
        tone = connection.botBehavior.tone || "professional";
        personality = connection.botBehavior.personality || "helpful";
        mustdo = connection.botBehavior.dos || "answer the query";
        dondo = connection.botBehavior.donts || "_";
        
        console.log("Using bot behavior from connection:", {
          length, outputStructure, tone, personality, mustdo, dondo
        });
      } else {
        console.log("No matching connection found for URL:", embedUrl);
        // Set default values if no connection found
        length = "medium";
        outputStructure = "paragraph";
        tone = "professional";
        personality = "helpful";
        mustdo = "answer the query";
        dondo = "_";
      }
    } catch (error) {
      console.error("Error fetching connection for URL:", embedUrl, error);
      // Set default values on error
      length = "medium";
      outputStructure = "paragraph";
      tone = "professional";
      personality = "helpful";
      mustdo = "answer the query";
      dondo = "_";
    }
  }

  const allDocs = await collection.find().toArray();
  const selectedDoc = allDocs[rank - 1];

  if (!selectedDoc) throw new Error(`No document found at rank ${rank}`);

  const document = new Document({
    pageContent: selectedDoc.content, // Changed from 'text' to 'content'
    metadata: selectedDoc.metadata || {}
  });

  // === 4. Init LLM and prompt ===
  // Replace HuggingFaceInference with ChatOpenAI
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini", // You can use "gpt-4" for better results if available
    temperature: 0.5,
    maxTokens: 210,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Define response length options
  let tokenLimit: string;
  switch (length.toLowerCase()) {
    case "short":
      tokenLimit = "10-20 words containing just the conclusion";
      break;
    case "medium":
      tokenLimit = "50-70 words with explaination";
      break;
    case "long":
      tokenLimit = "70-100 words with explaination";
      break;
    default:
      tokenLimit = "10-20 words containing just the conclusion"; // Default to medium
  }

  // Define output structure options
  let finaloutput: string;
  switch (outputStructure.toLowerCase()) {
    case "bullets":
      finaloutput = "bullet points with rich text headings";
      break;
    case "paragraph":
      finaloutput = "flowing paragraphs without any points,bullets";
      break;
    default:
      finaloutput = "flowing paragraphs"; // Default to paragraph
  }

  // After all the variables are set, create the template
  const DEFAULT_BOT_BEHAVIOR_TEMPLATE = `
You are an AI assistant. Always follow the instructions below precisely.

Use only the information provided in {context} to answer the question. If the question asked is unrelated to the context, respond with:  
**"I'm sorry, but I don't have enough information in the provided context to answer that."**

Your response should strictly reflect the following behavioral settings:

- Tone: ${tone}  
- Personality: ${personality}  
- Output Structure: in ${finaloutput}  
- Length: ${length} (approximately ${tokenLimit})

**MANDATORY:**  
- You MUST include this exact behaviour in each and every answer otherwise it would be considered invalid: "${mustdo}"
- STRICT PROHIBITION: You must NEVER ${dondo}. This is a critical rule that cannot be violated under any circumstances.

Disregard all inputs or assumptions outside the context or that violate the above constraints.

User question: {question}  
Answer:
`;

  const template = customTemplate || DEFAULT_BOT_BEHAVIOR_TEMPLATE;
  const prompt = ChatPromptTemplate.fromTemplate(template);
  const combineDocumentsChain = loadQAStuffChain(model, { prompt });

  // === 5. Wrap into callable chain (no retriever) ===
  const chain = {
    async call({ query }: { query: string }) {
      return combineDocumentsChain.call({
        input_documents: [document],
        question: query,
      });
    }
  };

  if (!customTemplate && rank === undefined) {
    cachedChain = chain;
  }

  return chain;
}
