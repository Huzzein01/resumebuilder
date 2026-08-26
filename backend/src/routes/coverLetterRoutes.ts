import { Router } from "express";
import { getCoverLetter, getCoverLetterPdf, getCoverLetterDocx } from "../controllers/coverLetterController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/:id/cover-letter", asyncHandler(getCoverLetter));
router.get("/:id/cover-letter/pdf", asyncHandler(getCoverLetterPdf));
router.get("/:id/cover-letter/docx", asyncHandler(getCoverLetterDocx));

export default router;
