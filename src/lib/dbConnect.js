import { MongoClient } from 'mongodb';

// Make sure the URI includes the database name
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/asssignment_final';
const client = new MongoClient(uri);

async function connectToDatabase() {
  await client.connect();
  // Explicitly specify the database name
  const db = client.db("asssignment_final");
  const org_collection = db.collection("org_collection");
  
  // Ensure the collection exists by performing a small operation
  await org_collection.findOne({});
  
  return { db, org_collection };
}

export { connectToDatabase };