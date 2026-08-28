import { Router } from "express";
import { getCareerToolInsights } from "../controllers/careerToolsController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.post("/:kind", asyncHandler(getCareerToolInsights));

export default router;
