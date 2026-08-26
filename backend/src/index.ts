import "dotenv/config";
import express from "express";
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
