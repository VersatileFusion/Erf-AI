import express from "express";
import aiRoutes from "./aiRoutes.js";
import datasetRoutes from "./datasetRoutes.js";

const router = express.Router();

// API health check
router.get("/health", (req, res) => {
  console.log("Health check endpoint accessed");
  res.status(200).json({ status: "OK", message: "API is running" });
});

// Mount API routes
router.use("/ai", aiRoutes);
router.use("/datasets", datasetRoutes);

console.log("Main API routes initialized");
export default router;
