import ChatSession from "../models/ChatSession.js";
import ChatMessage from "../models/ChatMessage.js";
import MinervaAgent from "../services/minervaAgent.js";

const minerva = new MinervaAgent();

// Get all chat sessions for a user
export const getUserChatSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, archived, search } = req.query;

    let query = { userId };

    if (archived === "true") query.isArchived = true;
    else if (archived !== "true") query.isArchived = false; // Default to non-archived

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const sessions = await ChatSession.find(query)
      .sort({ lastMessageAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await ChatSession.countDocuments(query);

    res.json({
      sessions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalSessions: total,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    res.status(500).json({ error: "Failed to fetch chat sessions" });
  }
};

// Create a new chat session
export const createChatSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, tags, hackathonId } = req.body;

    const newSession = new ChatSession({
      userId,
      title: title || "New Minerva Session",
      description: description || "",
      tags: tags || [],
      hackathonId: hackathonId || null,
    });

    await newSession.save();

    res.status(201).json(newSession);
  } catch (error) {
    console.error("Error creating chat session:", error);
    res.status(500).json({ error: "Failed to create chat session" });
  }
};

// Get messages for a specific chat session
export const getChatMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    // Verify session belongs to user
    const session = await ChatSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    const messages = await ChatMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await ChatMessage.countDocuments({ sessionId });

    res.json({
      messages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Send a message and get AI response
export const sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { content, messageMode = "text" } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Message content is required" });
    }

    // Verify session belongs to user
    const session = await ChatSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    // Get recent chat history for context
    const recentMessages = await ChatMessage.find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const chatHistory = recentMessages.reverse();

    // Save user message
    const userMessage = new ChatMessage({
      sessionId,
      userId,
      type: "user",
      content: content.trim(),
      messageMode,
    });

    await userMessage.save();

    try {
      // Get AI response
      const aiResponse = await minerva.processMessage(content, chatHistory);

      // Save AI message
      const aiMessage = new ChatMessage({
        sessionId,
        userId,
        type: "assistant",
        content: aiResponse.content,
        messageMode: aiResponse.mode,
        ideaData: aiResponse.ideaData || null,
        tokensUsed: aiResponse.tokensUsed,
        processingTime: aiResponse.processingTime,
      });

      await aiMessage.save();

      // Update session metadata
      await ChatSession.findByIdAndUpdate(sessionId, {
        lastMessageAt: new Date(),
        $inc: { messageCount: 2 }, // User message + AI response
        // Update title if this is the first user message
        ...(session.messageCount === 0 && {
          title: minerva.generateSessionTitle(content),
        }),
      });

      res.json({
        userMessage,
        aiMessage,
        session: {
          id: sessionId,
          messageCount: session.messageCount + 2,
        },
      });
    } catch (aiError) {
      console.error("AI processing error:", aiError);

      // Save error response
      const errorMessage = new ChatMessage({
        sessionId,
        userId,
        type: "assistant",
        content:
          "I apologize, but I'm experiencing some technical difficulties right now. Please try your message again in a moment!",
        messageMode: "text",
      });

      await errorMessage.save();

      // Update session
      await ChatSession.findByIdAndUpdate(sessionId, {
        lastMessageAt: new Date(),
        $inc: { messageCount: 2 },
      });

      res.status(500).json({
        error: "AI processing failed",
        userMessage,
        aiMessage: errorMessage,
      });
    }
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Update chat session (title, starred, archived, etc.)
export const updateChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.userId;
    delete updates.messageCount;
    delete updates._id;

    const session = await ChatSession.findOneAndUpdate(
      { _id: sessionId, userId },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!session) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    res.json(session);
  } catch (error) {
    console.error("Error updating chat session:", error);
    res.status(500).json({ error: "Failed to update chat session" });
  }
};

// Delete a chat session and all its messages
export const deleteChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Verify session belongs to user
    const session = await ChatSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    // Delete all messages in the session
    await ChatMessage.deleteMany({ sessionId });

    // Delete the session
    await ChatSession.findByIdAndDelete(sessionId);

    res.json({ message: "Chat session deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    res.status(500).json({ error: "Failed to delete chat session" });
  }
};

// Star/unstar a message
export const toggleMessageStar = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await ChatMessage.findOne({ _id: messageId, userId });
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    message.isStarred = !message.isStarred;
    await message.save();

    res.json({ messageId, isStarred: message.isStarred });
  } catch (error) {
    console.error("Error toggling message star:", error);
    res.status(500).json({ error: "Failed to update message" });
  }
};

// Get user's chat statistics
export const getChatStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await ChatSession.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalMessages: { $sum: "$messageCount" },
          archivedSessions: {
            $sum: { $cond: [{ $eq: ["$isArchived", true] }, 1, 0] },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalSessions: 0,
      totalMessages: 0,
      archivedSessions: 0,
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching chat stats:", error);
    res.status(500).json({ error: "Failed to fetch chat statistics" });
  }
};
