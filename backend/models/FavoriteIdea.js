import mongoose from "mongoose";

const favoriteIdeaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ideaTitle: {
      type: String,
      required: true,
      trim: true,
    },
    ideaDescription: {
      type: String,
      required: true,
    },
    usp: {
      type: String,
      required: true,
    },
    techStack: [
      {
        type: String,
        trim: true,
      },
    ],
    targetAudience: [
      {
        type: String,
        trim: true,
      },
    ],
    implementationComplexity: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      required: true,
    },
    estimatedTimeline: {
      type: String,
      enum: ["12 hrs", "24 hrs", "36 hrs", "48 hrs"],
      required: true,
    },
    marketPotential: {
      type: String,
      required: true,
    },
    socialImpact: [
      {
        type: String,
        trim: true,
      },
    ],
    // Reference to the original message (optional, for tracking)
    originalMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatMessage",
      default: null,
    },
    // Tags for organization
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    // Notes that user can add
    notes: {
      type: String,
      default: "",
    },
    // Priority level
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for efficient user queries
favoriteIdeaSchema.index({ userId: 1, createdAt: -1 });
favoriteIdeaSchema.index({ userId: 1, priority: 1 });
favoriteIdeaSchema.index({ userId: 1, implementationComplexity: 1 });

const FavoriteIdea = mongoose.model("FavoriteIdea", favoriteIdeaSchema);

export default FavoriteIdea;
