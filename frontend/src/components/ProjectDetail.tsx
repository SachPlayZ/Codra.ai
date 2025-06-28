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
  CheckSquare,
  Github,
  FileText,
  Plus,
  Trash2,
  GitCommit,
  Users,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Send,
  Bot,
  Check,
  Link,
  Star,
  Copy,
} from "lucide-react";
import { GradientText } from "./ui/gradient-text";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { hackathonApi, ApiError } from "../services/api";
import type { Hackathon, HackathonProject } from "../services/api";

interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  estimatedHours?: string;
  dueDate?: string;
  createdAt: string;
}

interface GitCommit {
  sha: string;
  message: string;
  author: string;
  authorAvatar: string;
  date: string;
  url: string;
}

interface SubmissionQuestion {
  id: string;
  question: string;
  answer: string;
  category: "overview" | "technical" | "challenges" | "track";
}

type TabType = "overview" | "workspace" | "submission" | "whiteboard";

export const ProjectDetail: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Basic project state
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [project, setProject] = useState<HackathonProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<HackathonProject>>({});

  // Todo state
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [generatingTodos, setGeneratingTodos] = useState(false);

  // GitHub state
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [githubRepo, setGithubRepo] = useState("");
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [editingGithubUrl, setEditingGithubUrl] = useState(false);
  const [commitFetchCount, setCommitFetchCount] = useState(25);

  // Team collaboration state
  const [teamCode, setTeamCode] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamSettings, setTeamSettings] = useState({
    allowJoin: true,
    maxMembers: 6,
  });
  const [generatingTeamCode, setGeneratingTeamCode] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joiningTeam, setJoiningTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);

  // Submission state
  const [submissionQuestions, setSubmissionQuestions] = useState<
    SubmissionQuestion[]
  >([]);
  const [generatingSubmission, setGeneratingSubmission] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");
  const [savingAnswers, setSavingAnswers] = useState(false);
  const [copiedAnswers, setCopiedAnswers] = useState<Set<string>>(new Set());

  // Whiteboard state
  const [stickyNotes, setStickyNotes] = useState([
    {
      id: "1",
      content:
        "💡 Core Features\n- User authentication\n- Real-time sync\n- Mobile responsive",
      x: 64,
      y: 64,
      color: "yellow",
    },
    {
      id: "2",
      content:
        "🎯 Next Steps\n- API integration\n- Testing phase\n- Deployment prep",
      x: 320,
      y: 96,
      color: "blue",
    },
    {
      id: "3",
      content:
        "⚡ Tech Stack\n- React/Next.js\n- Node.js/Express\n- MongoDB/PostgreSQL",
      x: 200,
      y: 300,
      color: "green",
    },
  ]);

  useEffect(() => {
    if (user && id) {
      console.log("🚀 ProjectDetail useEffect triggered:", {
        userId: user.id,
        hackathonId: id,
      });
      loadData();
      loadTodos();
      checkGitHubConnection();
      loadTeamInfo();
    }
  }, [user, id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hackathonResponse, projectResponse] = await Promise.all([
        hackathonApi.getHackathon(id!),
        hackathonApi.getProject(id!),
      ]);

      setHackathon(hackathonResponse);
      setProject(projectResponse);
      setEditForm(projectResponse);

      // Load saved submission answers if they exist
      if (
        projectResponse.submissionAnswers &&
        projectResponse.submissionAnswers.length > 0
      ) {
        setSubmissionQuestions(projectResponse.submissionAnswers);
      }

      // Update GitHub repo from project if exists
      if (projectResponse.repositoryUrl) {
        setGithubRepo(projectResponse.repositoryUrl);
        setGithubConnected(true);
      }

      // Team data will be loaded separately via loadTeamInfo()
      // Don't load from project directly since team members don't have teamCode
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

  const loadTodos = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Use the backend API to load todos
      const response = await hackathonApi.getTodos(id);
      setTodos(response);
    } catch (err) {
      console.error("Failed to load todos:", err);
      // Fallback to localStorage for offline support
      const savedTodos = localStorage.getItem(`todos-${id}`);
      if (savedTodos) {
        setTodos(JSON.parse(savedTodos));
      }
    } finally {
      setLoading(false);
    }
  };

  const saveTodos = (newTodos: TodoItem[]) => {
    setTodos(newTodos);
    // Also save to localStorage as backup
    localStorage.setItem(`todos-${id}`, JSON.stringify(newTodos));
  };

  const addTodo = async () => {
    if (!newTodo.trim() || !id) return;

    try {
      // Add todo via backend API
      const response = await hackathonApi.addTodo(id, {
        title: newTodo,
        priority: "medium",
      });

      setTodos([...todos, response]);
      setNewTodo("");

      // Also save to localStorage as backup
      localStorage.setItem(`todos-${id}`, JSON.stringify([...todos, response]));
    } catch (err) {
      console.error("Failed to add todo:", err);
      // Fallback to local storage
      const todo: TodoItem = {
        id: Date.now().toString(),
        title: newTodo,
        completed: false,
        priority: "medium",
        createdAt: new Date().toISOString(),
      };
      saveTodos([...todos, todo]);
      setNewTodo("");
    }
  };

  const toggleTodo = async (todoId: string) => {
    if (!id) return;

    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;

    try {
      // Update todo via backend API
      const response = await hackathonApi.updateTodo(id, todoId, {
        completed: !todo.completed,
      });

      const updatedTodos = todos.map((t) => (t.id === todoId ? response : t));
      setTodos(updatedTodos);
      localStorage.setItem(`todos-${id}`, JSON.stringify(updatedTodos));
    } catch (err) {
      console.error("Failed to update todo:", err);
      // Fallback to local update
      const updatedTodos = todos.map((t) =>
        t.id === todoId ? { ...t, completed: !t.completed } : t
      );
      saveTodos(updatedTodos);
    }
  };

  const deleteTodo = async (todoId: string) => {
    if (!id) return;

    try {
      // Delete todo via backend API
      await hackathonApi.deleteTodo(id, todoId);

      const updatedTodos = todos.filter((todo) => todo.id !== todoId);
      setTodos(updatedTodos);
      localStorage.setItem(`todos-${id}`, JSON.stringify(updatedTodos));
    } catch (err) {
      console.error("Failed to delete todo:", err);
      // Fallback to local delete
      const updatedTodos = todos.filter((todo) => todo.id !== todoId);
      saveTodos(updatedTodos);
    }
  };

  const generateTodos = async () => {
    if (!project || !id) return;

    setGeneratingTodos(true);
    try {
      // Call the real API endpoint for AI generation
      const response = await hackathonApi.generateTodos(id);

      console.log("🎯 Generate todos response:", response);

      // Check if response has todos array (backend wraps in { todos: [...] })
      const todosArray = response.todos || response;

      if (!Array.isArray(todosArray)) {
        console.error(
          "❌ Expected todos array, got:",
          typeof todosArray,
          todosArray
        );
        throw new Error("Invalid response format");
      }

      // Convert API response to TodoItem format
      const apiTodos = todosArray.map((todo: any) => ({
        id: todo.id,
        title: todo.title,
        description: todo.description,
        completed: todo.completed,
        priority: todo.priority || "medium",
        estimatedHours: todo.estimatedHours,
        dueDate: todo.dueDate,
        createdAt: todo.createdAt,
      }));

      console.log("✅ Processed API todos:", apiTodos);
      saveTodos([...todos, ...apiTodos]);
    } catch (err) {
      console.error("Failed to generate todos:", err);
      // Fallback to mock data if API fails
      const aiGeneratedTodos: TodoItem[] = [
        {
          id: Date.now().toString(),
          title: "Set up development environment",
          description:
            "Install necessary dependencies and configure development tools",
          completed: false,
          priority: "high",
          createdAt: new Date().toISOString(),
        },
        {
          id: (Date.now() + 1).toString(),
          title: "Design user interface mockups",
          description: "Create wireframes and design prototypes",
          completed: false,
          priority: "medium",
          createdAt: new Date().toISOString(),
        },
        {
          id: (Date.now() + 2).toString(),
          title: "Implement core functionality",
          description: `Build the main features using ${project.techStack.join(
            ", "
          )}`,
          completed: false,
          priority: "high",
          createdAt: new Date().toISOString(),
        },
        {
          id: (Date.now() + 3).toString(),
          title: "Test and debug",
          description: "Thoroughly test all features and fix any issues",
          completed: false,
          priority: "medium",
          createdAt: new Date().toISOString(),
        },
        {
          id: (Date.now() + 4).toString(),
          title: "Prepare submission",
          description: "Create demo video and prepare documentation",
          completed: false,
          priority: "high",
          createdAt: new Date().toISOString(),
        },
      ];

      saveTodos([...todos, ...aiGeneratedTodos]);
    } finally {
      setGeneratingTodos(false);
    }
  };

  const checkGitHubConnection = () => {
    // Check if GitHub repo is connected
    if (project?.repositoryUrl) {
      setGithubRepo(project.repositoryUrl);
      setGithubConnected(true);
      loadCommits();
    }
  };

  const connectGitHub = async () => {
    if (!githubRepo.trim()) return;

    setLoadingCommits(true);
    try {
      // Update project with GitHub repo
      await hackathonApi.updateProject(id!, { repositoryUrl: githubRepo });
      setGithubConnected(true);
      await loadCommits();
    } catch (err) {
      console.error("Failed to connect GitHub:", err);
    } finally {
      setLoadingCommits(false);
    }
  };

  const saveGitHubUrl = async () => {
    if (!githubRepo.trim()) return;

    setLoadingCommits(true);
    try {
      // Update project with new GitHub repo URL
      await hackathonApi.updateProject(id!, { repositoryUrl: githubRepo });
      setEditingGithubUrl(false);
      await loadCommits();
    } catch (err) {
      console.error("Failed to update GitHub URL:", err);
    } finally {
      setLoadingCommits(false);
    }
  };

  const cancelGitHubEdit = () => {
    // Reset to original URL
    if (project?.repositoryUrl) {
      setGithubRepo(project.repositoryUrl);
    }
    setEditingGithubUrl(false);
  };

  const loadCommits = async () => {
    if (!githubRepo || !id) return;

    setLoadingCommits(true);
    try {
      console.log("🐙 Fetching real GitHub commits for:", githubRepo);

      // Fetch real commits from GitHub API via backend
      const response = await hackathonApi.getGitHubCommits(
        id,
        commitFetchCount
      );

      if (response && response.commits && Array.isArray(response.commits)) {
        setCommits(response.commits);
        console.log(
          `✅ Loaded ${response.commits.length} real commits (requested ${commitFetchCount})`
        );
      } else {
        console.warn("No commits returned from API", response);
        setCommits([]);
      }
    } catch (err) {
      console.error("Failed to load commits:", err);

      // Show fallback message instead of fake commits
      setCommits([]);
    } finally {
      setLoadingCommits(false);
    }
  };

  // Whiteboard functions
  const addStickyNote = (color: string) => {
    const newNote = {
      id: Date.now().toString(),
      content: "New note",
      x: Math.random() * 400 + 50,
      y: Math.random() * 300 + 50,
      color,
    };
    setStickyNotes([...stickyNotes, newNote]);
  };

  const updateStickyNote = (id: string, updates: any) => {
    setStickyNotes((notes) =>
      notes.map((note) => (note.id === id ? { ...note, ...updates } : note))
    );
  };

  const deleteStickyNote = (id: string) => {
    setStickyNotes((notes) => notes.filter((note) => note.id !== id));
  };

  const generateAnswer = async (question: string) => {
    if (!id || !question.trim()) return "";

    try {
      const response = await hackathonApi.generateAIAnswer(
        id as string,
        question
      );
      return response.answer;
    } catch (err) {
      console.error("Failed to generate answer:", err);
      return `This is a sample answer for "${question}". Please replace this with your actual answer.`;
    }
  };

  const handleGenerateAnswer = async (question: string) => {
    if (!question.trim()) return;

    setGeneratingSubmission(true);
    try {
      const answer = await generateAnswer(question);

      // Check if question already exists
      const existingIndex = submissionQuestions.findIndex(
        (q) => q.question === question
      );

      if (existingIndex >= 0) {
        // Update existing question
        const updated = [...submissionQuestions];
        updated[existingIndex].answer = answer;
        setSubmissionQuestions(updated);
      } else {
        // Add new question
        const newQuestion: SubmissionQuestion = {
          id: Date.now().toString(),
          question: question,
          answer: answer,
          category: "overview",
        };
        setSubmissionQuestions([...submissionQuestions, newQuestion]);
      }

      if (question === customQuestion) {
        setCustomQuestion("");
      }
    } catch (err) {
      console.error("Failed to generate answer:", err);
    } finally {
      setGeneratingSubmission(false);
    }
  };

  const handleRegenerateAnswer = async (
    questionId: string,
    question: string
  ) => {
    setGeneratingSubmission(true);
    try {
      const newAnswer = await generateAnswer(question);
      updateSubmissionAnswer(questionId, newAnswer);
    } catch (err) {
      console.error("Failed to regenerate answer:", err);
    } finally {
      setGeneratingSubmission(false);
    }
  };

  const removeQuestion = (questionId: string) => {
    setSubmissionQuestions(
      submissionQuestions.filter((q) => q.id !== questionId)
    );
  };

  const saveAllAnswers = async () => {
    if (!id || submissionQuestions.length === 0) return;

    setSavingAnswers(true);
    try {
      // Save all submission answers to the database
      await hackathonApi.updateProject(id, {
        submissionAnswers: submissionQuestions,
      });

      console.log("✅ All submission answers saved successfully!");
    } catch (err) {
      console.error("Failed to save answers:", err);
    } finally {
      setSavingAnswers(false);
    }
  };

  const updateSubmissionAnswer = (id: string, answer: string) => {
    const updated = submissionQuestions.map((q) =>
      q.id === id ? { ...q, answer } : q
    );
    setSubmissionQuestions(updated);
  };

  const copyAnswerToClipboard = async (questionId: string, answer: string) => {
    try {
      await navigator.clipboard.writeText(answer);
      setCopiedAnswers((prev) => new Set(prev).add(questionId));

      // Remove the copied state after 2 seconds
      setTimeout(() => {
        setCopiedAnswers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(questionId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
      case "low":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300";
    }
  };

  // Team collaboration functions
  const loadTeamInfo = async () => {
    if (!id) {
      console.log("❌ loadTeamInfo: No hackathon ID available");
      return;
    }

    console.log("🔄 Loading team info for hackathon:", id);

    try {
      const teamData = await hackathonApi.getTeamInfo(id);

      console.log("✅ Team info loaded successfully:", {
        teamCode: teamData.teamCode,
        memberCount: teamData.teamMembers?.length || 0,
        teamSettings: teamData.teamSettings,
      });

      setTeamCode(teamData.teamCode || null);
      setTeamMembers(teamData.teamMembers || []);
      setTeamSettings(
        teamData.teamSettings || { allowJoin: true, maxMembers: 6 }
      );
    } catch (err) {
      console.log(
        "ℹ️ No team data found (this is normal if no team exists):",
        err
      );
      // This is expected if no team exists yet - reset to initial state
      setTeamCode(null);
      setTeamMembers([]);
      setTeamSettings({ allowJoin: true, maxMembers: 6 });
    }
  };

  const handleGenerateTeamCode = async () => {
    if (!id) return;

    setGeneratingTeamCode(true);
    try {
      const response = await hackathonApi.generateTeamCode(id);
      setTeamCode(response.teamCode);
      setTeamMembers(response.teamMembers || []);
      setTeamSettings(
        response.teamSettings || { allowJoin: true, maxMembers: 6 }
      );
      console.log("✅ Team code generated:", response.teamCode);
    } catch (err) {
      console.error("Failed to generate team code:", err);
    } finally {
      setGeneratingTeamCode(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!joinCodeInput.trim()) return;

    setJoiningTeam(true);
    try {
      const response = await hackathonApi.joinTeamByCode(
        joinCodeInput.toUpperCase()
      );
      console.log("✅ Successfully joined team:", response.teamCode);

      // Reload team info and project data after joining
      await loadTeamInfo();

      // If the joined project is for a different hackathon, we might need to redirect
      if (response.project.hackathonId !== hackathon?._id) {
        console.log(
          `🔄 Redirecting to joined project hackathon: ${response.project.hackathonId}`
        );
        window.location.href = `/hackathons/${response.project.hackathonId}`;
        return;
      }

      // Reload the current project data to ensure it's up to date
      if (id) {
        try {
          const updatedProject = await hackathonApi.getProject(id);
          setProject(updatedProject);
        } catch (err) {
          console.log(
            "Could not reload project data, but team join was successful"
          );
        }
      }

      setJoinCodeInput("");
      setShowJoinTeam(false);
    } catch (err) {
      console.error("Failed to join team:", err);
    } finally {
      setJoiningTeam(false);
    }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    if (!id) return;

    try {
      await hackathonApi.removeTeamMember(id, memberId);
      await loadTeamInfo(); // Reload team data
      console.log("✅ Team member removed");
    } catch (err) {
      console.error("Failed to remove team member:", err);
    }
  };

  const handleLeaveTeam = async () => {
    if (!id) return;

    try {
      await hackathonApi.leaveTeam(id);
      // Clear local team state
      setTeamCode(null);
      setTeamMembers([]);
      console.log("✅ Left team successfully");
    } catch (err) {
      console.error("Failed to leave team:", err);
    }
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
                <Button onClick={() => navigate("/dashboard")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-start justify-between mb-6">
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
                <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                  {hackathon.title}
                </p>
                <div className="flex items-center space-x-3">
                  <Badge
                    variant="secondary"
                    className="bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  >
                    {isEditing
                      ? editForm.progress || "planning"
                      : project.progress || "planning"}
                  </Badge>
                  <Badge variant="outline">
                    {project.implementationComplexity}
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
                <Button
                  variant="outline"
                  onClick={handleEdit}
                  className="border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Project
                </Button>
              )}
            </div>
          </div>

          {/* Modern Tab Navigation */}
          <div className="relative mb-8">
            <div className="flex space-x-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
              {[
                {
                  id: "overview" as TabType,
                  label: "Overview",
                  icon: FileText,
                },
                {
                  id: "workspace" as TabType,
                  label: "Workspace",
                  icon: CheckSquare,
                },
                {
                  id: "submission" as TabType,
                  label: "Submission",
                  icon: Send,
                },
                {
                  id: "whiteboard" as TabType,
                  label: "Whiteboard",
                  icon: Edit3,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md transition-all duration-200 font-medium text-sm flex-1 ${
                    activeTab === tab.id
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-600"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
                  <CardHeader>
                    <h2 className="text-xl font-semibold">Description</h2>
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

                <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
                  <CardHeader>
                    <h2 className="text-xl font-semibold">
                      💡 Unique Selling Proposition
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                      {isEditing ? (
                        <textarea
                          value={editForm.usp || ""}
                          onChange={(
                            e: React.ChangeEvent<HTMLTextAreaElement>
                          ) => updateEditForm("usp", e.target.value)}
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

                <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
                  <CardHeader>
                    <h3 className="font-semibold">🛠️ Tech Stack</h3>
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
                            variant="outline"
                            className="border-zinc-300 dark:border-zinc-600"
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
                    <h3 className="font-semibold">👥 Target Audience</h3>
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
                      <div className="space-y-3">
                        {project.targetAudience.map((audience, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-3 p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
                          >
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                                {audience}
                              </div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                Key target demographic for the solution
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
                  <CardHeader>
                    <h3 className="font-semibold">Project Stats</h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                        <div className="text-xs font-medium">Timeline</div>
                        <div className="text-sm font-bold">
                          {project.estimatedTimeline}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        <Star className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                        <div className="text-xs font-medium">Complexity</div>
                        <div className="text-sm font-bold">
                          {project.implementationComplexity}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
                  <CardHeader>
                    <h3 className="font-semibold">🌍 Social Impact</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {project.socialImpact.map((impact, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            {impact}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">👥 Team Collaboration</h3>
                      {!teamCode && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowJoinTeam(!showJoinTeam)}
                          className="text-xs"
                        >
                          Join Team
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!teamCode ? (
                      <div className="space-y-4">
                        {/* Create Team Section */}
                        <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <Users className="w-12 h-12 mx-auto mb-3 text-blue-500" />
                          <h4 className="font-semibold mb-2">Create Team</h4>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                            Generate a join code for other developers to
                            collaborate
                          </p>
                          <Button
                            onClick={handleGenerateTeamCode}
                            disabled={generatingTeamCode}
                            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                            size="sm"
                          >
                            {generatingTeamCode ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Users className="w-4 h-4 mr-2" />
                                Generate Team Code
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Join Team Section */}
                        {showJoinTeam && (
                          <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                            <h4 className="font-semibold mb-3">
                              Join Existing Team
                            </h4>
                            <div className="flex space-x-2">
                              <Input
                                value={joinCodeInput}
                                onChange={(e) =>
                                  setJoinCodeInput(e.target.value.toUpperCase())
                                }
                                placeholder="Enter 6-character team code"
                                maxLength={6}
                                className="flex-1 font-mono text-center tracking-wider"
                              />
                              <Button
                                onClick={handleJoinTeam}
                                disabled={
                                  joiningTeam || joinCodeInput.length !== 6
                                }
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {joiningTeam ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  "Join"
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Team Code Display */}
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="text-center">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                Team Code
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={loadTeamInfo}
                                className="text-xs hover:bg-green-100 dark:hover:bg-green-900/30"
                                title="Refresh team info"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="text-2xl font-mono font-bold text-green-700 dark:text-green-300 tracking-wider">
                              {teamCode}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                              Share this code with your teammates
                            </div>
                          </div>
                        </div>

                        {/* Team Members */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              Team Members ({teamMembers.length}/
                              {teamSettings.maxMembers})
                            </h4>
                          </div>

                          <div className="space-y-2">
                            {teamMembers.map((member) => (
                              <div
                                key={member.userId}
                                className="flex items-center space-x-3 p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
                              >
                                <img
                                  src={
                                    member.avatar ||
                                    `https://github.com/${member.username}.png?size=40`
                                  }
                                  alt={member.username}
                                  className="w-8 h-8 rounded-full"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {member.displayName || member.username}
                                  </div>
                                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Joined{" "}
                                    {new Date(
                                      member.joinedAt
                                    ).toLocaleDateString()}
                                  </div>
                                </div>
                                <Badge
                                  variant={
                                    member.role === "owner"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {member.role}
                                </Badge>
                                {member.role !== "owner" &&
                                  project?.userId === user?.id && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        handleRemoveTeamMember(member.userId)
                                      }
                                      className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  )}
                                {member.userId === user?.id &&
                                  member.role !== "owner" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleLeaveTeam}
                                      className="text-xs"
                                    >
                                      Leave
                                    </Button>
                                  )}
                              </div>
                            ))}
                          </div>

                          {teamMembers.length === 0 && (
                            <div className="text-center py-4 text-zinc-500 dark:text-zinc-400">
                              <p className="text-xs">
                                No team members yet. Share your team code to
                                collaborate!
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Workspace Tab (Combined Todo + GitHub) */}
          {activeTab === "workspace" && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Side - Multiple Todo Lists */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Todo Lists</h2>
                      <div className="flex space-x-2">
                        <Button
                          onClick={generateTodos}
                          disabled={generatingTodos}
                          size="sm"
                          className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                        >
                          {generatingTodos ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              AI Generate
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          New List
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Todo Lists Tabs */}
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                      {[
                        "General",
                        "Frontend",
                        "Backend",
                        "AI/ML",
                        "Design",
                      ].map((listName) => (
                        <button
                          key={listName}
                          className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800 rounded-lg text-sm font-medium hover:from-zinc-200 hover:to-zinc-300 dark:hover:from-zinc-600 dark:hover:to-zinc-700 transition-all"
                        >
                          {listName}
                        </button>
                      ))}
                    </div>

                    {/* Add Todo */}
                    <div className="flex space-x-2">
                      <Input
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        placeholder="Add a new task..."
                        onKeyPress={(e) => e.key === "Enter" && addTodo()}
                        className="flex-1 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      />
                      <Button
                        onClick={addTodo}
                        disabled={!newTodo.trim()}
                        className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Todo List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {todos.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                          <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-sm">
                            No tasks yet. Add some or use AI to generate them!
                          </p>
                        </div>
                      ) : (
                        todos.map((todo) => (
                          <div
                            key={todo.id}
                            className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                              todo.completed
                                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                            }`}
                          >
                            <button
                              onClick={() => toggleTodo(todo.id)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                                todo.completed
                                  ? "bg-green-500 border-green-500 shadow-md"
                                  : "border-zinc-400 dark:border-zinc-600 hover:border-green-500 hover:shadow-md"
                              }`}
                            >
                              {todo.completed && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div
                                className={`font-medium ${
                                  todo.completed
                                    ? "line-through text-zinc-500"
                                    : ""
                                }`}
                              >
                                {todo.title}
                              </div>
                              {todo.description && (
                                <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                  {todo.description}
                                </div>
                              )}
                            </div>

                            <Badge
                              className={getPriorityColor(todo.priority)}
                              variant="secondary"
                            >
                              {todo.priority}
                            </Badge>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteTodo(todo.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Progress Bar */}
                    {todos.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold">
                            Progress
                          </span>
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            {todos.filter((t) => t.completed).length} of{" "}
                            {todos.length} completed
                          </span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-600 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                            style={{
                              width: `${
                                (todos.filter((t) => t.completed).length /
                                  todos.length) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Side - GitHub Commits */}
              <div className="space-y-6">
                <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
                  <CardHeader className="pb-3">
                    <h2 className="text-xl font-semibold">GitHub Activity</h2>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!githubConnected ? (
                      <div className="text-center py-8">
                        <Github className="w-16 h-16 mx-auto mb-4 text-zinc-400" />
                        <h3 className="text-lg font-semibold mb-2">
                          Connect Repository
                        </h3>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-sm">
                          Track your development progress
                        </p>
                        <div className="flex space-x-2">
                          <Input
                            value={githubRepo}
                            onChange={(e) => setGithubRepo(e.target.value)}
                            placeholder="https://github.com/username/repo"
                            className="flex-1 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600"
                          />
                          <Button
                            onClick={connectGitHub}
                            disabled={!githubRepo.trim() || loadingCommits}
                            className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            {loadingCommits ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Link className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Repository Info */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 rounded-lg">
                            <div className="flex items-center space-x-3 flex-1">
                              <Github className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                              <div className="flex-1">
                                <div className="font-medium mb-1">
                                  Connected Repository
                                </div>
                                {editingGithubUrl ? (
                                  <div className="flex space-x-2">
                                    <Input
                                      value={githubRepo}
                                      onChange={(e) =>
                                        setGithubRepo(e.target.value)
                                      }
                                      placeholder="https://github.com/username/repo"
                                      className="flex-1 h-8 text-sm bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={saveGitHubUrl}
                                      disabled={
                                        loadingCommits || !githubRepo.trim()
                                      }
                                      className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      {loadingCommits ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        "Save"
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelGitHubEdit}
                                      className="h-8 px-3"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <div className="text-sm text-zinc-600 dark:text-zinc-400 flex-1">
                                      {githubRepo}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingGithubUrl(true)}
                                      className="h-6 px-2 text-xs hover:bg-zinc-200 dark:hover:bg-zinc-600"
                                    >
                                      Edit
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={loadCommits}
                                disabled={loadingCommits}
                                className="hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                title={`Refresh commits (fetching ${commitFetchCount} commits)`}
                              >
                                {loadingCommits ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(githubRepo, "_blank")
                                }
                                className="hover:bg-zinc-200 dark:hover:bg-zinc-700"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Commit Fetch Settings */}
                          <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                            <div className="flex items-center space-x-3">
                              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Commit History
                              </div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                Showing last {commitFetchCount} commits
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <select
                                value={commitFetchCount}
                                onChange={(e) =>
                                  setCommitFetchCount(parseInt(e.target.value))
                                }
                                className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value={10}>10 commits</option>
                                <option value={25}>25 commits</option>
                                <option value={50}>50 commits</option>
                                <option value={100}>100 commits</option>
                              </select>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={loadCommits}
                                disabled={loadingCommits}
                                className="h-7 px-2 text-xs"
                              >
                                Update
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Recent Commits */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">
                            Recent Commits
                          </h3>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {commits.length === 0 ? (
                              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                                <GitCommit className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="text-sm">
                                  No commits found. Start pushing code!
                                </p>
                              </div>
                            ) : (
                              commits.map((commit) => (
                                <div
                                  key={commit.sha}
                                  className="flex items-start space-x-3 p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-md transition-all duration-200"
                                >
                                  <img
                                    src={
                                      commit.authorAvatar ||
                                      `https://github.com/${commit.author}.png?size=40`
                                    }
                                    alt={commit.author}
                                    className="w-8 h-8 rounded-full"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                                      {commit.message}
                                    </div>
                                    <div className="flex items-center space-x-4 text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                                      <span>{commit.author}</span>
                                      <span>
                                        {new Date(commit.date).toLocaleString()}
                                      </span>
                                      <span className="font-mono bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded">
                                        {commit.sha.substring(0, 7)}
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      window.open(commit.url, "_blank")
                                    }
                                    className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* GitHub integration is now part of workspace tab above */}
          {false && (
            <div className="max-w-4xl">
              <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <h2 className="text-xl font-semibold">GitHub Integration</h2>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!githubConnected ? (
                    <div className="text-center py-8">
                      <Github className="w-16 h-16 mx-auto mb-4 text-zinc-400" />
                      <h3 className="text-lg font-semibold mb-2">
                        Connect GitHub Repository
                      </h3>
                      <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                        Connect your GitHub repository to track commits and
                        progress
                      </p>
                      <div className="flex space-x-2 max-w-md mx-auto">
                        <Input
                          value={githubRepo}
                          onChange={(e) => setGithubRepo(e.target.value)}
                          placeholder="https://github.com/username/repo"
                          className="flex-1"
                        />
                        <Button
                          onClick={connectGitHub}
                          disabled={!githubRepo.trim() || loadingCommits}
                        >
                          {loadingCommits ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Link className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Repository Info */}
                      <div className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Github className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                          <div>
                            <div className="font-medium">
                              Connected Repository
                            </div>
                            <div className="text-sm text-zinc-600 dark:text-zinc-400">
                              {githubRepo}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={loadCommits}
                            disabled={loadingCommits}
                          >
                            {loadingCommits ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(githubRepo, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Recent Commits */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">
                          Recent Commits
                        </h3>
                        {commits.length === 0 ? (
                          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                            <GitCommit className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>
                              No commits found. Start pushing code to see
                              activity!
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {commits.map((commit) => (
                              <div
                                key={commit.sha}
                                className="flex items-start space-x-3 p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
                              >
                                <img
                                  src={
                                    commit.authorAvatar ||
                                    `https://github.com/${commit.author}.png?size=40`
                                  }
                                  alt={commit.author}
                                  className="w-8 h-8 rounded-full"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                    {commit.message}
                                  </div>
                                  <div className="flex items-center space-x-4 text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                    <span>{commit.author}</span>
                                    <span>
                                      {new Date(commit.date).toLocaleString()}
                                    </span>
                                    <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded">
                                      {commit.sha.substring(0, 7)}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    window.open(commit.url, "_blank")
                                  }
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Submission Tab */}
          {activeTab === "submission" && (
            <div className="max-w-4xl">
              <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <h2 className="text-xl font-semibold">
                    AI Submission Assistant
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Generate professional answers for your hackathon submission
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Question Input */}
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Input
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        placeholder="Ask any question about your submission..."
                        className="w-full bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600"
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && customQuestion.trim()) {
                            handleGenerateAnswer(customQuestion);
                          }
                        }}
                      />
                      <Button
                        onClick={() => handleGenerateAnswer(customQuestion)}
                        disabled={
                          generatingSubmission || !customQuestion.trim()
                        }
                        className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                      >
                        {generatingSubmission ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Answer
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Quick Questions */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Quick questions:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "What problem does this solve?",
                          "What technologies did you use?",
                          "What makes this innovative?",
                          "What challenges did you face?",
                          "How would you scale this?",
                        ].map((question, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-xs py-1 px-2"
                            onClick={() => handleGenerateAnswer(question)}
                          >
                            {question}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Generated Answers */}
                  {submissionQuestions.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                          Generated Answers
                        </h3>
                        <Button
                          onClick={saveAllAnswers}
                          disabled={savingAnswers}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {savingAnswers ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save All
                            </>
                          )}
                        </Button>
                      </div>

                      {submissionQuestions.map((question) => (
                        <div
                          key={question.id}
                          className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden"
                        >
                          <div className="bg-zinc-50 dark:bg-zinc-700 px-4 py-3 border-b border-zinc-200 dark:border-zinc-600">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                                {question.question}
                              </h4>
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() =>
                                    copyAnswerToClipboard(
                                      question.id,
                                      question.answer
                                    )
                                  }
                                  disabled={!question.answer.trim()}
                                  size="sm"
                                  variant="outline"
                                  className={`text-xs h-7 transition-all duration-200 ${
                                    copiedAnswers.has(question.id)
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-600 border-green-300"
                                      : "hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                  }`}
                                  title="Copy answer to clipboard"
                                >
                                  {copiedAnswers.has(question.id) ? (
                                    <>
                                      <Check className="w-3 h-3 mr-1" />
                                      Copied!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                    </>
                                  )}
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleRegenerateAnswer(
                                      question.id,
                                      question.question
                                    )
                                  }
                                  disabled={generatingSubmission}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7"
                                  title="Regenerate answer"
                                >
                                  {generatingSubmission ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="w-3 h-3" />
                                  )}
                                </Button>
                                <Button
                                  onClick={() => removeQuestion(question.id)}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 text-red-600 hover:text-red-700"
                                  title="Remove question"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <textarea
                              value={question.answer}
                              onChange={(e) =>
                                updateSubmissionAnswer(
                                  question.id,
                                  e.target.value
                                )
                              }
                              className="w-full min-h-[120px] bg-transparent border-0 resize-none text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-0 leading-relaxed"
                              placeholder="AI-generated answer will appear here..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {submissionQuestions.length === 0 && (
                    <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                      <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">
                        No questions yet
                      </p>
                      <p className="text-sm">
                        Ask a question above or click on a quick question to get
                        started
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Whiteboard Tab */}
          {activeTab === "whiteboard" && (
            <div className="max-w-6xl">
              <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      Project Whiteboard
                    </h2>
                    <div className="flex space-x-2">
                      {["yellow", "blue", "green", "pink"].map((color) => (
                        <Button
                          key={color}
                          size="sm"
                          onClick={() => addStickyNote(color)}
                          className={`${
                            color === "yellow"
                              ? "bg-yellow-500 hover:bg-yellow-600"
                              : color === "blue"
                              ? "bg-blue-500 hover:bg-blue-600"
                              : color === "green"
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-pink-500 hover:bg-pink-600"
                          } text-white`}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {color.charAt(0).toUpperCase() + color.slice(1)}
                        </Button>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStickyNotes([])}
                        className="border-zinc-300 dark:border-zinc-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white dark:bg-zinc-800 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 min-h-[600px] p-6 relative overflow-hidden">
                    {/* Whiteboard Grid */}
                    <div className="absolute inset-0 opacity-20">
                      <svg
                        width="100%"
                        height="100%"
                        className="pointer-events-none"
                      >
                        <defs>
                          <pattern
                            id="grid"
                            width="20"
                            height="20"
                            patternUnits="userSpaceOnUse"
                          >
                            <path
                              d="M 20 0 L 0 0 0 20"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="0.5"
                            />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                      </svg>
                    </div>

                    {/* Sticky Notes */}
                    <div className="relative z-10">
                      {stickyNotes.map((note) => (
                        <div
                          key={note.id}
                          className={`absolute w-48 h-32 rounded-lg shadow-lg p-3 cursor-move transform hover:scale-105 transition-all duration-200 ${
                            note.color === "yellow"
                              ? "bg-yellow-200 dark:bg-yellow-700"
                              : note.color === "blue"
                              ? "bg-blue-200 dark:bg-blue-700"
                              : note.color === "green"
                              ? "bg-green-200 dark:bg-green-700"
                              : "bg-pink-200 dark:bg-pink-700"
                          }`}
                          style={{
                            left: note.x,
                            top: note.y,
                            transform: `rotate(${Math.random() * 4 - 2}deg)`,
                          }}
                          onMouseDown={(e) => {
                            const startX = e.clientX - note.x;
                            const startY = e.clientY - note.y;

                            const handleMouseMove = (e: MouseEvent) => {
                              updateStickyNote(note.id, {
                                x: e.clientX - startX,
                                y: e.clientY - startY,
                              });
                            };

                            const handleMouseUp = () => {
                              document.removeEventListener(
                                "mousemove",
                                handleMouseMove
                              );
                              document.removeEventListener(
                                "mouseup",
                                handleMouseUp
                              );
                            };

                            document.addEventListener(
                              "mousemove",
                              handleMouseMove
                            );
                            document.addEventListener("mouseup", handleMouseUp);
                          }}
                        >
                          <button
                            onClick={() => deleteStickyNote(note.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <textarea
                            value={note.content}
                            onChange={(e) =>
                              updateStickyNote(note.id, {
                                content: e.target.value,
                              })
                            }
                            className="w-full h-full bg-transparent border-0 resize-none text-sm font-medium text-gray-800 dark:text-gray-200 placeholder-gray-600 dark:placeholder-gray-400 focus:outline-none"
                            placeholder="Add your ideas here..."
                          />
                        </div>
                      ))}
                    </div>

                    {/* Empty State */}
                    {stickyNotes.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center text-zinc-400 dark:text-zinc-500">
                          <Edit3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">
                            Digital Whiteboard
                          </p>
                          <p className="text-sm">
                            Add sticky notes to brainstorm and organize your
                            ideas
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Collaboration Info */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-blue-800 dark:text-blue-300 text-sm">
                      🤝 This whiteboard is shared with your team members and
                      updates in real-time
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
