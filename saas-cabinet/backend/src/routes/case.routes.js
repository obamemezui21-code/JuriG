const express = require("express");
const {
  listCases,
  createCase,
  getCaseById,
  updateCase,
  deleteCase,
  uploadCaseDocuments,
} = require("../controllers/case.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const tenantMiddleware = require("../middleware/tenant.middleware");
const { upload } = require("../utils/upload");

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/", listCases);
router.post("/", createCase);
router.post("/:id/documents", upload.array("documents", 20), uploadCaseDocuments);
router.get("/:id", getCaseById);
router.patch("/:id", updateCase);
router.delete("/:id", deleteCase);

module.exports = router;
