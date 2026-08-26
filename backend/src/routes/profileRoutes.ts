import { Router } from "express";
import multer from "multer";
import { getProfile, updateProfile } from "../controllers/profileController.js";
import { importProfile } from "../controllers/profileImportController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.get("/", getProfile);
router.put("/", updateProfile);
router.post("/import", upload.single("resume"), importProfile);

export default router;
