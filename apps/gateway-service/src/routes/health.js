import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Gateway is up and running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(), 
    service: "Xynapse-API-Gateway",
    env: process.env.NODE_ENV || "development"
  });
});

export default router;