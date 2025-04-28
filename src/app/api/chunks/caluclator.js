
// const { MongoClient } = require("mongodb");
// const { encoding_for_model } = require("tiktoken");

// // MongoDB connection details
// const uri = "mongodb+srv://aassignment752:POFUrxwGoPda3lrB@assignmetndtaset.bu28t.mongodb.net/?retryWrites=true&w=majority&appName=Assignmetndtaset";
// const dbName = "asssignment_final";
// const collectionName = "asssignment_collection";

// // Function to count tokens with chunking specifically for GPT-4
// async function countTokensGPT4(text) {
//   try {
//     if (typeof text !== "string") {
//       console.warn("Invalid text input (not a string)");
//       return 0;
//     }

//     // Get the correct encoder for GPT-4
//     const enc = encoding_for_model("gpt-4");
    
//     // Process in smaller chunks to avoid memory issues
//     const chunkSize = 500;
//     let totalTokens = 0;
    
//     for (let i = 0; i < text.length; i += chunkSize) {
//       const chunk = text.substring(i, i + chunkSize);
//       try {
//         const tokens = enc.encode(chunk);
//         totalTokens += tokens.length;
//       } catch (e) {
//         console.warn(`Skipping problematic chunk starting at position ${i}: ${e.message}`);
//       }
//     }
    
//     // Free the encoder when done
//     enc.free();
//     return totalTokens;
//   } catch (error) {
//     console.error("Error counting tokens for text:", text.substring(0, 100) + "...");
//     console.error("Error details:", error.message);
//     return 0;
//   }
// }

// // Calculate additional tokens needed for API request formatting
// function calculateRequestOverhead(documentCount) {
//   // This is an estimate based on typical API usage
//   // For embeddings, the overhead is relatively small
//   const baseOverhead = 10; // Base tokens for API structure
//   const perDocumentOverhead = 5; // Additional tokens per document for metadata

//   return baseOverhead + (perDocumentOverhead * documentCount);
// }

// // Estimate output tokens (for completions, not needed for embeddings)
// function estimateOutputTokens(inputTokens, isEmbedding = true) {
//   if (isEmbedding) {
//     // For embeddings, there are no output tokens in the traditional sense
//     return 0;
//   } else {
//     // For chat completions, output tokens depend on the model and the task
//     // This is a very rough estimate - adjust based on your use case
//     return Math.ceil(inputTokens * 0.5); // Assuming output is ~50% of input length
//   }
// }

// // Main function to count total tokens
// async function countTotalTokens() {
//   const client = new MongoClient(uri);

//   try {
//     // Connect to MongoDB
//     await client.connect();
//     console.log("Connected to MongoDB");

//     // Select database and collection
//     const db = client.db(dbName);
//     const collection = db.collection(collectionName);

//     // Fetch all documents (only the text field)
//     const documents = await collection.find({}, { projection: { text: 1 } }).toArray();

//     if (!documents.length) {
//       console.log("No documents found in the collection");
//       return { 
//         inputTokens: 0,
//         requestOverhead: 0,
//         totalTokens: 0
//       };
//     }

//     console.log(`Found ${documents.length} documents`);

//     // Count tokens for each text and sum them
//     let totalInputTokens = 0;
//     let documentTokenCounts = [];
    
//     for (const doc of documents) {
//       if (doc.text && typeof doc.text === "string") {
//         console.log(`Processing document ${doc._id}...`);
//         try {
//           const tokenCount = await countTokensGPT4(doc.text);
//           totalInputTokens += tokenCount;
//           documentTokenCounts.push({ id: doc._id, tokens: tokenCount });
//           console.log(`Tokens for doc ${doc._id}: ${tokenCount}`);
//         } catch (err) {
//           console.error(`Failed to process doc ${doc._id}: ${err.message}`);
//           console.log(`Attempting to process doc ${doc._id} in smaller chunks...`);
          
