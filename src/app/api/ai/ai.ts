
import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { loadQAStuffChain } from "langchain/chains";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Document } from "langchain/document";
import axios from "axios";
import clientPromise from "@/dbconfig/dbconfig";

let cachedChain: any;
interface BehaviourHistory {
  // bot_behaviour: string; 
  length_var:string;
  outputStructure_var:string;
  tone_var:string;
  personality_var:string;
  do_var:string;
  don_var:string;
  org_Id:string;
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
const BehaviourHistory = db2.collection<BehaviourHistory>("behaviour_history");

// const organId = await axios.get(`${process.env.DOMAIN}/api/get-user-id`)
let organId = "";
try {
  const response = await fetch(`${process.env.DOMAIN}/get-user-id`);
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const data = await response.json();
    organId = data.userId;
  } else {
    console.error("Received non-JSON response from get-user-id endpoint");
    // Fallback or handle error appropriately
  }
} catch (error) {
  console.error("Error fetching user ID:", error);
}
try {
  console.log("organId::", organId);
  const result = await BehaviourHistory.findOne({ org_Id: organId });
  if (result) {
    length = result.length_var;
    outputStructure = result.outputStructure_var;
    tone = result.tone_var;
    personality = result.personality_var;
    mustdo = result.do_var;
    dondo = result.don_var
  }
} catch (error) {
  // Handle error silently
  console.error("Error fetching behaviour history in  ai file:", error);

}

// === 2. Bot behavior template ===
const DEFAULT_BOT_BEHAVIOR_TEMPLATE = `
Only use the provided context to answer in ${length}${outputStructure}, keep your tone ${tone} ${personality} :{context}

User question: {question}
Answer (always ${mustdo} but never ${dondo}):`

export async function getQAChain(customTemplate?: string, rank?: number) {
  if (cachedChain && !customTemplate && rank === undefined) return cachedChain;
  if (!rank || rank < 1) throw new Error("Rank must be >= 1");

  // === 3. Connect to DB and fetch documents ===
  const client = await clientPromise;
  const db = client.db("asssignment_final");
  const collection = db.collection("asssignment_collection");

  const allDocs = await collection.find().toArray();
  const selectedDoc = allDocs[rank - 1];

  if (!selectedDoc) throw new Error(`No document found at rank ${rank}`);

  const document = new Document({
    pageContent: selectedDoc.content, // Changed from 'text' to 'content'
    metadata: selectedDoc.metadata || {}
  });

  // === 4. Init LLM and prompt ===
  const model = new HuggingFaceInference({
    model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
    
    temperature: 0.3,
    maxTokens: 210,
    apiKey: process.env.HUGGINGFACEHUB_API_KEY,
  });

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
