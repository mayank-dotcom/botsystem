
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
  databases?: string[];  // Add this line to include the databases array
  useCustomPrompt?: boolean;
  customPrompt?: string;
  botBehavior?: {
    tone?: string;
    responseLength?: string;
    personality?: string;
    outputStructure?: string;
    dos?: string;
    donts?: string;
    who?: string;  // Add this new field
  };
}

let length = ""
let outputStructure = ""
let tone = ""
let personality = ""
let mustdo = ""
let dondo = ""
let who_variable = ""  // Add this line to declare the variable

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
  let connectionCustomPrompt = null;
  if (embedUrl) {
    try {
      // Find connection with matching URL
      const connection = await connectionsCollection.findOne({ url: embedUrl });
      
      if (connection) {
        // Check if this connection uses a custom prompt
        if (connection.useCustomPrompt && connection.customPrompt) {
          console.log("Found custom prompt for URL:", embedUrl);
          connectionCustomPrompt = connection.customPrompt;
        } else if (connection.botBehavior) {
          console.log("Found matching connection with botBehavior for URL:", embedUrl);
          
          // Update behavior variables from the connection's botBehavior
          length = connection.botBehavior.responseLength || "medium";
          outputStructure = connection.botBehavior.outputStructure || "paragraph";
          tone = connection.botBehavior.tone || "professional";
          personality = connection.botBehavior.personality || "helpful";
          mustdo = connection.botBehavior.dos || "_";
          dondo = connection.botBehavior.donts || "_";
          who_variable = connection.botBehavior.who || "AI";  // Add this line
          
          console.log("Using bot behavior from connection:", {
            length, outputStructure, tone, personality, mustdo, dondo, who_variable
          });
        }
      } else {
        console.log("No matching connection found for URL:", embedUrl);
        // Set default values if no connection found
        length = "medium";
        outputStructure = "paragraph";
        tone = "professional";
        personality = "helpful";
        mustdo = "_";
        dondo = "_";
        who_variable = "AI";  // Add this line
      }
    } catch (error) {
      console.error("Error fetching connection for URL:", embedUrl, error);
      // Set default values on error
      length = "medium";
      outputStructure = "paragraph";
      tone = "professional";
      personality = "helpful";
      mustdo = "_";
      dondo = "_";
      who_variable = "AI";  // Add this line
    }
  }

  // Get documents based on the connection and rank
  let selectedDoc;
  
  if (embedUrl) {
    try {
      // First, find the connection to get its databases array
      const connection = await connectionsCollection.findOne({ url: embedUrl });
      
      if (connection && connection.databases && connection.databases.length > 0) {
        // Find documents that match the content in the databases array
        const matchingDocs = await collection.find({ 
          content: { $in: connection.databases } 
        }).toArray();
        
        // Get the document at the specified rank (index)
        if (matchingDocs.length >= rank) {
          selectedDoc = matchingDocs[rank - 1];
          console.log(`Using document at rank ${rank} from connection's databases`);
        } else {
          throw new Error(`No document found at rank ${rank} for the specified connection`);
        }
      } else {
        // Fallback to getting all docs if no databases array or it's empty
        const allDocs = await collection.find().toArray();
        selectedDoc = allDocs[rank - 1];
        console.log(`Using document at rank ${rank} from all documents (fallback)`);
      }
    } catch (error) {
      console.error("Error finding document by rank and connection:", error);
      // Fallback to the original method
      const allDocs = await collection.find().toArray();
      selectedDoc = allDocs[rank - 1];
      console.log(`Using document at rank ${rank} from all documents (error fallback)`);
    }
  } else {
    // Original behavior if no embedUrl is provided
    const allDocs = await collection.find().toArray();
    selectedDoc = allDocs[rank - 1];
    console.log(`Using document at rank ${rank} from all documents`);
  }

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
You are a ${who_variable} assistant. Always follow the instructions below precisely.

Use only the information provided in {context} to answer the question only if the subject is somewhat related to the {context}.

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

  // Use connectionCustomPrompt if available, otherwise use provided customTemplate or default
  const template = connectionCustomPrompt || customTemplate || DEFAULT_BOT_BEHAVIOR_TEMPLATE;
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
