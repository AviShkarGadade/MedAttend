import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI
const MONGODB_DB = process.env.MONGODB_DB

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

if (!MONGODB_DB) {
  throw new Error("Please define the MONGODB_DB environment variable")
}

let cachedClient: MongoClient | null = null
let cachedDb: any = null

export async function connectToDatabase() {
  
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  // Create a new connection
  const client = new MongoClient(MONGODB_URI as string)
  await client.connect()
  const db = client.db(MONGODB_DB)


  cachedClient = client
  cachedDb = db

  return { client, db }
}
