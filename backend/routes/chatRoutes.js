import express from "express";
import {
  getUserChatSessions,
  createChatSession,
  getChatMessages,
  sendMessage,
  updateChatSession,
  deleteChatSession,
  toggleMessageStar,
  getChatStats,
} from "../controllers/chatController.js";

const router = express.Router();

// Chat session routes
router.get("/sessions", getUserChatSessions);
router.post("/sessions", createChatSession);
router.put("/sessions/:sessionId", updateChatSession);
router.delete("/sessions/:sessionId", deleteChatSession);

// Message routes
router.get("/sessions/:sessionId/messages", getChatMessages);
router.post("/sessions/:sessionId/messages", sendMessage);
router.patch("/messages/:messageId/star", toggleMessageStar);

// Statistics route
router.get("/stats", getChatStats);

export default router;
