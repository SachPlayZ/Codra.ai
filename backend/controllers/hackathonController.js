import Hackathon from "../models/Hackathon.js";
import HackathonProject from "../models/HackathonProject.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import scraperService from "../services/scraperService.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

// Get all hackathons for a user (includes hackathons they added + hackathons they have projects for)
const getHackathons = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, isActive } = req.query;

  console.log("Getting hackathons for user:", req.user.id);
  console.log("Query params:", { page, limit, isActive });

  // Get hackathons the user explicitly added
  const userHackathons = await Hackathon.find({ userId: req.user.id });

  // Get hackathons where the user has projects (but didn't explicitly add)
  // Include both legacy userId and new users array
  const userProjects = await HackathonProject.find({
    $or: [{ userId: req.user.id }, { "users.userId": req.user.id }],
  });
  const projectHackathonIds = userProjects.map(
    (project) => project.hackathonId
  );

  // Get hackathons from projects that aren't already in user's explicit list
  const userHackathonIds = userHackathons.map((h) => h._id.toString());
  const additionalHackathonIds = projectHackathonIds.filter(
    (id) => !userHackathonIds.includes(id.toString())
  );

  const additionalHackathons = await Hackathon.find({
    _id: { $in: additionalHackathonIds },
  });

  // Combine all hackathons
  let allHackathons = [...userHackathons, ...additionalHackathons];

  // Apply isActive filter if specified
  if (isActive !== undefined) {
    const isActiveFilter = isActive === "true";
    allHackathons = allHackathons.filter((hackathon) => {
      if (
        hackathon.startDate === "TBD" ||
        hackathon.startDate === "To be announced"
      ) {
        return isActiveFilter; // Upcoming counts as active
      }

      const now = new Date();
      const startDate = new Date(hackathon.startDate);
      const endDate = new Date(hackathon.endDate);

      const isCurrentlyActive = now >= startDate && now <= endDate;
      const isUpcoming = now < startDate;

      return isActiveFilter
        ? isCurrentlyActive || isUpcoming
        : !isCurrentlyActive && !isUpcoming;
    });
  }

  // Sort by created date (newest first)
  allHackathons.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Apply pagination manually since we combined results
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedHackathons = allHackathons.slice(startIndex, endIndex);

  // Create pagination response similar to mongoose-paginate
  const result = {
    docs: paginatedHackathons,
    totalDocs: allHackathons.length,
    limit: parseInt(limit),
    page: parseInt(page),
    totalPages: Math.ceil(allHackathons.length / parseInt(limit)),
    hasNextPage: endIndex < allHackathons.length,
    hasPrevPage: parseInt(page) > 1,
  };

  console.log("Found hackathons:", result);

  res
    .status(200)
    .json(new ApiResponse(200, result, "Hackathons retrieved successfully"));
});

