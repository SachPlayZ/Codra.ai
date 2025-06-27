import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import {
  FolderOpen,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Edit3,
  Save,
  X,
  Code,
  Users as UsersIcon,
  Star,
  Clock,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { GradientText } from "./ui/gradient-text";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
// import { Textarea } from "./ui/textarea";
import { hackathonApi, ApiError } from "../services/api";
import type { Hackathon, HackathonProject } from "../services/api";

export const ProjectDetail: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [project, setProject] = useState<HackathonProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<HackathonProject>>({});

  useEffect(() => {
    if (user && id) {
      loadData();
    }
  }, [user, id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [hackathonResponse, projectResponse] = await Promise.all([
        hackathonApi.getHackathon(id),
        hackathonApi.getProject(id),
      ]);
      setHackathon(hackathonResponse);
      setProject(projectResponse);
      setEditForm(projectResponse);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError(
        err instanceof ApiError ? err.message : "Failed to load project"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm(project || {});
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(project || {});
  };

  const handleSave = async () => {
    if (!project || !id) return;

    try {
      setSaving(true);
      const updatedProject = await hackathonApi.updateProject(id, editForm);
      setProject(updatedProject);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update project:", err);
      setError(
        err instanceof ApiError ? err.message : "Failed to update project"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    if (!id) return;

    try {
      await hackathonApi.deleteProject(id);
      navigate(`/hackathons/${id}`);
    } catch (err) {
      console.error("Failed to delete project:", err);
      setError(
        err instanceof ApiError ? err.message : "Failed to delete project"
      );
    }
  };

  const updateEditForm = (field: string, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (field: string, value: string) => {
    const array = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    updateEditForm(field, array);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zinc-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !project || !hackathon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
                  Project not found
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                  {error || "The project you're looking for doesn't exist."}
                </p>
                <Button onClick={() => navigate(`/hackathons/${id}`)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Hackathon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900 pt-16 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-in slide-in-from-top-4 duration-700">
          <Button
            variant="ghost"
            onClick={() => navigate(`/hackathons/${id}`)}
            className="mb-4 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {hackathon.title}
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  <GradientText>
                    {isEditing ? editForm.title || "Untitled" : project.title}
                  </GradientText>
                </h1>
                <div className="flex items-center space-x-3">
                  <Badge
                    variant="secondary"
                    className="bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  >
                    {isEditing
                      ? editForm.progress || "planning"
                      : project.progress || "planning"}
                  </Badge>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleEdit}
                    className="border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Project
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-700 delay-200">
          {/* Project Details */}
          <div className="lg:col-span-2 space-y-6 animate-in slide-in-from-left-2 duration-600 delay-300">
            {/* Title (editable) */}
            {isEditing && (
              <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    Project Title
                  </h2>
                </CardHeader>
                <CardContent>
                  <Input
                    value={editForm.title || ""}
                    onChange={(e) => updateEditForm("title", e.target.value)}
                    className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600"
                    placeholder="Enter project title..."
                  />
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  Description
                </h2>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <textarea
                    value={editForm.description || ""}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      updateEditForm("description", e.target.value)
                    }
                    className="min-h-[120px] w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    placeholder="Describe your project..."
                  />
                ) : (
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {project.description}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* USP */}
            <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  💡 Unique Selling Proposition
                </h2>
              </CardHeader>
              <CardContent>
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                  {isEditing ? (
                    <textarea
                      value={editForm.usp || ""}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        updateEditForm("usp", e.target.value)
                      }
                      className="w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-sm placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      placeholder="What makes your project unique?"
                    />
                  ) : (
                    <p className="text-zinc-700 dark:text-zinc-300">
                      {project.usp}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tech Stack & Target Audience */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <h3 className="font-semibold flex items-center text-zinc-900 dark:text-zinc-100">
                    <Code className="w-4 h-4 mr-2 text-purple-500" />
                    Tech Stack
                  </h3>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Input
                      value={editForm.techStack?.join(", ") || ""}
                      onChange={(e) =>
                        updateArrayField("techStack", e.target.value)
                      }
                      className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600"
                      placeholder="React, Node.js, MongoDB..."
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.map((tech, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                        >
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <h3 className="font-semibold flex items-center text-zinc-900 dark:text-zinc-100">
                    <UsersIcon className="w-4 h-4 mr-2 text-green-500" />
                    Target Audience
                  </h3>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Input
                      value={editForm.targetAudience?.join(", ") || ""}
                      onChange={(e) =>
                        updateArrayField("targetAudience", e.target.value)
                      }
                      className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600"
                      placeholder="Students, Developers, Businesses..."
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {project.targetAudience.map((audience, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300"
                        >
                          {audience}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Social Impact */}
            {((isEditing && editForm.socialImpact) ||
              (!isEditing && project.socialImpact)) &&
              ((isEditing ? editForm.socialImpact : project.socialImpact) || [])
                .length > 0 && (
                <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
                  <CardHeader>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      🌍 Social Impact
                    </h3>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Input
                        value={editForm.socialImpact?.join(", ") || ""}
                        onChange={(e) =>
                          updateArrayField("socialImpact", e.target.value)
                        }
                        className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600"
                        placeholder="Environmental, Educational, Healthcare..."
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {project.socialImpact?.map((impact, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300"
                          >
                            {impact}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 animate-in slide-in-from-right-2 duration-600 delay-400">
            {/* Project Stats */}
            <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Project Stats
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <Star className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Complexity
                    </div>
                    {isEditing ? (
                      <select
                        value={editForm.implementationComplexity || ""}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          updateEditForm(
                            "implementationComplexity",
                            e.target.value
                          )
                        }
                        className="mt-1 w-full bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 text-sm"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    ) : (
                      <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {project.implementationComplexity}
                      </div>
                    )}
                  </div>

                  <div className="text-center p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Timeline
                    </div>
                    {isEditing ? (
                      <select
                        value={editForm.estimatedTimeline || ""}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          updateEditForm("estimatedTimeline", e.target.value)
                        }
                        className="mt-1 w-full bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 text-sm"
                      >
                        <option value="12 hrs">12 hrs</option>
                        <option value="24 hrs">24 hrs</option>
                        <option value="36 hrs">36 hrs</option>
                        <option value="48 hrs">48 hrs</option>
                      </select>
                    ) : (
                      <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {project.estimatedTimeline}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Potential */}
            <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                  Market Potential
                </h3>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <textarea
                    value={editForm.marketPotential || ""}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      updateEditForm("marketPotential", e.target.value)
                    }
                    className="w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    rows={4}
                    placeholder="Describe the market potential, target market size, growth opportunities, competitive advantages, and revenue potential..."
                  />
                ) : (
                  <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {project.marketPotential}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress */}
            <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Progress
                </h3>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <select
                    value={editForm.progress || ""}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      updateEditForm("progress", e.target.value)
                    }
                    className="w-full bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded px-3 py-2"
                  >
                    <option value="planning">Planning</option>
                    <option value="development">Development</option>
                    <option value="testing">Testing</option>
                    <option value="submission">Submission</option>
                    <option value="completed">Completed</option>
                  </select>
                ) : (
                  <Badge
                    variant="secondary"
                    className="w-full justify-center py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  >
                    {project.progress || "planning"}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
