
import { NextRequest, NextResponse } from "next/server";
import { getQAChain } from "@/app/api/ai/ai";
import clientPromise from "@/dbconfig/dbconfig";

interface QAChainResult {
  text: string;
  sourceDocuments?: any[];
}

interface ConversationHistory {
  userId: string;
  question: string;
  response: string;
  timestamp: Date;
}

export async function POST(request: NextRequest) {
  try {
    const TIMEOUT_MS = 60000;

    // 1. Get the persistent connection
    const client = await clientPromise;
    const db = client.db("asssignment_final");
    const historyCollection = db.collection<ConversationHistory>("conversation_history");

    // 2. Parse request
    const reqBody = await request.json();
    const { question, userId, behaviorTemplate, rank } = reqBody;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Fetch and log current behavior settings for this user
    try {
      const behaviorCollection = db.collection("behaviour_history");
      const currentBehavior = await behaviorCollection.findOne({ org_Id: userId });
      
      if (currentBehavior) {
        console.log("🤖 Current Bot Behavior Settings:");
        console.log({
          length: currentBehavior.length_var,
          outputStructure: currentBehavior.outputStructure_var,
          tone: currentBehavior.tone_var,
          personality: currentBehavior.personality_var,
          mustDo: currentBehavior.do_var,
          dontDo: currentBehavior.don_var,
          orgId: currentBehavior.org_Id
        });
      } else {
        console.log("⚠️ No behavior settings found for user:", userId);
      }
    } catch (behaviorError) {
      console.error("Error fetching behavior settings:", behaviorError);
    }

    // 3. Get chain and process query with optional behavior template
    const chain = await getQAChain(behaviorTemplate, rank); 
    console.log("⏳ Processing query...");

    let responseText: string;
    try {
      const result = await chain.call({ query: question });
      let cleanText = result.text.replace("</think>", "");

      // Handle bold formatting: replace **text** with <strong>text</strong>
      cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      
      const dontKnowIndex = cleanText.indexOf("I don't know");
      if (dontKnowIndex !== -1) {
          cleanText = "I don't know";
      }
      responseText = cleanText;

      console.log("✅ Processing complete");
    } catch (apiError) {
      console.error("API Limit Error:", apiError);
      responseText = "API limit reached. Please try again later.";
    }

    // 4. Store history
    try {
      await historyCollection.insertOne({
        userId,
        question,
        response: responseText,
        timestamp: new Date(),
      });
    } catch (storageError) {
      console.error("History storage error:", storageError);
    }

    return NextResponse.json({ text: responseText });

  } catch (error: unknown) {
    console.error("API Error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: "Processing failed",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : null,
      },
      { status: 500 }
    );
  }
}