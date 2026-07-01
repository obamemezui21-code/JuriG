const express = require("express");
const {
  listDisbursements,
  createDisbursement,
  updateDisbursement,
  deleteDisbursement,
} = require("../controllers/disbursement.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/role.middleware");
const tenantMiddleware = require("../middleware/tenant.middleware");

const router = express.Router();

router.use(authMiddleware, requirePermission("managePayments"), tenantMiddleware);

router.get("/", listDisbursements);
router.post("/", createDisbursement);
router.patch("/:id", updateDisbursement);
router.delete("/:id", deleteDisbursement);

module.exports = router;
