const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users.controller");
const { protect } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/role.middleware");

// Only users with the "manageUsers" permission can manage user accounts
router.use(protect, requirePermission("manageUsers"));

router.get("/", usersController.listOrganizationUsers);
router.post("/", usersController.createNewUser);
router.patch("/:id", usersController.updateExistingUser);
router.delete("/:id", usersController.deleteExistingUser);

module.exports = router;
