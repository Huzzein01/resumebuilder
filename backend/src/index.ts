import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDb } from "./db.js";
import profileRoutes from "./routes/profileRoutes.js";
import jobDescriptionRoutes from "./routes/jobDescriptionRoutes.js";
import relevanceRoutes from "./routes/relevanceRoutes.js";
import selectionRoutes from "./routes/selectionRoutes.js";
import resumeVersionRoutes from "./routes/resumeVersionRoutes.js";
import coverLetterRoutes from "./routes/coverLetterRoutes.js";
import careerToolsRoutes from "./routes/careerToolsRoutes.js";
import aiDebugRoutes from "./routes/aiDebugRoutes.js";

const app = express();

// CSP is left off: this API only ever returns JSON/PDF/DOCX, never HTML it
// renders itself, so a content policy meant for HTML pages has nothing to
// protect here and only risks interfering with Puppeteer's own navigation
// to the frontend's /print routes during PDF export.
app.use(helmet({ contentSecurityPolicy: false }));

// Allow the known frontend origins plus any explicitly configured one, but
// don't hard-fail into a fully open CORS policy if FRONTEND_URL is unset --
// fall back to the deployed production origin rather than "allow everyone."
const allowedOrigins = new Set(
  [
    "http://localhost:5173",
    "https://resumebuilder-seven-silk.vercel.app",
    process.env.FRONTEND_URL,
  ].filter((origin): origin is string => !!origin)
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
  })
);

// Generous ceiling meant to stop abuse (e.g. a runaway script hammering the
// LLM-backed endpoints), not to constrain normal interactive use.
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.json());

app.use("/api/profile", profileRoutes);
app.use("/api/job-descriptions", jobDescriptionRoutes);
app.use("/api/relevance", relevanceRoutes);
app.use("/api/selection", selectionRoutes);
app.use("/api/resume-versions", resumeVersionRoutes);
app.use("/api/resume-versions", coverLetterRoutes);
app.use("/api/career-tools", careerToolsRoutes);

// Dev-only: runs uncapped model calls against whichever provider
// AI_PROVIDER selects, with no auth. Useful on a dev box for comparing
// providers; not something to expose on a public URL.
if (process.env.NODE_ENV !== "production") {
  app.use("/api/ai-debug", aiDebugRoutes);
}

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
