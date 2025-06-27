import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const hackathonProjectSchema = new mongoose.Schema(
  {
    hackathonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    teamMembers: {
      type: [String],
      default: [],
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
hackathonProjectSchema.index({ hackathonId: 1, userId: 1 });
hackathonProjectSchema.index({ userId: 1, createdAt: -1 });
hackathonProjectSchema.index({ progress: 1 });

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
