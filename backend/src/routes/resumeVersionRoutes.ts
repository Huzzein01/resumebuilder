import { Router } from "express";
import {
  createResumeVersion,
  getResumeVersion,
  getResumeVersionPdf,
  getResumeVersionDocx,
} from "../controllers/resumeVersionController.js";

const router = Router();

router.post("/", createResumeVersion);
router.get("/:id", getResumeVersion);
router.get("/:id/pdf", getResumeVersionPdf);
router.get("/:id/docx", getResumeVersionDocx);

export default router;