// Get a specific hackathon
const getHackathon = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  // First check if user explicitly added this hackathon
  let hackathon = await Hackathon.findOne({
    _id: hackathonId,
    userId: req.user.id,
  });

  // If not found, check if user has a project for this hackathon (including team access)
  if (!hackathon) {
    const userProject = await HackathonProject.findOne({
      hackathonId: hackathonId,
      $or: [{ userId: req.user.id }, { "users.userId": req.user.id }],
    });

    if (userProject) {
      // Verify user has access to the project
      if (userProject.hasUserAccess(req.user.id)) {
        // User has a project for this hackathon, so they should be able to access it
        hackathon = await Hackathon.findById(hackathonId);
      }
    }
  }

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

  // Verify hackathon exists and user has access
  let hackathon = await Hackathon.findOne({
    _id: hackathonId,
    userId: req.user.id,
  });

  // If not found as owner, check if user has a project for this hackathon (joined via team)
  if (!hackathon) {
    const userProject = await HackathonProject.findOne({
      hackathonId: hackathonId,
      $or: [{ userId: req.user.id }, { "users.userId": req.user.id }],
    });

    if (userProject) {
      hackathon = await Hackathon.findById(hackathonId);
    }
  }

  if (!hackathon) {
    throw new ApiError(404, "Hackathon not found");
  }

  // Check if project already exists for this hackathon
  const existingProject = await HackathonProject.findOne({
    hackathonId: hackathonId,
    $or: [{ userId: req.user.id }, { "users.userId": req.user.id }],
  });

  if (existingProject) {
    // Check if user has permission to update this project
    if (!existingProject.hasUserAccess(req.user.id)) {
      throw new ApiError(
        403,
        "You don't have permission to update this project"
      );
    }

    // Update existing project
    Object.assign(existingProject, projectData);
    await existingProject.save();

    res
      .status(200)
      .json(
        new ApiResponse(200, existingProject, "Project updated successfully")
      );
  } else {
    // Create new project with users array
    const project = new HackathonProject({
      hackathonId: hackathonId,
      userId: req.user.id, // Keep for backward compatibility
      users: [
        {
          userId: req.user.id,
          username: req.user.username,
          displayName: req.user.displayName || req.user.username,
          avatar: req.user.avatar,
          role: "owner",
          joinedAt: new Date(),
        },
      ],
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
    $or: [{ userId: req.user.id }, { "users.userId": req.user.id }],
  });

  if (!project) {
    throw new ApiError(404, "Project not found for this hackathon");
  }

  // Verify user has access
  if (!project.hasUserAccess(req.user.id)) {
    throw new ApiError(403, "You don't have access to this project");
  }

  res
    .status(200)
    .json(new ApiResponse(200, project, "Project retrieved successfully"));
});

// Update project
const updateProject = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;
  const updateData = req.body;

  const project = await HackathonProject.findOne({
    hackathonId: hackathonId,
    $or: [{ userId: req.user.id }, { "users.userId": req.user.id }],
  });

  if (!project) {
    throw new ApiError(404, "Project not found for this hackathon");
  }

  // Verify user has access
  if (!project.hasUserAccess(req.user.id)) {
    throw new ApiError(403, "You don't have access to this project");
  }

  // Update the project
  Object.assign(project, updateData);
  await project.save();

  res
    .status(200)
    .json(new ApiResponse(200, project, "Project updated successfully"));
});

// Delete project
const deleteProject = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  // Find the project first to check permissions
  const project = await HackathonProject.findOne({
    hackathonId: hackathonId,
    $or: [{ userId: req.user.id }, { "users.userId": req.user.id }],
  });

  if (!project) {
    throw new ApiError(404, "Project not found for this hackathon");
  }

  // Check if user has permission to delete (only owners can delete)
  const userRole = project.getUserRole(req.user.id);
  if (userRole !== "owner") {
    throw new ApiError(403, "Only project owners can delete the project");
  }

  // Delete the project
  await HackathonProject.findByIdAndDelete(project._id);

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Project deleted successfully"));
});

// Get todos for project
const getTodos = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  const project = await HackathonProject.findOne({
    hackathonId: hackathonId,
    $or: [{ userId: req.user.id }, { "users.userId": req.user.id }],
  });

  if (!project) {
    throw new ApiError(404, "Project not found for this hackathon");
  }

  // Verify user has access
  if (!project.hasUserAccess(req.user.id)) {
    throw new ApiError(403, "You don't have access to this project");
  }

  // Convert milestones to todo format
  const todos = project.milestones.map((milestone) => ({
    id: milestone._id.toString(),
    title: milestone.title,
    description: milestone.description,
    completed: milestone.completed,
    priority: milestone.priority || "medium",
    estimatedHours: milestone.estimatedHours || "2-4 hours",
    dueDate: milestone.dueDate,
    createdAt: milestone._id.getTimestamp().toISOString(),
  }));

  res
    .status(200)
    .json(new ApiResponse(200, todos, "Todos retrieved successfully"));
});

