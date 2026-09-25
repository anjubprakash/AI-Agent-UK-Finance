import { Router } from "express";
import {
  uploadRegulatoryDocument,
  getUploadProgress,
  updateRuleVersion,
  getAllRegulatoryDocuments,
  getRegulatoryDocumentById,
  deleteRegulatoryDocument,
  resetKnowledgeBase,
  checkFcaLiveUpdates,
  syncFcaRulebookIncremental,
} from "../controllers/regulatoryDocument.controller.js";
import {
  authenticate,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

// Real-time upload and embedding progress polling (Admin & Employee)
router.get("/upload-progress/:uploadId", authenticate, getUploadProgress);

// Check offiscial FCA live updates and amendment notices (Admin & Employee)
router.get("/fca/updates", authenticate, checkFcaLiveUpdates);

// Trigger selective incremental sync for an FCA rulebook (Admin only)
router.post(
  "/fca/sync",
  authenticate,
  authorizeRoles("ADMIN"),
  syncFcaRulebookIncremental,
);

// Upload UK regulatory document (Admin only)
router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  upload.single("file"),
  uploadRegulatoryDocument,
);

// Update version of existing UK regulatory document (Admin only)
router.post(
  "/:id/update-version",
  authenticate,
  authorizeRoles("ADMIN"),
  upload.single("file"),
  updateRuleVersion,
);

// List UK regulatory documents (Admin & Employee)
router.get("/", authenticate, getAllRegulatoryDocuments);

// View regulatory document details
router.get("/:id", authenticate, getRegulatoryDocumentById);

// Reset entire knowledge base (Admin only)
router.delete(
  "/reset",
  authenticate,
  authorizeRoles("ADMIN"),
  resetKnowledgeBase,
);

// Delete regulatory document (Admin only)
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  deleteRegulatoryDocument,
);

export default router;
