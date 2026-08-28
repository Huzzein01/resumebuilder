import { Router } from "express";
import { getCareerToolInsights } from "../controllers/careerToolsController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/:kind", asyncHandler(getCareerToolInsights));

export default router;
