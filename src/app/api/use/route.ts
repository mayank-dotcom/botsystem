
import { NextRequest, NextResponse } from "next/server";
import { getQAChain } from "@/app/api/ai/ai";
import clientPromise from "@/dbconfig/dbconfig";
import { ObjectId } from "mongodb";

interface QAChainResult {
  text: string;
  sourceDocuments?: any[];
}

interface ConversationHistory {
  userId: string;
  question: string;
  response: string;
  timestamp: Date;
  org_Id?: string;  // Added optional org_Id field
  url?: string;     // Added optional url field
  messageId?: string; // Added optional messageId field
}

export async function POST(request: NextRequest) {
  try {
    const TIMEOUT_MS = 60000;

    // 1. Get the persistent connection
    const client = await clientPromise;
    const db = client.db("asssignment_final");
    const historyCollection = db.collection<ConversationHistory>("conversation_history");
    const assignmentCollection = db.collection("asssignment_collection");

    // 2. Parse request
    const reqBody = await request.json();
    const { question, userId, behaviorTemplate, rank, embedUrl } = reqBody;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Check if embedUrl exists and find matching document in assignment collection
    let matchedOrgId = null;
    let matchedUrl = null;
    
    if (embedUrl) {
      console.log("Checking for URL match in assignment collection:", embedUrl);
      
      // First try to find a direct match with the url field
      const matchingDocument = await assignmentCollection.findOne({ 
        url: embedUrl 
      });
      
      // If no match found with url field, try with metadata.source
      if (!matchingDocument) {
        const metadataMatch = await assignmentCollection.findOne({ 
          "metadata.source": embedUrl 
        });
        
        if (metadataMatch) {
          console.log("Found matching document with metadata.source:", embedUrl);
          matchedOrgId = metadataMatch.org_Id;
          matchedUrl = embedUrl;
        } else {
          console.log("No matching document found for URL:", embedUrl);
        }
      } else {
        console.log("Found matching document with URL field:", embedUrl);
        matchedOrgId = matchingDocument.org_Id;
        matchedUrl = embedUrl;
      }
    }

    // 3. Get chain and process query with optional behavior template and embedUrl
    const chain = await getQAChain(behaviorTemplate, rank, embedUrl); 
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

    // 4. Store history with org_Id and url if matched
    try {
      // Generate a new ObjectId for this message
      const messageId = new ObjectId().toString();
      
      const historyEntry: ConversationHistory = {
        userId,
        question,
        response: responseText,
        timestamp: new Date(),
        messageId, // Add the messageId field
      };
      
      // Add org_Id and url to history entry if matched
      if (matchedOrgId) {
        historyEntry.org_Id = matchedOrgId;
      }
      
      if (matchedUrl) {
        historyEntry.url = matchedUrl;
      }
      
      await historyCollection.insertOne(historyEntry);
      console.log("Saved conversation history with additional fields:", 
        messageId ? "messageId: " + messageId : "No messageId",
        matchedOrgId ? "org_Id: " + matchedOrgId : "No org_Id match",
        matchedUrl ? "url: " + matchedUrl : "No URL match"
      );
      
      // Return the messageId along with the response text
      return NextResponse.json({ 
        text: responseText,
        messageId: messageId 
      });
      
    } catch (storageError) {
      console.error("History storage error:", storageError);
      // Still return the response even if storage fails
      return NextResponse.json({ text: responseText });
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