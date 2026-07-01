const express = require("express");
const {
  listAllServices,
  createNewService,
  updateOneService,
  archiveOneService,
  deleteOneService,
  getOneService,
} = require("../controllers/service.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/role.middleware");
const tenantMiddleware = require("../middleware/tenant.middleware");

const router = express.Router();

router.use(authMiddleware, requirePermission("manageServices"), tenantMiddleware);

router.get("/", listAllServices);
router.post("/", createNewService);
router.get("/:id", getOneService);
router.patch("/:id", updateOneService);
router.patch("/:id/archive", archiveOneService);
router.delete("/:id", deleteOneService);

module.exports = router;
