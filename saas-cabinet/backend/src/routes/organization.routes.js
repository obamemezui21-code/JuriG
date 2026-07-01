const express = require("express");
const {
  getMyOrganization,
  updateMyOrganization,
  uploadMyOrganizationLogo,
  listThemes,
} = require("../controllers/organization.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/role.middleware");
const tenantMiddleware = require("../middleware/tenant.middleware");
const { uploadLogo } = require("../utils/upload");

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);
router.get("/themes", listThemes);

router.use(requirePermission("manageOrganization"));

router.get("/themes", listThemes);
router.get("/me", getMyOrganization);
router.patch("/me", updateMyOrganization);
router.post("/me/logo", uploadLogo.single("logo"), uploadMyOrganizationLogo);

module.exports = router;
