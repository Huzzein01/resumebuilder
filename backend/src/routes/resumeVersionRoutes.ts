import { Router } from "express";
import {
  createResumeVersion,
  getResumeVersion,
  getResumeVersionPdf,
  getResumeVersionDocx,
  listResumeVersions,
  listTrashedResumeVersions,
  renameResumeVersion,
  trashResumeVersion,
  restoreResumeVersion,
  deleteResumeVersion,
} from "../controllers/resumeVersionController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.post("/", asyncHandler(createResumeVersion));
router.get("/", asyncHandler(listResumeVersions));
router.get("/trash", asyncHandler(listTrashedResumeVersions));
router.get("/:id", asyncHandler(getResumeVersion));
router.get("/:id/pdf", asyncHandler(getResumeVersionPdf));
router.get("/:id/docx", asyncHandler(getResumeVersionDocx));
router.patch("/:id", asyncHandler(renameResumeVersion));
router.post("/:id/trash", asyncHandler(trashResumeVersion));
router.post("/:id/restore", asyncHandler(restoreResumeVersion));
router.delete("/:id", asyncHandler(deleteResumeVersion));

export default router;
