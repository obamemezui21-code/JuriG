// app.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const errorHandler = require("./middleware/error.handler");

const app = express();

// --- MIDDLEWARE ---

// 1. Enable Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow multiple localhost ports for development
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 2. Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Pour les formulaires

// 3. Serve uploaded files statically from the 'uploads' directory
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads"), {
    setHeaders: (res) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );
    },
  })
);

// 4. Serve the brochure static site through the app
const brochurePath = path.join(__dirname, "..", "..", "brochure-produit");
app.use("/brochure", express.static(brochurePath));
app.get("/brochure", (_req, res) => {
  res.sendFile(path.join(brochurePath, "index.html"));
});

// --- HEALTH CHECK ---
app.get("/api/health", (_req, res) => {
  res.status(200).json({ message: "API opérationnelle." });
});

// --- ROUTES ---
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/organization", require("./routes/organization.routes"));
app.use("/api/clients", require("./routes/client.routes"));
app.use("/api/cases", require("./routes/case.routes"));
app.use("/api/services", require("./routes/service.routes"));
app.use("/api/procedures", require("./routes/procedure.routes"));
app.use("/api/users", require("./routes/users.routes"));
app.use("/api/invoices", require("./routes/invoice.routes"));
app.use("/api/payments", require("./routes/payment.routes"));
app.use("/api/disbursements", require("./routes/disbursement.routes"));
app.use("/api/expenses", require("./routes/disbursement.routes"));

// --- ERROR HANDLING ---
app.use(errorHandler);

module.exports = app;