// Add todo to project
const addTodo = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;
  const { title, description, priority, dueDate, estimatedHours } = req.body;

  if (!title) {
    throw new ApiError(400, "Title is required");
  }

  const project = await HackathonProject.findOne({
    hackathonId: hackathonId,
    $or: [{ userId: req.user.id }, { "users.userId": req.user.id }],
  });

  if (!project) {
    throw new ApiError(404, "Project not found for this hackathon");
  }

  // Verify user has access
  if (!project.hasUserAccess(req.user.id)) {
    throw new ApiError(403, "You don't have access to this project");
  }

  const newMilestone = {
    title,
    description: description || "",
    completed: false,
    priority: priority || "medium",
    estimatedHours: estimatedHours || "2-4 hours",
    dueDate: dueDate ? new Date(dueDate) : undefined,
  };

  project.milestones.push(newMilestone);
  await project.save();

  const addedMilestone = project.milestones[project.milestones.length - 1];
  const todo = {
    id: addedMilestone._id.toString(),
    title: addedMilestone.title,
    description: addedMilestone.description,
    completed: addedMilestone.completed,
    priority: addedMilestone.priority || "medium",
    estimatedHours: addedMilestone.estimatedHours || "2-4 hours",
    dueDate: addedMilestone.dueDate,
    createdAt: addedMilestone._id.getTimestamp().toISOString(),
  };

  res.status(201).json(new ApiResponse(201, todo, "Todo added successfully"));
});

// Update todo in project
const updateTodo = asyncHandler(async (req, res) => {
  const { hackathonId, todoId } = req.params;
  const { title, description, completed, priority, dueDate, estimatedHours } =
    req.body;

  const project = await HackathonProject.findOne({
    hackathonId: hackathonId,
    $or: [{ userId: req.user.id }, { "users.userId": req.user.id }],
  });

  if (!project) {
    throw new ApiError(404, "Project not found for this hackathon");
  }

  // Verify user has access
  if (!project.hasUserAccess(req.user.id)) {
    throw new ApiError(403, "You don't have access to this project");
  }

  const milestone = project.milestones.id(todoId);
  if (!milestone) {
    throw new ApiError(404, "Todo not found");
  }

  if (title !== undefined) milestone.title = title;
  if (description !== undefined) milestone.description = description;
  if (priority !== undefined) milestone.priority = priority;
  if (estimatedHours !== undefined) milestone.estimatedHours = estimatedHours;
  if (completed !== undefined) {
    milestone.completed = completed;
    if (completed) {
      milestone.completedAt = new Date();
    } else {
      milestone.completedAt = undefined;
    }
  }
  if (dueDate !== undefined)
    milestone.dueDate = dueDate ? new Date(dueDate) : undefined;

  await project.save();

  const todo = {
    id: milestone._id.toString(),
    title: milestone.title,
    description: milestone.description,
    completed: milestone.completed,
    priority: milestone.priority || "medium",
    estimatedHours: milestone.estimatedHours || "2-4 hours",
    dueDate: milestone.dueDate,
    createdAt: milestone._id.getTimestamp().toISOString(),
  };

  res.status(200).json(new ApiResponse(200, todo, "Todo updated successfully"));
});

// Delete todo from project
const deleteTodo = asyncHandler(async (req, res) => {
  const { hackathonId, todoId } = req.params;

  const project = await HackathonProject.findOne({
    hackathonId: hackathonId,
    $or: [{ userId: req.user.id }, { "users.userId": req.user.id }],
  });

  if (!project) {
    throw new ApiError(404, "Project not found for this hackathon");
  }

  // Verify user has access
  if (!project.hasUserAccess(req.user.id)) {
    throw new ApiError(403, "You don't have access to this project");
  }

  const milestone = project.milestones.id(todoId);
  if (!milestone) {
    throw new ApiError(404, "Todo not found");
  }

  project.milestones.pull(todoId);
  await project.save();

  res.status(200).json(new ApiResponse(200, {}, "Todo deleted successfully"));
});

