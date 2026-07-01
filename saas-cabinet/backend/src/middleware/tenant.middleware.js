const tenantMiddleware = (req, res, next) => {
  if (req.user && req.user.organizationId) {
    req.organizationId = req.user.organizationId;
    next();
  } else {
    // This should technically be a 500 error if it's reached, as authMiddleware should have already run.
    res.status(401).json({ message: "Not authorized, no organization identified" });
  }
};

module.exports = tenantMiddleware;