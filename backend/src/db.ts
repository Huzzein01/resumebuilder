import mongoose from "mongoose";

function redact(uri: string): string {
  // Atlas-style URIs embed credentials (mongodb+srv://user:pass@host/db) --
  // never log those verbatim, especially once logs are hosted (Render, etc).
  return uri.replace(/\/\/[^@/]+@/, "//***:***@");
}

export async function connectDb(): Promise<void> {
  const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/resumebuilder";
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB at ${redact(uri)}`);
}