// Generate AI todos for project
const generateTodos = asyncHandler(async (req, res) => {
  try {
    const { hackathonId } = req.params;

    const project = await HackathonProject.findOne({
      hackathonId: hackathonId,
      $or: [{ userId: req.user.id }, { "users.userId": req.user.id }],
    });

    if (!project) {
      throw new ApiError(404, "Project not found for this hackathon");
    }

    // Verify user has access
    if (!project.hasUserAccess(req.user.id)) {
      throw new ApiError(403, "You don't have access to this project");
    }

    console.log("🤖 Generating todos with real AI for project:", project.title);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Create structured prompt for todo generation
    const prompt = `You are a smart project management assistant. Generate 6-8 actionable todos for this hackathon project:

Project Title: ${project.title}
Description: ${project.description}
Tech Stack: ${project.techStack?.join(", ") || "Not specified"}
Complexity: ${project.implementationComplexity}
Timeline: ${project.estimatedTimeline}
Target Audience: ${project.targetAudience?.join(", ") || "Not specified"}

Generate realistic, specific todos that would help complete this project. Consider:
- Setup and configuration tasks
- Core feature development
- UI/UX implementation
- Testing and debugging
- Documentation
- Deployment preparation

Return ONLY a JSON array with this exact structure (no markdown, no extra text):
[
  {
    "title": "Specific task title",
    "description": "Detailed description of what needs to be done",
    "priority": "high|medium|low",
    "estimatedHours": "1-2",
    "dueDate": "YYYY-MM-DD"
  }
]

Make sure:
- Tasks are specific and actionable
- Priorities are realistic (2-3 high, 3-4 medium, 1-2 low)
- Estimated hours are reasonable (1-8 hours per task)
- Due dates progress logically over the next 1-2 weeks
- Descriptions are helpful and specific`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("🤖 Raw AI response:", text);

    // Parse the AI response
    let todos;
    try {
      // Extract JSON from response (in case AI adds extra text)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? jsonMatch[0] : text;
      todos = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback to structured todos based on project data
      todos = generateFallbackTodos(project);
    }

    // Validate and format todos
    const formattedTodos = todos.map((todo, index) => ({
      id: `todo-${Date.now()}-${index}`,
      title: todo.title || `Task ${index + 1}`,
      description: todo.description || "No description provided",
      completed: false,
      priority: ["high", "medium", "low"].includes(todo.priority)
        ? todo.priority
        : "medium",
      estimatedHours: todo.estimatedHours || "2-4",
      dueDate:
        todo.dueDate ||
        new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      createdAt: new Date().toISOString(),
    }));

    console.log("✅ Generated todos:", formattedTodos);

    // Save the generated todos to the project's milestones
    try {
      const milestones = formattedTodos.map((todo) => ({
        title: todo.title,
        description: todo.description,
        completed: todo.completed,
        priority: todo.priority,
        estimatedHours: todo.estimatedHours,
        dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
      }));

      // Add the new milestones to the existing ones
      project.milestones.push(...milestones);
      await project.save();

      console.log("💾 Saved todos to project milestones");
    } catch (saveError) {
      console.error("❌ Failed to save todos to database:", saveError);
      // Continue anyway - we'll still return the generated todos
    }

    res.json(
      new ApiResponse(
        200,
        { todos: formattedTodos },
        "Todos generated successfully"
      )
    );
  } catch (error) {
    console.error("❌ Error generating todos:", error);

    // Fallback to mock data if AI fails
    const fallbackTodos = generateFallbackTodos(project);

    // Save fallback todos to project milestones
    try {
      const milestones = fallbackTodos.map((todo) => ({
        title: todo.title,
        description: todo.description,
        completed: todo.completed,
        priority: todo.priority,
        estimatedHours: todo.estimatedHours,
        dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
      }));

      // Add the new milestones to the existing ones
      project.milestones.push(...milestones);
      await project.save();

      console.log("💾 Saved fallback todos to project milestones");
    } catch (saveError) {
      console.error("❌ Failed to save fallback todos to database:", saveError);
    }

    res.json(
      new ApiResponse(
        200,
        { todos: fallbackTodos },
        "Todos generated with fallback data"
      )
    );
  }
});

