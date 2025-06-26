import express from "express";
import {
  getFavoriteIdeas,
  addFavoriteIdea,
  updateFavoriteIdea,
  deleteFavoriteIdea,
  checkFavoriteStatus,
  getFavoriteStats,
} from "../controllers/favoriteIdeaController.js";

const router = express.Router();

// Get all favorite ideas for a user
router.get("/", getFavoriteIdeas);

// Add a new favorite idea
router.post("/", addFavoriteIdea);

// Update a favorite idea
router.put("/:ideaId", updateFavoriteIdea);

// Delete a favorite idea
router.delete("/:ideaId", deleteFavoriteIdea);

// Check if an idea is favorited
router.get("/check", checkFavoriteStatus);

// Get favorite ideas statistics
router.get("/stats", getFavoriteStats);

export default router;
