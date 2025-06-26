import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import {
  MessageSquare,
  Plus,
  History,
  Settings,
  Trash2,
  Edit3,
  Send,
  Bot,
  User,
  Sparkles,
  Lightbulb,
  Target,
  Code,
  Users,
  Clock,
  MoreVertical,
  Search,
  Archive,
  Star,
  AlertCircle,
  Loader2,
  Activity,
  Zap,
  ChevronUp,
  ChevronDown,
  Heart,
  Bookmark,
  ArrowDown,
} from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { GradientText } from "./ui/gradient-text";
import { RainbowButton } from "./ui/rainbow-button";
import { IdeaCards } from "./IdeaCards";
import { IdeaDetailDialog } from "./IdeaDetailDialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Card, CardContent } from "./ui/card";
import ReactMarkdown from "react-markdown";
import {
  chatSessionsApi,
  messagesApi,
  favoriteIdeasApi,
  ApiError,
} from "../services/api";
import type {
  ChatSession,
  ChatMessage as ApiChatMessage,
  FavoriteIdea,
} from "../services/api";

interface LocalChatMessage extends ApiChatMessage {
  timestamp: Date;
  isOptimistic?: boolean;
}

export const Chat: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Data State
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Favorite Ideas State
  const [favoriteIdeas, setFavoriteIdeas] = useState<FavoriteIdea[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesExpanded, setFavoritesExpanded] = useState(false);
  const [selectedFavoriteIdea, setSelectedFavoriteIdea] = useState<any>(null);
  const [ideaDialogOpen, setIdeaDialogOpen] = useState(false);

  // Scroll State
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadChatSessions();
      loadFavoriteIdeas();
    }
  }, [user]);

  // Load messages when session changes
  useEffect(() => {
    if (selectedSessionId) {
      loadMessages(selectedSessionId);
    } else {
      setMessages([]);
    }
  }, [selectedSessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle scroll detection for jump to bottom button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
      setShowJumpToBottom(!isAtBottom && messages.length > 0);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowJumpToBottom(false);
  };

  const jumpToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowJumpToBottom(false);
  };

  const loadChatSessions = async () => {
    try {
      setLoading(true);
      const response = await chatSessionsApi.getSessions({
        search: searchQuery || undefined,
      });
      setChatSessions(response.sessions || []);

      // Auto-select first session if none selected
      if (!selectedSessionId && response.sessions?.length > 0) {
        setSelectedSessionId(response.sessions[0]._id);
      }
    } catch (err) {
      console.error("Failed to load chat sessions:", err);
      setError(
        err instanceof ApiError ? err.message : "Failed to load chat sessions"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteIdeas = async () => {
    try {
      setFavoritesLoading(true);
      const response = await favoriteIdeasApi.getFavorites({
        limit: 20,
      });
      setFavoriteIdeas(response.ideas || []);
    } catch (err) {
      console.error("Failed to load favorite ideas:", err);
    } finally {
      setFavoritesLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      setMessagesLoading(true);
      const response = await messagesApi.getMessages(sessionId);

      // Convert API messages to local format
      const localMessages: LocalChatMessage[] = (response.messages || []).map(
        (msg: ApiChatMessage) => ({
          ...msg,
          timestamp: new Date(msg.createdAt),
        })
      );

      setMessages(localMessages);
    } catch (err) {
      console.error("Failed to load messages:", err);
      setError(
        err instanceof ApiError ? err.message : "Failed to load messages"
      );
    } finally {
      setMessagesLoading(false);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await chatSessionsApi.createSession({
        title: "New Minerva Session",
      });

      const newSession = response;
      setChatSessions((prev) => [newSession, ...prev]);
      setSelectedSessionId(newSession._id);
      setMessages([]);

      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error("Failed to create session:", err);
      setError(
        err instanceof ApiError ? err.message : "Failed to create session"
      );
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this chat session?")) return;

    try {
      await chatSessionsApi.deleteSession(sessionId);
      setChatSessions((prev) => prev.filter((s) => s._id !== sessionId));

      if (selectedSessionId === sessionId) {
        const remainingSessions = chatSessions.filter(
          (s) => s._id !== sessionId
        );
        setSelectedSessionId(
          remainingSessions.length > 0 ? remainingSessions[0]._id : null
        );
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
      setError(
        err instanceof ApiError ? err.message : "Failed to delete session"
      );
    }
  };

  const toggleMessageStar = async (messageId: string) => {
    try {
      await messagesApi.toggleMessageStar(messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, isStarred: !msg.isStarred } : msg
        )
      );
    } catch (err) {
      console.error("Failed to star message:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !selectedSessionId) return;

    const messageContent = currentMessage.trim();
    setCurrentMessage("");
    setIsTyping(true);

    // Add optimistic user message
    const optimisticUserMessage: LocalChatMessage = {
      _id: `temp-${Date.now()}`,
      sessionId: selectedSessionId,
      userId: user!.id,
      type: "user",
      content: messageContent,
      messageMode: "text",
      isEdited: false,
      editHistory: [],
      isStarred: false,
      metadata: {},
      tokensUsed: 0,
      processingTime: 0,
      timestamp: new Date(),
      isOptimistic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);

    try {
      const response = await messagesApi.sendMessage(selectedSessionId, {
        content: messageContent,
        messageMode: "text",
      });

      // Remove optimistic message and add real messages
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((msg) => !msg.isOptimistic);
        const userMsg: LocalChatMessage = {
          ...response.userMessage,
          timestamp: new Date(response.userMessage.createdAt),
        };
        const aiMsg: LocalChatMessage = {
          ...response.aiMessage,
          timestamp: new Date(response.aiMessage.createdAt),
        };
        return [...withoutOptimistic, userMsg, aiMsg];
      });

      // Update session in sidebar
      setChatSessions((prev) =>
        prev.map((session) =>
          session._id === selectedSessionId
            ? {
                ...session,
                messageCount: response.session.messageCount,
                lastMessageAt: new Date().toISOString(),
              }
            : session
        )
      );
    } catch (err) {
      console.error("Failed to send message:", err);

      // Remove optimistic message and show error
      setMessages((prev) => prev.filter((msg) => !msg.isOptimistic));
      setError(
        err instanceof ApiError ? err.message : "Failed to send message"
      );
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action: string) => {
    const prompts = {
      ideas: "Generate 3 innovative project ideas for a tech hackathon",
      strategy: "Help me plan the strategy for my hackathon project",
      techstack: "Suggest the best tech stack for my hackathon project",
      team: "How should I form and organize my hackathon team?",
    };

    setCurrentMessage(prompts[action as keyof typeof prompts] || "");
    inputRef.current?.focus();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diff = now.getTime() - messageDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return messageDate.toLocaleDateString();
  };

  // Helper function to determine session type/theme
  const getSessionTheme = (session: ChatSession) => {
    const title = session.title.toLowerCase();
    const description = session.description?.toLowerCase() || "";

    if (title.includes("idea") || description.includes("idea")) {
      return {
        text: "Ideas",
        icon: "💡",
        color:
          "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
      };
    }
    if (title.includes("strategy") || description.includes("strategy")) {
      return {
        text: "Strategy",
        icon: "🎯",
        color:
          "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
      };
    }
    if (
      title.includes("tech") ||
      title.includes("stack") ||
      description.includes("tech")
    ) {
      return {
        text: "Tech Stack",
        icon: "⚡",
        color:
          "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
      };
    }
    if (title.includes("team") || description.includes("team")) {
      return {
        text: "Team",
        icon: "👥",
        color:
          "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
      };
    }
    if (
      title.includes("nft") ||
      description.includes("nft") ||
      title.includes("web3") ||
      description.includes("web3")
    ) {
      return {
        text: "Web3",
        icon: "🌐",
        color:
          "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300",
      };
    }
    if (
      title.includes("ai") ||
      title.includes("ml") ||
      description.includes("ai") ||
      description.includes("machine learning")
    ) {
      return {
        text: "AI/ML",
        icon: "🤖",
        color:
          "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300",
      };
    }

    // Default based on message count
    if (session.messageCount === 0) {
      return {
        text: "New",
        icon: "✨",
        color: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
      };
    }
    if (session.messageCount < 5) {
      return {
        text: "Starting",
        icon: "🚀",
        color:
          "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
      };
    }
    if (session.messageCount < 15) {
      return {
        text: "Active",
        icon: "💬",
        color:
          "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
      };
    }

    return {
      text: "Deep Dive",
      icon: "🔍",
      color:
        "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    };
  };

  // Helper function to get activity status
  const getActivityStatus = (session: ChatSession) => {
    const lastMessageDate = new Date(session.lastMessageAt);
    const now = new Date();
    const diffHours =
      (now.getTime() - lastMessageDate.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    if (diffHours < 48) return "Yesterday";

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return lastMessageDate.toLocaleDateString();
  };

  // Convert FavoriteIdea to IdeaData format for the dialog
  const convertFavoriteToIdeaData = (favorite: FavoriteIdea) => {
    return {
      "Idea Title": favorite.ideaTitle,
      "Idea Description": favorite.ideaDescription,
      USP: favorite.usp,
      "Tech Stack": favorite.techStack,
      "Target Audience": favorite.targetAudience,
      "Implementation Complexity": favorite.implementationComplexity,
      "Estimated Timeline": favorite.estimatedTimeline,
      "Market Potential": favorite.marketPotential,
      "Social Impact": favorite.socialImpact,
    };
  };

  const handleFavoriteIdeaClick = (favorite: FavoriteIdea) => {
    const ideaData = convertFavoriteToIdeaData(favorite);
    setSelectedFavoriteIdea(ideaData);
    setIdeaDialogOpen(true);
  };

  const handleFavoriteDialogClose = () => {
    setIdeaDialogOpen(false);
    setSelectedFavoriteIdea(null);
  };

  const renderMessage = (message: LocalChatMessage) => {
    // Check if this is an assistant message that might contain ideas
    if (message.type === "assistant") {
      const content = message.content;

      // Look for JSON arrays in the content (this handles both cases: when ideaData is set and when it's not)
      const jsonMatch =
        content.match(/```json\s*([\s\S]*?)\s*```/) ||
        content.match(/```\s*(\[[\s\S]*?\])\s*```/) ||
        content.match(/(\[[\s\S]*?\])/);

      if (jsonMatch) {
        try {
          // Extract and parse the JSON
          let jsonString = jsonMatch[1] || jsonMatch[0];

          // Clean up the JSON string
          jsonString = jsonString
            .replace(/^```json\s*/, "")
            .replace(/\s*```$/, "")
            .trim();

          const parsedIdeas = JSON.parse(jsonString);

          // Validate that it's an array of idea objects
          if (
            Array.isArray(parsedIdeas) &&
            parsedIdeas.length > 0 &&
            parsedIdeas[0]["Idea Title"]
          ) {
            const jsonStartIndex = content.indexOf(jsonMatch[0]);
            const jsonEndIndex = jsonStartIndex + jsonMatch[0].length;

            const beforeJson = content.substring(0, jsonStartIndex).trim();
            const afterJson = content.substring(jsonEndIndex).trim();

            return (
              <div className="space-y-4">
                {beforeJson && (
                  <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{beforeJson}</ReactMarkdown>
                  </div>
                )}
                <IdeaCards
                  ideas={parsedIdeas}
                  onCopyIdea={() => {}}
                  onStarIdea={() => {
                    // Refresh favorites when an idea is starred from chat
                    loadFavoriteIdeas();
                  }}
                />
                {afterJson && (
                  <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{afterJson}</ReactMarkdown>
                  </div>
                )}
              </div>
            );
          }
        } catch (error) {
          console.error("Failed to parse ideas JSON:", error);
        }
      }

      // Special handling for messages that have ideaData set (backup method)
      if (
        message.messageMode === "ideas" &&
        message.ideaData &&
        Array.isArray(message.ideaData)
      ) {
        return (
          <div className="space-y-4">
            <IdeaCards
              ideas={message.ideaData}
              onCopyIdea={() => {}}
              onStarIdea={() => {
                // Refresh favorites when an idea is starred from chat
                loadFavoriteIdeas();
              }}
            />
          </div>
        );
      }
    }

    // Default rendering for all other messages
    return (
      <div
        className={`text-sm leading-relaxed max-w-none ${
          message.type === "assistant" ? "prose prose-sm dark:prose-invert" : ""
        }`}
      >
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
    );
  };

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

  const selectedSession = chatSessions.find((s) => s._id === selectedSessionId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 text-gray-900 dark:text-white pt-16">
      {/* Background effects */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="flex h-[calc(100vh-4rem)] relative z-10">
        {/* Sidebar */}
        <div
          className={`${
            sidebarCollapsed ? "w-16" : "w-80"
          } transition-all duration-300 bg-white/60 dark:bg-black/40 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50 flex flex-col`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
            {!sidebarCollapsed ? (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <GradientText className="text-lg font-bold">
                    Minerva
                  </GradientText>
                </div>
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex justify-center mb-4">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            )}

            {!sidebarCollapsed && (
              <RainbowButton
                className="w-full py-3 text-sm font-medium"
                onClick={createNewSession}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Minerva Session
              </RainbowButton>
            )}
          </div>

          {/* Search */}
          {!sidebarCollapsed && (
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && loadChatSessions()}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm"
                />
              </div>
            </div>
          )}

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : !sidebarCollapsed ? (
              <div className="p-2 space-y-1">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recent Sessions
                </div>
                {chatSessions.length === 0 ? (
                  <Card className="mx-3 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        No chat sessions yet
                      </p>
                      <p className="text-xs text-gray-400">
                        Create your first session to start brainstorming!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  chatSessions.map((session) => (
                    <Card
                      key={session._id}
                      className={`group mx-2 cursor-pointer transition-all duration-200 hover:shadow-md backdrop-blur-sm ${
                        selectedSessionId === session._id
                          ? "bg-blue-50/80 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 shadow-md"
                          : "bg-white/40 dark:bg-gray-800/40 border-gray-200/50 dark:border-gray-700/50 hover:bg-white/60 dark:hover:bg-gray-800/60"
                      }`}
                      onClick={() => setSelectedSessionId(session._id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold truncate mb-1">
                              {session.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {session.description ||
                                (session.messageCount === 0
                                  ? "Ready to start brainstorming"
                                  : `${session.messageCount} exchanges with Minerva`)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session._id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        <Separator className="my-2 bg-gray-200/50 dark:bg-gray-700/50" />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                {getActivityStatus(session)}
                              </span>
                            </div>
                          </div>
                          {(() => {
                            const theme = getSessionTheme(session);
                            return (
                              <Badge
                                variant="secondary"
                                className={`text-xs font-medium ${theme.color} border-0`}
                              >
                                <span className="mr-1">{theme.icon}</span>
                                {theme.text}
                              </Badge>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {chatSessions.slice(0, 3).map((session, index) => (
                  <div
                    key={session._id}
                    className="w-12 h-12 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl flex items-center justify-center hover:bg-gray-200/50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    title={session.title}
                    onClick={() => setSelectedSessionId(session._id)}
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-teal-500 rounded-md flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Favorite Ideas Accordion */}
          <div className="border-t border-gray-200/50 dark:border-gray-800/50">
            {!sidebarCollapsed ? (
              <div className="relative">
                {/* Accordion Content - Opens Upward */}
                <div
                  className={`absolute bottom-full left-0 right-0 bg-white/80 dark:bg-black/60 backdrop-blur-xl border-t-2 border-pink-500 max-h-80 overflow-y-auto rounded-t-xl transition-all duration-500 ease-out transform-gpu ${
                    favoritesExpanded
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-4 scale-95 pointer-events-none"
                  }`}
                >
                  <div className="p-3 space-y-2">
                    {favoritesLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    ) : favoriteIdeas.length === 0 ? (
                      <div className="text-center p-4">
                        <Heart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          No favorite ideas yet
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Star ideas from chat to see them here
                        </p>
                      </div>
                    ) : (
                      favoriteIdeas.map((idea, index) => (
                        <Card
                          key={idea._id}
                          className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:scale-[1.02] transform-gpu animate-riseUp"
                          style={{
                            animationDelay: `${index * 50}ms`,
                            animationFillMode: "both",
                          }}
                          onClick={() => handleFavoriteIdeaClick(idea)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Lightbulb className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold truncate mb-1">
                                  {idea.ideaTitle}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                  {idea.ideaDescription.length > 80
                                    ? `${idea.ideaDescription.substring(
                                        0,
                                        80
                                      )}...`
                                    : idea.ideaDescription}
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Badge
                                    variant="outline"
                                    className="text-xs h-5"
                                  >
                                    {idea.implementationComplexity}
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs h-5"
                                  >
                                    {idea.estimatedTimeline}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                {/* Accordion Toggle Button */}
                <button
                  onClick={() => setFavoritesExpanded(!favoritesExpanded)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-300 hover:scale-[1.01] transform-gpu"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center transition-all duration-300 shadow-lg shadow-pink-500/20">
                      <Heart className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">Favorite Ideas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {favoriteIdeas.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 transition-all duration-300 hover:scale-110 transform-gpu"
                      >
                        {favoriteIdeas.length}
                      </Badge>
                    )}
                    <ChevronUp
                      className={`w-4 h-4 transition-all duration-300 transform-gpu ${
                        favoritesExpanded
                          ? "rotate-180 scale-110"
                          : "hover:scale-110"
                      }`}
                    />
                  </div>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setFavoritesExpanded(!favoritesExpanded)}
                className="w-full p-4 flex justify-center hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                title="Favorite Ideas"
              >
                <Heart className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative">
          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto scrollbar-hide p-4 pt-28 pb-32 space-y-6"
          >
            {!selectedSession ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Welcome to Minerva
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                  Your AI-powered hackathon brainstorming assistant. Create a
                  new session to start generating amazing project ideas!
                </p>
                <RainbowButton onClick={createNewSession}>
                  <Plus className="w-4 h-4 mr-2" />
                  Start Your First Session
                </RainbowButton>
              </div>
            ) : messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-950 via-black to-yellow-950 dark:bg-gradient-to-br dark:from-purple-50 dark:via-white dark:to-yellow-50 rounded-xl flex items-center justify-center mb-4">
                  <Bot className="w-6 h-6 text-white dark:text-gray-800" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Ready to brainstorm?
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                  I'm here to help you generate innovative hackathon project
                  ideas. What kind of hackathon are you preparing for?
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex space-x-3 max-w-4xl ${
                      message.type === "user"
                        ? "flex-row-reverse space-x-reverse"
                        : ""
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {message.type === "user" ? (
                        <UserAvatar user={user} size="md" />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-950 via-black to-yellow-950 dark:bg-gradient-to-br dark:from-purple-50 dark:via-white dark:to-yellow-50 rounded-lg flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white dark:text-gray-800" />
                        </div>
                      )}
                    </div>
                    <div
                      className={`flex flex-col ${
                        message.type === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          message.type === "user"
                            ? "bg-gradient-to-br from-purple-950 via-black to-yellow-950 dark:bg-gradient-to-br dark:from-purple-50 dark:via-white dark:to-yellow-50 text-white dark:text-gray-800"
                            : "bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
                        } ${message.isOptimistic ? "opacity-70" : ""}`}
                      >
                        {renderMessage(message)}
                      </div>
                      <div className="flex items-center space-x-2 mt-1 px-1">
                        <span className="text-xs text-gray-400">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.type === "assistant" &&
                          !message.isOptimistic && (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => toggleMessageStar(message._id)}
                                className="p-1 rounded hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                              >
                                <Star
                                  className={`w-3 h-3 ${
                                    message.isStarred
                                      ? "text-yellow-500 fill-current"
                                      : "text-gray-400"
                                  }`}
                                />
                              </button>
                              {message.tokensUsed > 0 && (
                                <span className="text-xs text-gray-400">
                                  {message.tokensUsed} tokens
                                </span>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex space-x-3 max-w-3xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-950 via-black to-yellow-950 dark:bg-gradient-to-br dark:from-purple-50 dark:via-white dark:to-yellow-50 rounded-lg flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white dark:text-gray-800" />
                  </div>
                  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 px-4 py-3 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="flex justify-center">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-2 max-w-md">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {error}
                    </p>
                    <button
                      onClick={() => setError(null)}
                      className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 mt-1"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />

            {/* Jump to Bottom Button */}
            {showJumpToBottom && (
              <button
                onClick={jumpToBottom}
                className="fixed bottom-24 right-8 z-20 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 transform-gpu animate-slideUp"
                title="Jump to bottom"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Chat Header - Overlay */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-white/20 dark:bg-black/20 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-950 via-black to-yellow-950 dark:bg-gradient-to-br dark:from-purple-50 dark:via-white dark:to-yellow-50 rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white dark:text-gray-800" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    {selectedSession
                      ? selectedSession.title
                      : "Minerva Assistant"}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedSession
                      ? `${selectedSession.messageCount} messages`
                      : "Ready to help you ideate and strategize"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 px-3 py-1 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-full">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Input Area - Glassmorphic Overlay */}
          {selectedSession && (
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/20 dark:bg-black/20 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 animate-slideUp">
              <div className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Describe your project idea, challenge, or what you need help brainstorming..."
                      className="w-full px-4 py-3 pr-12 bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none text-sm leading-relaxed backdrop-blur-sm"
                      rows={1}
                      style={{ minHeight: "44px", maxHeight: "120px" }}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                      <div className="text-xs text-gray-400">
                        {currentMessage.length > 0 &&
                          `${currentMessage.length}`}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || isTyping}
                    className="p-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl hover:from-blue-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100 shadow-lg backdrop-blur-sm"
                  >
                    {isTyping ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center space-x-2 mt-3">
                  <button
                    onClick={() => handleQuickAction("ideas")}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors text-xs backdrop-blur-sm"
                  >
                    <Lightbulb className="w-3 h-3" />
                    <span>Generate Ideas</span>
                  </button>
                  <button
                    onClick={() => handleQuickAction("strategy")}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors text-xs backdrop-blur-sm"
                  >
                    <Target className="w-3 h-3" />
                    <span>Plan Strategy</span>
                  </button>
                  <button
                    onClick={() => handleQuickAction("techstack")}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors text-xs backdrop-blur-sm"
                  >
                    <Code className="w-3 h-3" />
                    <span>Tech Stack</span>
                  </button>
                  <button
                    onClick={() => handleQuickAction("team")}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors text-xs backdrop-blur-sm"
                  >
                    <Users className="w-3 h-3" />
                    <span>Team Formation</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Favorite Ideas Detail Dialog */}
      <IdeaDetailDialog
        idea={selectedFavoriteIdea}
        isOpen={ideaDialogOpen}
        onClose={handleFavoriteDialogClose}
        onCopyIdea={() => {}}
        onStarIdea={() => {
          // Refresh favorites when an idea is starred/unstarred
          loadFavoriteIdeas();
        }}
      />
    </div>
  );
};
