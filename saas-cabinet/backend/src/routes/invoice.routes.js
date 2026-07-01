const express = require("express");
const {
  listInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  registerInvoicePayment,
  listInvoicePayments,
  getInvoiceSummary,
} = require("../controllers/invoice.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/role.middleware");
const tenantMiddleware = require("../middleware/tenant.middleware");

const router = express.Router();

router.use(authMiddleware, requirePermission("manageInvoices"), tenantMiddleware);

router.get("/summary", getInvoiceSummary);
router.get("/", listInvoices);
router.get("/:id", getInvoiceById);
router.post("/", createInvoice);
router.patch("/:id", updateInvoice);
router.delete("/:id", deleteInvoice);
router.get("/:id/payments", listInvoicePayments);
router.post("/:id/payments", registerInvoicePayment);

module.exports = router;
