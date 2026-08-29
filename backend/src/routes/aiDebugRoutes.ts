import { Router } from "express";
import { getAiStatus, runAiDebugFeature } from "../controllers/aiDebugController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getAiStatus));
router.get("/:feature", asyncHandler(runAiDebugFeature));

export default router;
