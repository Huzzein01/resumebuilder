import mongoose from "mongoose";

export async function connectDb(): Promise<void> {
  const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/resumebuilder";
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB at ${uri}`);
}
