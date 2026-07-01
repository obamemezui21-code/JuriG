const express = require("express");
const {
  listAllProcedures,
  createNewProcedure,
  updateOneProcedure,
  getOneProcedure,
  deleteOneProcedure,
} = require("../controllers/procedure.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/role.middleware");
const tenantMiddleware = require("../middleware/tenant.middleware");

const router = express.Router();

router.use(authMiddleware, requirePermission("manageProcedures"), tenantMiddleware);

router.get("/", listAllProcedures);
router.post("/", createNewProcedure);
router.get("/:id", getOneProcedure);
router.patch("/:id", updateOneProcedure);
router.delete("/:id", deleteOneProcedure);

module.exports = router;
