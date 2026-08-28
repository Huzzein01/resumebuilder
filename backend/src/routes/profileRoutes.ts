import { Router } from "express";
import multer from "multer";
import { getProfile, updateProfile, getResumeHealthAi } from "../controllers/profileController.js";
import { importProfile } from "../controllers/profileImportController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.get("/", asyncHandler(getProfile));
router.post("/health/ai", asyncHandler(getResumeHealthAi));
router.put("/", asyncHandler(updateProfile));
router.post("/import", upload.single("resume"), asyncHandler(importProfile));

export default router;
