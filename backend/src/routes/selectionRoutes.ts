import { Router } from "express";
import { getSelection } from "../controllers/selectionController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/:jobDescriptionId", asyncHandler(getSelection));

export default router;
