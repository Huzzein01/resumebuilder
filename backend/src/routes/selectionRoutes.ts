import { Router } from "express";
import { getSelection } from "../controllers/selectionController.js";

const router = Router();

router.get("/:jobDescriptionId", getSelection);

export default router;
