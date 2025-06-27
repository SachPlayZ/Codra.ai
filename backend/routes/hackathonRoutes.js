import express from "express";
import {
  scrapeHackathon,
  getHackathons,
  getHackathon,
  updateHackathon,
  deleteHackathon,
  importProject,
  getProject,
  updateProject,
  deleteProject,
} from "../controllers/hackathonController.js";

const router = express.Router();

// Scrape and add new hackathon
router.post("/scrape", scrapeHackathon);

// Get all hackathons for user
router.get("/", getHackathons);

// Get specific hackathon
router.get("/:hackathonId", getHackathon);

// Update hackathon
router.put("/:hackathonId", updateHackathon);

// Delete hackathon
router.delete("/:hackathonId", deleteHackathon);

// Project routes
// Import/create project for hackathon
router.post("/:hackathonId/project", importProject);

// Get project for hackathon
router.get("/:hackathonId/project", getProject);

// Update project for hackathon
router.put("/:hackathonId/project", updateProject);

// Delete project for hackathon
router.delete("/:hackathonId/project", deleteProject);

export default router;
