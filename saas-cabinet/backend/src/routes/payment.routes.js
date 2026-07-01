const express = require("express");
const {
  listPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentSummary,
  syncInvoicesFromPayments,
  listSyncHistory,
} = require("../controllers/payment.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/role.middleware");
const tenantMiddleware = require("../middleware/tenant.middleware");

const router = express.Router();

router.use(authMiddleware, requirePermission("managePayments"), tenantMiddleware);

router.get("/summary", getPaymentSummary);
router.get("/sync-history", listSyncHistory);
router.post("/sync-invoices", syncInvoicesFromPayments);
router.get("/", listPayments);
router.get("/:id", getPaymentById);
router.post("/", createPayment);
router.patch("/:id", updatePayment);
router.delete("/:id", deletePayment);

module.exports = router;
