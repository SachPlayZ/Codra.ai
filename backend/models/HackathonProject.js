import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const hackathonProjectSchema = new mongoose.Schema(
  {
    hackathonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true,
    },
    // Replace single userId with users array for multi-user access
    users: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        username: String,
        displayName: String,
        avatar: String,
        role: {
          type: String,
          enum: ["owner", "member"],
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Keep backward compatibility for existing projects
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    usp: {
      type: String,
      required: true,
    },
    techStack: {
      type: [String],
      required: true,
    },
    targetAudience: {
      type: [String],
      required: true,
    },
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
    socialImpact: {
      type: [String],
      required: true,
    },
    sourceMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatMessage",
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
    progress: {
      type: String,
      enum: ["planning", "development", "testing", "submission", "completed"],
      default: "planning",
    },
    repositoryUrl: {
      type: String,
      default: "",
    },
    demoUrl: {
      type: String,
      default: "",
    },
    submissionUrl: {
      type: String,
      default: "",
    },
    // Team collaboration
    teamCode: {
      type: String,
      unique: true,
      sparse: true, // Allows null values but ensures uniqueness when set
    },
    teamOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    teamMembers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        username: String,
        displayName: String,
        avatar: String,
        role: {
          type: String,
          enum: ["owner", "member"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    teamSettings: {
      allowJoin: {
        type: Boolean,
        default: true,
      },
      maxMembers: {
        type: Number,
        default: 6,
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    milestones: [
      {
        title: String,
        description: String,
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: Date,
        dueDate: Date,
        priority: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium",
        },
        estimatedHours: {
          type: String,
          default: "2-4 hours",
        },
      },
    ],
    submissionAnswers: [
      {
        id: String,
        question: String,
        answer: String,
        category: {
          type: String,
          enum: ["overview", "technical", "challenges", "track"],
          default: "overview",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add pagination plugin
hackathonProjectSchema.plugin(mongoosePaginate);

// Indexes for better query performance
hackathonProjectSchema.index({ hackathonId: 1, userId: 1 }); // Backward compatibility
hackathonProjectSchema.index({ hackathonId: 1, "users.userId": 1 }); // New multi-user support
hackathonProjectSchema.index({ "users.userId": 1, createdAt: -1 });
hackathonProjectSchema.index({ userId: 1, createdAt: -1 }); // Backward compatibility
hackathonProjectSchema.index({ progress: 1 });
hackathonProjectSchema.index({ teamCode: 1 });
hackathonProjectSchema.index({ "teamMembers.userId": 1 });

// Helper method to check if a user has access to this project
hackathonProjectSchema.methods.hasUserAccess = function (userId) {
  const userIdStr = userId.toString();

  // Check if user is in the new users array
  const hasUserArrayAccess =
    this.users &&
    this.users.some((user) => user.userId.toString() === userIdStr);

  // Check backward compatibility with single userId
  const hasLegacyAccess = this.userId && this.userId.toString() === userIdStr;

  return hasUserArrayAccess || hasLegacyAccess;
};

// Helper method to get user's role in the project
hackathonProjectSchema.methods.getUserRole = function (userId) {
  const userIdStr = userId.toString();

  // Check in new users array
  const userInArray =
    this.users &&
    this.users.find((user) => user.userId.toString() === userIdStr);

  if (userInArray) {
    return userInArray.role;
  }

  // Check backward compatibility - if userId matches, they're the owner
  if (this.userId && this.userId.toString() === userIdStr) {
    return "owner";
  }

  return null;
};

// Helper method to add a user to the project
hackathonProjectSchema.methods.addUser = function (userInfo) {
  // Initialize users array if it doesn't exist
  if (!this.users) {
    this.users = [];
  }

  // Check if user already exists
  const existingUser = this.users.find(
    (user) => user.userId.toString() === userInfo.userId.toString()
  );

  if (!existingUser) {
    this.users.push({
      userId: userInfo.userId,
      username: userInfo.username,
      displayName: userInfo.displayName,
      avatar: userInfo.avatar,
      role: userInfo.role,
      joinedAt: new Date(),
    });
  }

  return this;
};

// Virtual for project URL (if needed)
hackathonProjectSchema.virtual("projectUrl").get(function () {
  return `/hackathons/${this.hackathonId}/project/${this._id}`;
});

// Ensure virtual fields are serialized
hackathonProjectSchema.set("toJSON", { virtuals: true });

const HackathonProject = mongoose.model(
  "HackathonProject",
  hackathonProjectSchema
);

export default HackathonProject;