//           // Try with even smaller chunks as fallback
//           try {
//             let docTokens = 0;
//             const microChunkSize = 100;
//             for (let i = 0; i < doc.text.length; i += microChunkSize) {
//               const microChunk = doc.text.substring(i, i + microChunkSize);
//               const chunkTokens = await countTokensGPT4(microChunk);
//               docTokens += chunkTokens;
//             }
//             totalInputTokens += docTokens;
//             documentTokenCounts.push({ id: doc._id, tokens: docTokens });
//             console.log(`Tokens for doc ${doc._id} (micro-chunked): ${docTokens}`);
//           } catch (microErr) {
//             console.error(`Failed to process doc ${doc._id} even with micro-chunking: ${microErr.message}`);
//             documentTokenCounts.push({ id: doc._id, tokens: 0, error: true });
//           }
//         }
//       } else {
//         console.warn(`Skipping invalid text in doc ${doc._id}`);
//         documentTokenCounts.push({ id: doc._id, tokens: 0, invalid: true });
//       }
//     }

//     // Calculate additional tokens for request processing
//     const requestOverhead = calculateRequestOverhead(documents.length);
    
//     // Calculate potential output tokens (if doing completions)
//     const estimatedOutputTokens = estimateOutputTokens(totalInputTokens, true); // true = embedding
    
//     // Calculate total tokens (input + overhead + output)
//     const totalTokens = totalInputTokens + requestOverhead + estimatedOutputTokens;

//     console.log(`Token counts by document:`, documentTokenCounts);
//     console.log(`Total document tokens: ${totalInputTokens}`);
//     console.log(`Request overhead tokens: ${requestOverhead}`);
//     console.log(`Estimated output tokens: ${estimatedOutputTokens}`);
//     console.log(`Grand total tokens: ${totalTokens}`);
    
//     return { 
//       documentTokens: totalInputTokens,
//       requestOverhead: requestOverhead,
//       outputTokens: estimatedOutputTokens,
//       totalTokens: totalTokens,
//       documentTokenCounts: documentTokenCounts
//     };

//   } catch (error) {
//     console.error("Error:", error.message);
//     return { 
//       documentTokens: 0, 
//       requestOverhead: 0,
//       outputTokens: 0,
//       totalTokens: 0,
//       error: error.message 
//     };
//   } finally {
//     await client.close();
//     console.log("MongoDB connection closed");
//   }
// }

// // Run the function
// (async () => {
//   console.log("Starting comprehensive token counting process...");
//   const result = await countTotalTokens();
//   console.log("Result:", result);
// })();

const { MongoClient } = require("mongodb");
const { encoding_for_model } = require("tiktoken");

// MongoDB connection details
const uri = "mongodb+srv://aassignment752:POFUrxwGoPda3lrB@assignmetndtaset.bu28t.mongodb.net/?retryWrites=true&w=majority&appName=Assignmetndtaset";
const dbName = "asssignment_final";
const collectionName = "asssignment_collection";

// Function to count characters (excluding spaces and punctuation)
function countCharacters(text) {
  if (typeof text !== "string") return 0;
  const cleanText = text.replace(/[\s\p{P}]/gu, ""); // Remove spaces and punctuation
  return cleanText.length;
}

// Function to count tokens with chunking specifically for GPT-4
async function countTokensGPT4(text) {
  try {
    if (typeof text !== "string") {
      console.warn("Invalid text input (not a string)");
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
      } catch (e) {
        console.warn(`Skipping problematic chunk starting at position ${i}: ${e.message}`);
      }
    }
    enc.free();
    return totalTokens;
  } catch (error) {
    console.error("Error counting tokens for text:", text.substring(0, 100) + "...");
    console.error("Error details:", error.message);
    return 0;
  }
}

// Calculate additional tokens needed for API request formatting
function calculateRequestOverhead(documentCount) {
  const baseOverhead = 10;
  const perDocumentOverhead = 5;
  return baseOverhead + (perDocumentOverhead * documentCount);
}

