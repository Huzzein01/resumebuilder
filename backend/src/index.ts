import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { connectDb } from "./db.js";
import profileRoutes from "./routes/profileRoutes.js";
import jobDescriptionRoutes from "./routes/jobDescriptionRoutes.js";
import relevanceRoutes from "./routes/relevanceRoutes.js";
import selectionRoutes from "./routes/selectionRoutes.js";
import resumeVersionRoutes from "./routes/resumeVersionRoutes.js";
import coverLetterRoutes from "./routes/coverLetterRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/profile", profileRoutes);
app.use("/api/job-descriptions", jobDescriptionRoutes);
app.use("/api/relevance", relevanceRoutes);
app.use("/api/selection", selectionRoutes);
app.use("/api/resume-versions", resumeVersionRoutes);
app.use("/api/resume-versions", coverLetterRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Must be registered after all routes -- catches errors forwarded via
// next(err), including rejected promises passed through by asyncHandler.
// Without this, an unhandled rejection in any async route (a malformed
// Mongo id, a validation failure, a Puppeteer export error, etc.) would
// otherwise crash the whole process, taking every other request down with it.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Request failed:", err);

  const name = err instanceof Error ? err.name : undefined;
  if (name === "CastError" || name === "ValidationError") {
    res.status(400).json({ error: "Invalid request." });
    return;
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ error: message });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
