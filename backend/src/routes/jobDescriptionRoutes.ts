import { Router } from "express";
import {
  createJobDescription,
  listJobDescriptions,
  getJobDescription,
} from "../controllers/jobDescriptionController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.post("/", asyncHandler(createJobDescription));
router.get("/", asyncHandler(listJobDescriptions));
router.get("/:id", asyncHandler(getJobDescription));

export default router;
