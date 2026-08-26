import { Router } from "express";
import {
  createJobDescription,
  listJobDescriptions,
  getJobDescription,
} from "../controllers/jobDescriptionController.js";

const router = Router();

router.post("/", createJobDescription);
router.get("/", listJobDescriptions);
router.get("/:id", getJobDescription);

export default router;
