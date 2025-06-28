import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Plus,
  FolderOpen,
  Calendar,
  MessageSquare,
  BarChart3,
  Trophy,
  Clock,

  Search,
  Loader2,
  AlertCircle,
  ArrowRight,
  Target,
} from "lucide-react";
import { GradientText } from "./ui/gradient-text";
import { RainbowButton } from "./ui/rainbow-button";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent} from "./ui/card";
import { hackathonApi, ApiError } from "../services/api";
import type { Hackathon, HackathonProject } from "../services/api";

interface ProjectWithHackathon extends HackathonProject {
  hackathon?: Hackathon;
}

export const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // State
  const [projects, setProjects] = useState<ProjectWithHackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Load all projects across hackathons
  useEffect(() => {
    if (user) {
      loadUserProjects();
    }
  }, [user]);

  const loadUserProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // First get all hackathons for the user
      const hackathonsResponse = await hackathonApi.getHackathons({
        limit: 100, // Get all hackathons
      });

      const hackathonsList =
        hackathonsResponse.docs || hackathonsResponse || [];

      // Then get projects for each hackathon
      const projectsWithHackathon: ProjectWithHackathon[] = [];

      await Promise.all(
        hackathonsList.map(async (hackathon: Hackathon) => {
          try {
            const project = await hackathonApi.getProject(hackathon._id);
            if (project) {
              projectsWithHackathon.push({
                ...project,
                hackathon: hackathon,
              });
            }
          } catch (err) {
            // Project doesn't exist for this hackathon, which is fine
            console.log(`No project found for hackathon ${hackathon._id}`);
          }
        })
      );

      setProjects(projectsWithHackathon);
    } catch (err) {
      console.error("Failed to load user projects:", err);
      setError(
        err instanceof ApiError ? err.message : "Failed to load projects"
      );
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress: string) => {
    switch (progress) {
      case "planning":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
      case "development":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
      case "testing":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300";
      case "submission":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300";
      case "completed":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300";
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "Beginner":
        return "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800";
      case "Intermediate":
        return "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
      case "Advanced":
        return "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800";
      default:
        return "bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800";
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.hackathon?.title
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      project.techStack.some((tech) =>
        tech.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesFilter = !filterStatus || project.progress === filterStatus;

    return matchesSearch && matchesFilter;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 text-gray-900 dark:text-white pt-16">
      {/* Background effects */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <GradientText>Welcome back, {user.username}! 👋</GradientText>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Manage and track your hackathon projects
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <RainbowButton onClick={() => navigate("/hackathons")}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </RainbowButton>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Projects
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {projects.length}
                  </p>
                </div>
                <FolderOpen className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    In Progress
                  </p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {
                      projects.filter((p) =>
                        ["planning", "development", "testing"].includes(
                          p.progress || ""
                        )
                      ).length
                    }
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Completed
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {projects.filter((p) => p.progress === "completed").length}
                  </p>
                </div>
                <Trophy className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Hackathons
                  </p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {new Set(projects.map((p) => p.hackathonId)).size}
                  </p>
                </div>
                <Target className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-300 dark:border-zinc-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={filterStatus === null ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(null)}
            >
              All
            </Button>
            <Button
              variant={filterStatus === "planning" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("planning")}
            >
              Planning
            </Button>
            <Button
              variant={filterStatus === "development" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("development")}
            >
              Development
            </Button>
            <Button
              variant={filterStatus === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("completed")}
            >
              Completed
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
            <CardContent className="p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={loadUserProjects}
                  className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-300 mt-1"
                >
                  Try again
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {projects.length === 0
                  ? "No projects yet"
                  : "No projects match your search"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {projects.length === 0
                  ? "Get started by joining a hackathon and creating your first project"
                  : "Try adjusting your search or filters"}
              </p>
              {projects.length === 0 && (
                <Button onClick={() => navigate("/hackathons")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Browse Hackathons
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card
                key={project._id}
                className="group relative overflow-hidden bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:shadow-xl hover:shadow-blue-500/10 transition-all hover:scale-[1.02] transform-gpu cursor-pointer"
                onClick={() =>
                  navigate(`/hackathons/${project.hackathonId}/project`)
                }
              >
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <FolderOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {project.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {project.hackathon?.title || "Unknown Hackathon"}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={getProgressColor(
                              project.progress || "planning"
                            )}
                          >
                            {project.progress || "planning"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={getComplexityColor(
                              project.implementationComplexity
                            )}
                          >
                            {project.implementationComplexity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {project.description}
                  </p>

                  {/* Tech Stack */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {project.techStack.slice(0, 3).map((tech, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          {tech}
                        </Badge>
                      ))}
                      {project.techStack.length > 3 && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          +{project.techStack.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{project.estimatedTimeline}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Click indicator */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card
            className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => navigate("/hackathons")}
          >
            <CardContent className="p-6 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-3 text-blue-500" />
              <h3 className="text-lg font-semibold mb-2">Browse Hackathons</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Discover new hackathons and join competitions
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => navigate("/chat")}
          >
            <CardContent className="p-6 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get help brainstorming and planning your projects
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => navigate("/profile")}
          >
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-3 text-purple-500" />
              <h3 className="text-lg font-semibold mb-2">Profile & Stats</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View your progress and achievements
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
