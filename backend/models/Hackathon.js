import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const subTrackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  prizes: {
    first: {
      type: String,
      default: "",
    },
    second: {
      type: String,
      default: "",
    },
    third: {
      type: String,
      default: "",
    },
  },
});

const trackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  totalPrize: {
    type: String,
    default: "",
  },
  subTracks: [subTrackSchema],
});

const prizeSchema = new mongoose.Schema({
  amount: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
});

const hackathonSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    endDateTime: {
      type: Date,
      default: null,
    },
    timezone: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "",
    },
    totalPrizePool: {
      type: String,
      default: "",
    },
    tracks: [trackSchema],
    prizes: [prizeSchema],
    rules: [String],
    link: {
      type: String,
      required: true,
    },
    scrapedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Add pagination plugin
hackathonSchema.plugin(mongoosePaginate);

// Index for efficient queries
hackathonSchema.index({ userId: 1, createdAt: -1 });
hackathonSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model("Hackathon", hackathonSchema);
