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
  getTodos,
  addTodo,
  updateTodo,
  deleteTodo,
  generateTodos,
  generateAIAnswer,
  getGitHubCommits,
  generateTeamCode,
  joinTeamByCode,
  getTeamInfo,
  removeTeamMember,
  leaveTeam,
  updateTeamSettings,
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

// Todo routes for project
// Get todos for project
router.get("/:hackathonId/project/todos", getTodos);

// Add todo to project
router.post("/:hackathonId/project/todos", addTodo);

// Update todo in project
router.put("/:hackathonId/project/todos/:todoId", updateTodo);

// Delete todo from project
router.delete("/:hackathonId/project/todos/:todoId", deleteTodo);

// Generate AI todos for project
router.post("/:hackathonId/project/todos/generate", generateTodos);

// Generate AI answer for submission question
router.post("/:hackathonId/project/ai/answer", generateAIAnswer);

// Fetch GitHub commits for a project
router.get("/:hackathonId/project/github/commits", getGitHubCommits);

// Team collaboration routes
// Generate team code for project
router.post("/:hackathonId/project/team/generate", generateTeamCode);

// Join team using code
router.post("/team/join", joinTeamByCode);

// Get team information
router.get("/:hackathonId/project/team", getTeamInfo);

// Remove team member (owner only)
router.delete("/:hackathonId/project/team/members/:memberId", removeTeamMember);

// Leave team (member only)
router.post("/:hackathonId/project/team/leave", leaveTeam);

// Update team settings (owner only)
router.put("/:hackathonId/project/team/settings", updateTeamSettings);

export default router;
