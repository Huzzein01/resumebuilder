import { Router } from "express";
import { getRelevance } from "../controllers/relevanceController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/:jobDescriptionId", asyncHandler(getRelevance));

export default router;