// Estimate output tokens
function estimateOutputTokens(inputTokens, isEmbedding = true) {
  if (isEmbedding) return 0;
  return Math.ceil(inputTokens * 0.5);
}

// Main function to count total tokens and characters
async function countTotalTokens() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const documents = await collection.find({}, { projection: { content: 1 } }).toArray();

    if (!documents.length) {
      console.log("No documents found in the collection");
      return { 
        inputTokens: 0,
        requestOverhead: 0,
        totalTokens: 0,
        totalCharacters: 0
      };
    }

    console.log(`Found ${documents.length} documents`);

    let totalInputTokens = 0;
    let totalCharacters = 0;
    let documentTokenCounts = [];
    
    for (const doc of documents) {
      if (doc.content && typeof doc.content === "string") {
        console.log(`Processing document ${doc._id}...`);
        try {
          const tokenCount = await countTokensGPT4(doc.content);
          const charCount = countCharacters(doc.content);
          totalInputTokens += tokenCount;
          totalCharacters += charCount;
          documentTokenCounts.push({ id: doc._id, tokens: tokenCount, characters: charCount });
          console.log(`Tokens for doc ${doc._id}: ${tokenCount}, Characters: ${charCount}`);
        } catch (err) {
          console.error(`Failed to process doc ${doc._id}: ${err.message}`);
          console.log(`Attempting to process doc ${doc._id} in smaller chunks...`);
          
          try {
            let docTokens = 0;
            let docChars = 0;
            const microChunkSize = 100;
            for (let i = 0; i < doc.content.length; i += microChunkSize) {
              const microChunk = doc.content.substring(i, i + microChunkSize);
              const chunkTokens = await countTokensGPT4(microChunk);
              const chunkChars = countCharacters(microChunk);
              docTokens += chunkTokens;
              docChars += chunkChars;
            }
            totalInputTokens += docTokens;
            totalCharacters += docChars;
            documentTokenCounts.push({ id: doc._id, tokens: docTokens, characters: docChars });
            console.log(`Tokens for doc ${doc._id} (micro-chunked): ${docTokens}, Characters: ${docChars}`);
          } catch (microErr) {
            console.error(`Failed to process doc ${doc._id} even with micro-chunking: ${microErr.message}`);
            documentTokenCounts.push({ id: doc._id, tokens: 0, characters: 0, error: true });
          }
        }
      } else {
        console.warn(`Skipping invalid content in doc ${doc._id}`);
        documentTokenCounts.push({ id: doc._id, tokens: 0, characters: 0, invalid: true });
      }
    }

    const requestOverhead = calculateRequestOverhead(documents.length);
    const estimatedOutputTokens = estimateOutputTokens(totalInputTokens, true);
    const totalTokens = totalInputTokens + requestOverhead + estimatedOutputTokens;

    console.log(`Token and character counts by document:`, documentTokenCounts);
    console.log(`Total document tokens: ${totalInputTokens}`);
    console.log(`Total document characters: ${totalCharacters}`);
    console.log(`Request overhead tokens: ${requestOverhead}`);
    console.log(`Estimated output tokens: ${estimatedOutputTokens}`);
    console.log(`Grand total tokens: ${totalTokens}`);
    
    return { 
      documentTokens: totalInputTokens,
      requestOverhead: requestOverhead,
      outputTokens: estimatedOutputTokens,
      totalTokens: totalTokens,
      totalCharacters: totalCharacters,
      documentTokenCounts: documentTokenCounts
    };

  } catch (error) {
    console.error("Error:", error.message);
    return { 
      documentTokens: 0, 
      requestOverhead: 0,
      outputTokens: 0,
      totalTokens: 0,
      totalCharacters: 0,
      error: error.message 
    };
  } finally {
    await client.close();
    console.log("MongoDB connection closed");
  }
}

// Run the function
(async () => {
  console.log("Starting comprehensive token and character counting process...");
  const result = await countTotalTokens();
  console.log("Result:", result);
})();