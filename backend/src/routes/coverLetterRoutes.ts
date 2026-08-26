import { Router } from "express";
import { getCoverLetter, getCoverLetterPdf, getCoverLetterDocx } from "../controllers/coverLetterController.js";

const router = Router();

router.get("/:id/cover-letter", getCoverLetter);
router.get("/:id/cover-letter/pdf", getCoverLetterPdf);
router.get("/:id/cover-letter/docx", getCoverLetterDocx);

export default router;
