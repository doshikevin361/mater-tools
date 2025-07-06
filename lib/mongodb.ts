import { MongoClient, type Db } from "mongodb"

const MONGODB_URI =
  "mongodb+srv://ahdoshi1108:mzfMJvyetmqM49kU@cluster0.sjmsliu.mongodb.net/brandbuzz_ventures?retryWrites=true&w=majority&appName=Cluster0"

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const client = new MongoClient(MONGODB_URI)
  await client.connect()

  const db = client.db("brandbuzz_ventures")

  cachedClient = client
  cachedDb = db

  return { client, db }
}

export async function getDatabase(): Promise<Db> {
  const { db } = await connectToDatabase()
  return db
}

export async function pingDatabase() {
  try {
    const { db } = await connectToDatabase()
    await db.admin().ping()
    return { success: true, message: "Database connection successful" }
  } catch (error) {
    return { success: false, message: `Database connection failed: ${error}` }
  }
}