// Helper function to generate fallback todos
const generateFallbackTodos = (project) => {
  const baseTodos = [
    {
      title: "Project Setup & Environment Configuration",
      description: `Set up development environment for ${project.title} with necessary dependencies and tools`,
      priority: "high",
      estimatedHours: "2-3",
    },
    {
      title: "Core Architecture Implementation",
      description: `Design and implement the core architecture using ${
        project.techStack?.join(", ") || "chosen technologies"
      }`,
      priority: "high",
      estimatedHours: "4-6",
    },
    {
      title: "User Interface Design & Development",
      description:
        "Create responsive and intuitive UI components for the application",
      priority: "medium",
      estimatedHours: "3-5",
    },
    {
      title: "API Integration & Backend Logic",
      description:
        "Implement backend services and API integrations for core functionality",
      priority: "high",
      estimatedHours: "4-6",
    },
    {
      title: "Testing & Quality Assurance",
      description:
        "Write unit tests and perform comprehensive testing of all features",
      priority: "medium",
      estimatedHours: "2-4",
    },
    {
      title: "Performance Optimization",
      description:
        "Optimize application performance and ensure smooth user experience",
      priority: "medium",
      estimatedHours: "2-3",
    },
    {
      title: "Documentation & README",
      description: "Create comprehensive documentation and setup instructions",
      priority: "low",
      estimatedHours: "1-2",
    },
    {
      title: "Deployment & Production Setup",
      description:
        "Deploy application to production environment and configure hosting",
      priority: "medium",
      estimatedHours: "2-4",
    },
  ];

  return baseTodos.map((todo, index) => ({
    id: `fallback-todo-${Date.now()}-${index}`,
    title: todo.title,
    description: todo.description,
    completed: false,
    priority: todo.priority,
    estimatedHours: todo.estimatedHours,
    dueDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    createdAt: new Date().toISOString(),
  }));
};

// Fetch GitHub commits for a project
const getGitHubCommits = asyncHandler(async (req, res) => {
  try {
    const { hackathonId } = req.params;
    const project = await HackathonProject.findOne({
      hackathonId: hackathonId,
      $or: [{ userId: req.user.id }, { "users.userId": req.user.id }],
    });

    if (!project) {
      throw new ApiError(404, "Project not found for this hackathon");
    }

    // Verify user has access
    if (!project.hasUserAccess(req.user.id)) {
      throw new ApiError(403, "You don't have access to this project");
    }

    if (!project.repositoryUrl) {
      throw new ApiError(400, "No repository URL configured for this project");
    }

    // Parse GitHub repository URL to extract owner and repo
    const repoMatch = project.repositoryUrl.match(
      /github\.com\/([^\/]+)\/([^\/]+)/
    );
    if (!repoMatch) {
      throw new ApiError(400, "Invalid GitHub repository URL");
    }

    const [, owner, repo] = repoMatch;
    const repoName = repo.replace(/\.git$/, ""); // Remove .git suffix if present

    // Get commit count from query parameter (default 25, max 100)
    const commitCount = Math.min(parseInt(req.query.count) || 25, 100);

    console.log(`🐙 Fetching ${commitCount} commits for ${owner}/${repoName}`);

    // Fetch commits from GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=${commitCount}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Codra-AI-Hackathon-Platform",
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new ApiError(404, "Repository not found or not accessible");
      } else if (response.status === 403) {
        throw new ApiError(
          403,
          "Rate limit exceeded or insufficient permissions"
        );
      }
      throw new ApiError(
        response.status,
        `GitHub API error: ${response.statusText}`
      );
    }

    const commits = await response.json();

    // Format commits for frontend
    const formattedCommits = commits.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.author?.login || commit.commit.author.name,
      authorAvatar:
        commit.author?.avatar_url ||
        `https://github.com/identicons/${commit.commit.author.name}.png`,
      date: commit.commit.author.date,
      url: commit.html_url,
    }));

    console.log(`✅ Found ${formattedCommits.length} commits`);

    res.json(
      new ApiResponse(
        200,
        { commits: formattedCommits },
        "GitHub commits fetched successfully"
      )
    );
  } catch (error) {
    console.error("❌ Error fetching GitHub commits:", error);

    // Return empty array instead of error to not break the UI
    res.json(
      new ApiResponse(
        200,
        { commits: [] },
        "Could not fetch commits - repository may be private or not accessible"
      )
    );
  }
});

