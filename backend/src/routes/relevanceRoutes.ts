import { Router } from "express";
import { getRelevance } from "../controllers/relevanceController.js";

const router = Router();

router.get("/:jobDescriptionId", getRelevance);

export default router;
