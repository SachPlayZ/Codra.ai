import FavoriteIdea from "../models/FavoriteIdea.js";

// Get all favorite ideas for a user
export const getFavoriteIdeas = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, priority, complexity, search } = req.query;

    let query = { userId };

    if (priority) query.priority = priority;
    if (complexity) query.implementationComplexity = complexity;

    if (search) {
      query.$or = [
        { ideaTitle: { $regex: search, $options: "i" } },
        { ideaDescription: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    const ideas = await FavoriteIdea.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await FavoriteIdea.countDocuments(query);

    res.json({
      ideas,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalIdeas: total,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching favorite ideas:", error);
    res.status(500).json({ error: "Failed to fetch favorite ideas" });
  }
};

// Add a new favorite idea
export const addFavoriteIdea = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      ideaTitle,
      ideaDescription,
      usp,
      techStack,
      targetAudience,
      implementationComplexity,
      estimatedTimeline,
      marketPotential,
      socialImpact,
      originalMessageId,
      tags,
      notes,
      priority,
    } = req.body;

    // Check if this idea is already favorited
    const existingFavorite = await FavoriteIdea.findOne({
      userId,
      ideaTitle,
      ideaDescription,
    });

    if (existingFavorite) {
      return res
        .status(409)
        .json({ error: "This idea is already in your favorites" });
    }

    const favoriteIdea = new FavoriteIdea({
      userId,
      ideaTitle,
      ideaDescription,
      usp,
      techStack: techStack || [],
      targetAudience: targetAudience || [],
      implementationComplexity,
      estimatedTimeline,
      marketPotential,
      socialImpact: socialImpact || [],
      originalMessageId,
      tags: tags || [],
      notes: notes || "",
      priority: priority || "Medium",
    });

    await favoriteIdea.save();

    res.status(201).json(favoriteIdea);
  } catch (error) {
    console.error("Error adding favorite idea:", error);
    res.status(500).json({ error: "Failed to add favorite idea" });
  }
};

// Update a favorite idea
export const updateFavoriteIdea = async (req, res) => {
  try {
    const { ideaId } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.userId;
    delete updates._id;

    const favoriteIdea = await FavoriteIdea.findOneAndUpdate(
      { _id: ideaId, userId },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!favoriteIdea) {
      return res.status(404).json({ error: "Favorite idea not found" });
    }

    res.json(favoriteIdea);
  } catch (error) {
    console.error("Error updating favorite idea:", error);
    res.status(500).json({ error: "Failed to update favorite idea" });
  }
};

// Delete a favorite idea
export const deleteFavoriteIdea = async (req, res) => {
  try {
    const { ideaId } = req.params;
    const userId = req.user.id;

    const favoriteIdea = await FavoriteIdea.findOneAndDelete({
      _id: ideaId,
      userId,
    });

    if (!favoriteIdea) {
      return res.status(404).json({ error: "Favorite idea not found" });
    }

    res.json({ message: "Favorite idea deleted successfully" });
  } catch (error) {
    console.error("Error deleting favorite idea:", error);
    res.status(500).json({ error: "Failed to delete favorite idea" });
  }
};

// Check if an idea is already favorited
export const checkFavoriteStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ideaTitle, ideaDescription } = req.query;

    if (!ideaTitle || !ideaDescription) {
      return res
        .status(400)
        .json({ error: "ideaTitle and ideaDescription are required" });
    }

    const existingFavorite = await FavoriteIdea.findOne({
      userId,
      ideaTitle,
      ideaDescription,
    });

    res.json({
      isFavorited: !!existingFavorite,
      favoriteId: existingFavorite?._id,
    });
  } catch (error) {
    console.error("Error checking favorite status:", error);
    res.status(500).json({ error: "Failed to check favorite status" });
  }
};

// Get favorite ideas statistics
export const getFavoriteStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await FavoriteIdea.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalIdeas: { $sum: 1 },
          highPriority: {
            $sum: { $cond: [{ $eq: ["$priority", "High"] }, 1, 0] },
          },
          mediumPriority: {
            $sum: { $cond: [{ $eq: ["$priority", "Medium"] }, 1, 0] },
          },
          lowPriority: {
            $sum: { $cond: [{ $eq: ["$priority", "Low"] }, 1, 0] },
          },
          beginnerComplexity: {
            $sum: {
              $cond: [{ $eq: ["$implementationComplexity", "Beginner"] }, 1, 0],
            },
          },
          intermediateComplexity: {
            $sum: {
              $cond: [
                { $eq: ["$implementationComplexity", "Intermediate"] },
                1,
                0,
              ],
            },
          },
          advancedComplexity: {
            $sum: {
              $cond: [{ $eq: ["$implementationComplexity", "Advanced"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalIdeas: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
      beginnerComplexity: 0,
      intermediateComplexity: 0,
      advancedComplexity: 0,
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching favorite stats:", error);
    res.status(500).json({ error: "Failed to fetch favorite statistics" });
  }
};