// Generate AI answer for submission question
const generateAIAnswer = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;
  const { question, context } = req.body;

  if (!question) {
    throw new ApiError(400, "Question is required");
  }

  const project = await HackathonProject.findOne({
    hackathonId: hackathonId,
    $or: [{ userId: req.user.id }, { "users.userId": req.user.id }],
  });

  if (!project) {
    throw new ApiError(404, "Project not found for this hackathon");
  }

  // Verify user has access
  if (!project.hasUserAccess(req.user.id)) {
    throw new ApiError(403, "You don't have access to this project");
  }

  try {
    // Use Google Gemini AI directly for submission answers
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create a professional prompt for submission answers
    const aiPrompt = `You are a hackathon judge helping a team craft a compelling submission answer. Generate a professional, detailed response to this question: "${question}"

PROJECT CONTEXT:
- Title: ${project.title}
- Description: ${project.description}
- USP: ${project.usp}
- Tech Stack: ${project.techStack.join(", ")}
- Target Audience: ${project.targetAudience.join(", ")}
- Complexity: ${project.implementationComplexity}
- Timeline: ${project.estimatedTimeline}
- Market Potential: ${project.marketPotential}
- Social Impact: ${project.socialImpact.join(", ")}

REQUIREMENTS:
- Professional tone suitable for hackathon judges
- Highlight key project strengths and innovations
- Connect the answer to the project's tech stack and impact
- 2-3 paragraphs, well-structured and compelling
- Focus on value proposition and differentiation

Generate a persuasive answer that showcases the project's potential:`;

    console.log("🤖 Generating AI answer with Gemini...");

    // Get AI response from Gemini
    const result = await model.generateContent(aiPrompt);
    const response = await result.response;
    const aiAnswer = response.text();

    console.log("✅ Generated AI answer:", aiAnswer);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          answer: aiAnswer.trim(),
          tokensUsed: Math.ceil(aiAnswer.length / 4), // Rough estimate
          processingTime: Date.now() - Date.now(), // Simple timing
        },
        "AI answer generated successfully"
      )
    );
  } catch (error) {
    console.error("AI generation error:", error);

    // Fallback to a basic template response if AI fails
    const fallbackAnswer = `Our project "${project.title}" addresses ${
      project.description
    }. Key features include ${project.usp}. Built with ${project.techStack.join(
      ", "
    )}, it targets ${project.targetAudience.join(
      ", "
    )} and aims to achieve ${project.socialImpact.join(
      ", "
    )}. The project has ${project.implementationComplexity.toLowerCase()} complexity and is estimated to take ${
      project.estimatedTimeline
    } to complete.`;

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { answer: fallbackAnswer },
          "AI answer generated with fallback"
        )
      );
  }
});

// Generate team code for project collaboration
const generateTeamCode = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  const project = await HackathonProject.findOne({
    hackathonId: hackathonId,
    $or: [{ userId: req.user.id }, { "users.userId": req.user.id }],
  });

  if (!project) {
    throw new ApiError(404, "Project not found for this hackathon");
  }

  // Check if user has permission to generate team code (only owners can generate codes)
  const userRole = project.getUserRole(req.user.id);
  if (userRole !== "owner") {
    throw new ApiError(403, "Only project owners can generate team codes");
  }

  // Generate unique 6-character team code
  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  let teamCode;
  let attempts = 0;
  const maxAttempts = 10;

  // Try to generate a unique code
  while (attempts < maxAttempts) {
    teamCode = generateCode();
    const existingProject = await HackathonProject.findOne({ teamCode });
    if (!existingProject) {
      break;
    }
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new ApiError(500, "Failed to generate unique team code");
  }

  // Set up team with project owner as first member
  project.teamCode = teamCode;
  project.teamOwner = req.user.id;

  const ownerInfo = {
    userId: req.user.id,
    username: req.user.username,
    displayName: req.user.displayName || req.user.username,
    avatar: req.user.avatar,
    role: "owner",
    joinedAt: new Date(),
  };

  project.teamMembers = [ownerInfo];

  // Initialize users array if it doesn't exist and add owner
  if (!project.users) {
    project.users = [];
  }

  // Add owner to users array if not already there
  const existingOwner = project.users.find(
    (user) => user.userId.toString() === req.user.id
  );

  if (!existingOwner) {
    project.users.push(ownerInfo);
  } else {
    // Update existing owner role to ensure they're marked as owner
    existingOwner.role = "owner";
  }

  await project.save();

  console.log(
    `✅ Generated team code ${teamCode} for project ${project.title}`
  );

  res.json(
    new ApiResponse(
      200,
      {
        teamCode,
        teamMembers: project.teamMembers,
        teamSettings: project.teamSettings,
      },
      "Team code generated successfully"
    )
  );
});

