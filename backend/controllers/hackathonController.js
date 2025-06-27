import Hackathon from "../models/Hackathon.js";
import HackathonProject from "../models/HackathonProject.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import scraperService from "../services/scraperService.js";

// Scrape and analyze hackathon website
const scrapeHackathon = asyncHandler(async (req, res) => {
  const { url } = req.body;

  if (!url) {
    throw new ApiError(400, "URL is required");
  }

  console.log("Scraping hackathon URL:", url);
  console.log("User ID:", req.user.id);

  try {
    // Use the scraper service to extract hackathon data
    const extractedData = await scraperService.scrapeHackathon(url);
    console.log("Extracted data:", extractedData);

    // Create hackathon record
    const hackathon = new Hackathon({
      userId: req.user.id,
      ...extractedData,
    });

    console.log("Hackathon object before save:", hackathon);

    await hackathon.save();
    console.log("Hackathon saved successfully:", hackathon._id);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          hackathon,
          "Hackathon scraped and saved successfully"
        )
      );
  } catch (error) {
    console.error("Scraping error:", error);
    throw new ApiError(
      500,
      `Failed to scrape hackathon website: ${error.message}`
    );
  }
});

// Get all hackathons for a user
const getHackathons = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, isActive } = req.query;

  console.log("Getting hackathons for user:", req.user.id);
  console.log("Query params:", { page, limit, isActive });

  const query = { userId: req.user.id };
  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
  };

  const hackathons = await Hackathon.paginate(query, options);
  console.log("Found hackathons:", hackathons);

  res
    .status(200)
    .json(
      new ApiResponse(200, hackathons, "Hackathons retrieved successfully")
    );
});

// Get a specific hackathon
const getHackathon = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  const hackathon = await Hackathon.findOne({
    _id: hackathonId,
    userId: req.user.id,
  });

  if (!hackathon) {
    throw new ApiError(404, "Hackathon not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, hackathon, "Hackathon retrieved successfully"));
});

// Update hackathon
const updateHackathon = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;
  const updateData = req.body;

  const hackathon = await Hackathon.findOneAndUpdate(
    {
      _id: hackathonId,
      userId: req.user.id,
    },
    updateData,
    { new: true, runValidators: true }
  );

  if (!hackathon) {
    throw new ApiError(404, "Hackathon not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, hackathon, "Hackathon updated successfully"));
});

// Delete hackathon
const deleteHackathon = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  const hackathon = await Hackathon.findOneAndDelete({
    _id: hackathonId,
    userId: req.user.id,
  });

  if (!hackathon) {
    throw new ApiError(404, "Hackathon not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Hackathon deleted successfully"));
});

// Import project to hackathon
const importProject = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;
  const projectData = req.body;

  // Verify hackathon exists and belongs to user
  const hackathon = await Hackathon.findOne({
    _id: hackathonId,
    userId: req.user.id,
  });

  if (!hackathon) {
    throw new ApiError(404, "Hackathon not found");
  }

  // Check if project already exists for this hackathon
  const existingProject = await HackathonProject.findOne({
    hackathonId: hackathonId,
    userId: req.user.id,
  });

  if (existingProject) {
    // Update existing project
    Object.assign(existingProject, projectData);
    await existingProject.save();

    res
      .status(200)
      .json(
        new ApiResponse(200, existingProject, "Project updated successfully")
      );
  } else {
    // Create new project
    const project = new HackathonProject({
      hackathonId: hackathonId,
      userId: req.user.id,
      ...projectData,
    });

    await project.save();

    res
      .status(201)
      .json(new ApiResponse(201, project, "Project imported successfully"));
  }
});

// Get project for hackathon
const getProject = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  const project = await HackathonProject.findOne({
    hackathonId: hackathonId,
    userId: req.user.id,
  });

  if (!project) {
    throw new ApiError(404, "Project not found for this hackathon");
  }

  res
    .status(200)
    .json(new ApiResponse(200, project, "Project retrieved successfully"));
});

// Update project
const updateProject = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;
  const updateData = req.body;

  const project = await HackathonProject.findOneAndUpdate(
    {
      hackathonId: hackathonId,
      userId: req.user.id,
    },
    updateData,
    { new: true, runValidators: true }
  );

  if (!project) {
    throw new ApiError(404, "Project not found for this hackathon");
  }

  res
    .status(200)
    .json(new ApiResponse(200, project, "Project updated successfully"));
});

// Delete project
const deleteProject = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  const project = await HackathonProject.findOneAndDelete({
    hackathonId: hackathonId,
    userId: req.user.id,
  });

  if (!project) {
    throw new ApiError(404, "Project not found for this hackathon");
  }

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Project deleted successfully"));
});

export {
  scrapeHackathon,
  getHackathons,
  getHackathon,
  updateHackathon,
  deleteHackathon,
  importProject,
  getProject,
  updateProject,
  deleteProject,
};
