const express = require("express");
const {
  listAllClients,
  createNewClient,
  uploadOneClientPhoto,
  uploadOneClientIdentityDocument,
  getOneClient,
  updateOneClient,
  removeOneClient,
  getClientProcedures,
  updateClientProcedures,
  updateClientStatus,
} = require("../controllers/client.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/role.middleware");
const tenantMiddleware = require("../middleware/tenant.middleware");
const { upload, uploadLogo } = require("../utils/upload");

const router = express.Router();

router.use(authMiddleware, requirePermission("manageClients"), tenantMiddleware);

router.get("/", listAllClients);
router.post("/", createNewClient);
router.post("/:id/photo", uploadLogo.single("photo"), uploadOneClientPhoto);
router.post("/:id/identity-document", upload.single("idDocument"), uploadOneClientIdentityDocument);
router.get("/:id", getOneClient);
router.get("/:id/procedures", getClientProcedures);
router.put("/:id/procedures", updateClientProcedures);
router.patch("/:id", updateOneClient);
router.patch("/:id/status", updateClientStatus);
router.delete("/:id", removeOneClient);

module.exports = router;