// Join team using team code
const joinTeamByCode = asyncHandler(async (req, res) => {
  const { teamCode } = req.body;

  if (!teamCode || teamCode.length !== 6) {
    throw new ApiError(400, "Valid 6-character team code is required");
  }

  const project = await HackathonProject.findOne({
    teamCode: teamCode.toUpperCase(),
  });

  if (!project) {
    throw new ApiError(404, "Invalid team code");
  }

  if (!project.teamSettings.allowJoin) {
    throw new ApiError(403, "This team is not accepting new members");
  }

  if (project.teamMembers.length >= project.teamSettings.maxMembers) {
    throw new ApiError(400, "Team is full");
  }

  // Check if user is already a member (check both teamMembers and users arrays)
  const existingTeamMember = project.teamMembers.find(
    (member) => member.userId.toString() === req.user.id
  );

  const existingUser =
    project.users &&
    project.users.find((user) => user.userId.toString() === req.user.id);

  if (existingTeamMember || existingUser) {
    throw new ApiError(400, "You are already a member of this team");
  }

  // Add user to both teamMembers (for backward compatibility) and users arrays
  const newMember = {
    userId: req.user.id,
    username: req.user.username,
    displayName: req.user.displayName || req.user.username,
    avatar: req.user.avatar,
    role: "member",
    joinedAt: new Date(),
  };

  project.teamMembers.push(newMember);

  // Add to users array using the helper method
  project.addUser(newMember);

  await project.save();

  console.log(
    `✅ User ${req.user.username} joined team ${teamCode} - added to existing project`
  );

  // No need to create copies - user now has access to the same project via users array

  // Get the hackathon data to return as well
  const hackathon = await Hackathon.findById(project.hackathonId);

  res.json(
    new ApiResponse(
      200,
      {
        teamCode,
        teamMembers: project.teamMembers,
        project: project, // Return the same project that user now has access to
        hackathon: hackathon, // Also return the hackathon data
      },
      "Successfully joined team"
    )
  );
});

// Get team information
const getTeamInfo = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  // First, find the user's project
  const userProject = await HackathonProject.findOne({
    hackathonId: hackathonId,
    $or: [{ userId: req.user.id }, { "users.userId": req.user.id }],
  });

  if (!userProject) {
    throw new ApiError(404, "Project not found for this hackathon");
  }

  // Verify user has access
  if (!userProject.hasUserAccess(req.user.id)) {
    throw new ApiError(403, "You don't have access to this project");
  }

  // If user is a team owner (has teamCode), return their team info
  if (userProject.teamCode) {
    res.json(
      new ApiResponse(
        200,
        {
          teamCode: userProject.teamCode,
          teamOwner: userProject.teamOwner,
          teamMembers: userProject.teamMembers,
          teamSettings: userProject.teamSettings,
          project: {
            title: userProject.title,
            description: userProject.description,
          },
        },
        "Team information retrieved successfully"
      )
    );
    return;
  }

  // If user is a team member (no teamCode), find the team owner's project
  if (userProject.teamOwner) {
    const ownerProject = await HackathonProject.findOne({
      hackathonId: hackathonId,
      userId: userProject.teamOwner,
      teamCode: { $exists: true, $ne: null },
    });

    if (ownerProject) {
      res.json(
        new ApiResponse(
          200,
          {
            teamCode: ownerProject.teamCode,
            teamOwner: ownerProject.teamOwner,
            teamMembers: ownerProject.teamMembers,
            teamSettings: ownerProject.teamSettings,
            project: {
              title: ownerProject.title,
              description: ownerProject.description,
            },
          },
          "Team information retrieved successfully"
        )
      );
      return;
    }
  }

  // No team found
  throw new ApiError(404, "No team found for this project");
});

