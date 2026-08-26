import { Router } from "express";
import {
  createResumeVersion,
  getResumeVersion,
  getResumeVersionPdf,
  getResumeVersionDocx,
} from "../controllers/resumeVersionController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.post("/", asyncHandler(createResumeVersion));
router.get("/:id", asyncHandler(getResumeVersion));
router.get("/:id/pdf", asyncHandler(getResumeVersionPdf));
router.get("/:id/docx", asyncHandler(getResumeVersionDocx));

export default router;