// Remove team member (owner only)
const removeTeamMember = asyncHandler(async (req, res) => {
  const { hackathonId, memberId } = req.params;

  const project = await HackathonProject.findOne({
    hackathonId: hackathonId,
    $or: [{ userId: req.user.id }, { "users.userId": req.user.id }],
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user has permission to remove members (only owners can remove members)
  const userRole = project.getUserRole(req.user.id);
  if (userRole !== "owner") {
    throw new ApiError(403, "Only project owners can remove team members");
  }

  if (memberId === req.user.id) {
    throw new ApiError(400, "Cannot remove yourself from the team");
  }

  // Remove from teamMembers array
  const memberIndex = project.teamMembers.findIndex(
    (member) => member.userId.toString() === memberId
  );

  if (memberIndex === -1) {
    throw new ApiError(404, "Team member not found");
  }

  const removedMember = project.teamMembers[memberIndex];
  project.teamMembers.splice(memberIndex, 1);

  // Also remove from users array
  const userIndex = project.users.findIndex(
    (user) => user.userId.toString() === memberId
  );

  if (userIndex !== -1) {
    project.users.splice(userIndex, 1);
  }

  await project.save();

  console.log(
    `✅ Removed ${removedMember.username} from team ${project.teamCode}`
  );

  res.json(
    new ApiResponse(
      200,
      {
        teamMembers: project.teamMembers,
      },
      "Team member removed successfully"
    )
  );
});

// Leave team (member only)
const leaveTeam = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  const project = await HackathonProject.findOne({
    hackathonId: hackathonId,
    $or: [
      { "teamMembers.userId": req.user.id },
      { "users.userId": req.user.id },
    ],
  });

  if (!project) {
    throw new ApiError(404, "Team not found or you're not a member");
  }

  // Check if user has access to this project
  if (!project.hasUserAccess(req.user.id)) {
    throw new ApiError(403, "You don't have access to this project");
  }

  // Check if user is the owner
  const userRole = project.getUserRole(req.user.id);
  if (userRole === "owner") {
    throw new ApiError(
      400,
      "Team owner cannot leave the team. Transfer ownership first or disband the team."
    );
  }

  // Remove from teamMembers array
  const memberIndex = project.teamMembers.findIndex(
    (member) => member.userId.toString() === req.user.id
  );

  if (memberIndex !== -1) {
    project.teamMembers.splice(memberIndex, 1);
  }

  // Remove from users array
  const userIndex = project.users.findIndex(
    (user) => user.userId.toString() === req.user.id
  );

  if (userIndex !== -1) {
    project.users.splice(userIndex, 1);
  }

  await project.save();

  console.log(`✅ User ${req.user.username} left team ${project.teamCode}`);

  res.json(new ApiResponse(200, {}, "Successfully left the team"));
});

// Update team settings (owner only)
const updateTeamSettings = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;
  const { allowJoin, maxMembers } = req.body;

  const project = await HackathonProject.findOne({
    hackathonId: hackathonId,
    $or: [{ userId: req.user.id }, { "users.userId": req.user.id }],
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user has permission to update settings (only owners can update settings)
  const userRole = project.getUserRole(req.user.id);
  if (userRole !== "owner") {
    throw new ApiError(403, "Only project owners can update team settings");
  }

  if (allowJoin !== undefined) {
    project.teamSettings.allowJoin = allowJoin;
  }

  if (maxMembers !== undefined) {
    if (maxMembers < project.teamMembers.length) {
      throw new ApiError(400, "Cannot set max members below current team size");
    }
    if (maxMembers < 1 || maxMembers > 10) {
      throw new ApiError(400, "Max members must be between 1 and 10");
    }
    project.teamSettings.maxMembers = maxMembers;
  }

  await project.save();

  res.json(
    new ApiResponse(
      200,
      {
        teamSettings: project.teamSettings,
      },
      "Team settings updated successfully"
    )
  );
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
};
