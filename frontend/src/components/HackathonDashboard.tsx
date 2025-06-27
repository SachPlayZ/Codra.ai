import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Plus,
  Trophy,
  ExternalLink,
  Lightbulb,
  Loader2,
  AlertCircle,
  Timer,
  DollarSign,
  ArrowRight,
  Search,
  X,
  FolderOpen,
} from "lucide-react";
import { GradientText } from "./ui/gradient-text";
import { RainbowButton } from "./ui/rainbow-button";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader } from "./ui/card";
import {
  hackathonApi,
  chatSessionsApi,
  messagesApi,
  ApiError,
} from "../services/api";
import type { Hackathon } from "../services/api";

interface CountdownTimerProps {
  endDateTime: string | undefined;
  endDate: string;
  timezone?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  endDateTime,
  endDate,
  timezone,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [localEndTime, setLocalEndTime] = useState<string>("");

  // Helper function to get timezone name from UTC offset
  const getTimezoneDisplayName = (timezoneStr: string) => {
    if (!timezoneStr) return "";

    const utcOffsetMatch = timezoneStr.match(/UTC([+-])(\d{1,2}):?(\d{2})?/i);
    if (utcOffsetMatch) {
      const sign = utcOffsetMatch[1];
      const hours = parseInt(utcOffsetMatch[2]);
      const minutes = parseInt(utcOffsetMatch[3] || "0");

      // Common timezone mappings based on UTC offset
      const offsetHours = (sign === "+" ? 1 : -1) * (hours + minutes / 60);
      const timezoneNames: Record<string, string> = {
        "-8": "PST",
        "-7": "PDT/MST",
        "-6": "CST/MDT",
        "-5": "EST/CDT",
        "-4": "EDT/AST",
        "0": "GMT/UTC",
        "1": "CET",
        "2": "EET/CEST",
        "5.5": "IST",
        "8": "CST (China)",
        "9": "JST",
      };

      const commonName = timezoneNames[offsetHours.toString()];
      return commonName
        ? `${commonName} (UTC${sign}${hours
            .toString()
            .padStart(2, "0")}:${minutes.toString().padStart(2, "0")})`
        : `UTC${sign}${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}`;
    }

    return timezoneStr;
  };

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!endDateTime) {
        return endDate;
      }

      try {
        // Parse the stored UTC time from backend
        const endTimeUTC = new Date(endDateTime);

        // Get current UTC time
        const currentUTC = new Date();

        // Simple UTC to UTC comparison
        const difference = endTimeUTC.getTime() - currentUTC.getTime();

        console.log(`=== SIMPLE UTC COUNTDOWN ===`);
        console.log(`End Time (UTC): ${endTimeUTC.toISOString()}`);
        console.log(`Current Time (UTC): ${currentUTC.toISOString()}`);
        console.log(
          `Time Difference: ${difference}ms (${Math.floor(
            difference / 60000
          )} minutes)`
        );
        console.log(`=== END COUNTDOWN ===`);

        if (difference <= 0) {
          return "Ended";
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );

        if (days > 0) {
          return `${days}d ${hours}h`;
        } else if (hours > 0) {
          return `${hours}h ${minutes}m`;
        } else {
          return `${minutes}m`;
        }
      } catch (error) {
        console.error("Error calculating time left:", error);
        return endDate;
      }
    };

    const formatLocalEndTime = () => {
      if (!endDateTime) return "";

      try {
        const endTimeUTC = new Date(endDateTime);

        // Format the end time in user's local timezone
        const localTime = endTimeUTC.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        });

        // If we have timezone info, show what timezone the hackathon is in
        if (timezone) {
          const hackathonTimezone = getTimezoneDisplayName(timezone);
          return `Ends: ${localTime} (Hackathon timezone: ${hackathonTimezone})`;
        }

        return `Ends: ${localTime}`;
      } catch (error) {
        return "";
      }
    };

    const updateTimer = () => {
      setTimeLeft(calculateTimeLeft());
      setLocalEndTime(formatLocalEndTime());
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [endDateTime, endDate, timezone]);

  const isEnded = timeLeft === "Ended";
  const isEndingSoon = timeLeft.includes("h") && !timeLeft.includes("d");

  return (
    <div
      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
        isEnded
          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
          : isEndingSoon
          ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
          : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
      }`}
      title={localEndTime}
    >
      <Timer className="w-3 h-3" />
      <span>
        {timeLeft}
        {!isEnded && " left"}
      </span>
    </div>
  );
};

export const HackathonDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [hackathonUrl, setHackathonUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  // Data State
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hackathonProjects, setHackathonProjects] = useState<
    Record<string, any>
  >({});

  // Refs
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Load hackathons on component mount
  useEffect(() => {
    if (user) {
      loadHackathons();
    }
  }, [user]);

  const loadHackathons = async () => {
    try {
      setLoading(true);
      const response = await hackathonApi.getHackathons({
        limit: 50,
        isActive: filterActive !== null ? filterActive : undefined,
      });
      console.log("Hackathons response:", response);
      const hackathonsList = response.docs || response || [];
      setHackathons(hackathonsList);

      // Load projects for each hackathon
      const projectsMap: Record<string, any> = {};
      await Promise.all(
        hackathonsList.map(async (hackathon: Hackathon) => {
          try {
            const project = await hackathonApi.getProject(hackathon._id);
            if (project) {
              projectsMap[hackathon._id] = project;
            }
          } catch (err) {
            // Project doesn't exist for this hackathon, which is fine
            console.log(`No project found for hackathon ${hackathon._id}`);
          }
        })
      );
      setHackathonProjects(projectsMap);
    } catch (err) {
      console.error("Failed to load hackathons:", err);
      setError(
        err instanceof ApiError ? err.message : "Failed to load hackathons"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddHackathon = async () => {
    if (!hackathonUrl.trim()) return;

    try {
      setIsScraping(true);
      setError(null);
      setSuccessMessage(null);

      console.log("Scraping hackathon URL:", hackathonUrl);
      const response = await hackathonApi.scrapeHackathon({
        url: hackathonUrl.trim(),
      });
      console.log("Scrape response:", response);

      setHackathons((prev) => [response, ...prev]);
      // Initialize project state for new hackathon (it won't have a project initially)
      setHackathonProjects((prev) => ({ ...prev, [response._id]: null }));
      setHackathonUrl("");
      setShowAddForm(false);
      setSuccessMessage("Hackathon scraped and added successfully!");

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to scrape hackathon:", err);
      setError(
        err instanceof ApiError ? err.message : "Failed to scrape hackathon"
      );
    } finally {
      setIsScraping(false);
    }
  };

  const handleDeleteHackathon = async (hackathonId: string) => {
    if (!confirm("Are you sure you want to delete this hackathon?")) return;

    try {
      await hackathonApi.deleteHackathon(hackathonId);
      setHackathons((prev) => prev.filter((h) => h._id !== hackathonId));
      setHackathonProjects((prev) => {
        const updated = { ...prev };
        delete updated[hackathonId];
        return updated;
      });
      setSuccessMessage("Hackathon deleted successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to delete hackathon:", err);
      setError(
        err instanceof ApiError ? err.message : "Failed to delete hackathon"
      );
    }
  };

  const handleCardClick = (hackathonId: string) => {
    navigate(`/hackathons/${hackathonId}`);
  };

  const handleBrainstorm = async (hackathon: Hackathon) => {
    setBrainstormLoading(hackathon._id);

    try {
      // Create a new chat session with hackathon context
      const sessionResponse = await chatSessionsApi.createSession({
        title: `Brainstorming: ${hackathon.title || "Untitled Hackathon"}`,
        description: `AI-powered brainstorming session for ${
          hackathon.title || "Untitled Hackathon"
        }`,
        tags: ["hackathon", "brainstorming"],
        hackathonId: hackathon._id,
      });

      // Create comprehensive hackathon context
      const hackathonContext = `
I'm preparing for the hackathon: ${hackathon.title || "Untitled Hackathon"}

Hackathon Details:
- Start Date: ${hackathon.startDate}
- End Date: ${hackathon.endDate}
- Time Remaining: ${
        hackathon.endDateTime ? "Check countdown timer" : hackathon.endDate
      }
- Link: ${hackathon.link}

${
  hackathon.prizes && hackathon.prizes.length > 0
    ? `Main Prizes:
${(hackathon.prizes || [])
  .filter((prize) => prize && prize.amount)
  .map((prize) => `- ${prize.amount}: ${prize.description || "Prize"}`)
  .join("\n")}`
    : ""
}

Sponsor Tracks:
${(hackathon.tracks || [])
  .filter((track) => track && track.name)
  .map((track) => {
    let trackInfo = `\n${track.name}${
      track.totalPrize ? ` (Total Prize Pool: ${track.totalPrize})` : ""
    }:`;
    if (track.subTracks && track.subTracks.length > 0) {
      track.subTracks.forEach((subTrack) => {
        trackInfo += `\n  - ${subTrack.name}`;
        if (subTrack.description) {
          trackInfo += `\n    Description: ${subTrack.description}`;
        }
        if (subTrack.prizes) {
          if (subTrack.prizes.first)
            trackInfo += `\n    1st Place: ${subTrack.prizes.first}`;
          if (subTrack.prizes.second)
            trackInfo += `\n    2nd Place: ${subTrack.prizes.second}`;
          if (subTrack.prizes.third)
            trackInfo += `\n    3rd Place: ${subTrack.prizes.third}`;
        }
      });
    }
    return trackInfo;
  })
  .join("\n")}

Rules:
${(hackathon.rules || []).map((rule) => `- ${rule}`).join("\n")}

Please help me brainstorm innovative project ideas that would be suitable for this hackathon. Consider the sponsor tracks, their specific requirements, prizes, and rules when suggesting ideas.

Also help me with:
1. Strategy planning and approach
2. Technical requirements and stack suggestions
3. Team formation advice
4. Timeline and milestone planning
5. Submission requirements understanding

I'm ready to discuss any questions about this hackathon, including technical implementation, team dynamics, and competitive strategy.
      `.trim();

      await messagesApi.sendMessage(sessionResponse._id, {
        content: hackathonContext,
        messageMode: "ideas",
      });

      // Navigate to chat with the new session
      navigate(`/chat?session=${sessionResponse._id}`);
    } catch (err) {
      console.error("Failed to start brainstorming session:", err);
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to start brainstorming session"
      );
    } finally {
      setBrainstormLoading(null);
    }
  };

  const getHackathonStatus = (hackathon: Hackathon) => {
    if (
      hackathon.startDate === "TBD" ||
      hackathon.startDate === "To be announced"
    ) {
      return {
        status: "upcoming",
        label: "Upcoming",
        color:
          "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
      };
    }

    const now = new Date();
    const startDate = new Date(hackathon.startDate);
    const endDate = new Date(hackathon.endDate);

    if (now < startDate) {
      return {
        status: "upcoming",
        label: "Upcoming",
        color:
          "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
      };
    } else if (now >= startDate && now <= endDate) {
      return {
        status: "active",
        label: "Active",
        color:
          "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
      };
    } else {
      return {
        status: "ended",
        label: "Done",
        color: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
      };
    }
  };

  const getTotalPrizePool = (hackathon: Hackathon) => {
    if (hackathon.totalPrizePool) {
      return hackathon.totalPrizePool;
    }

    if (hackathon.prizes.length > 0 && hackathon.prizes[0].amount) {
      return hackathon.prizes[0].amount;
    }

    return "N/A";
  };

  const filteredHackathons = hackathons.filter((hackathon) => {
    const matchesSearch =
      (hackathon.title &&
        hackathon.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (hackathon.tracks &&
        hackathon.tracks.some(
          (track) =>
            track &&
            track.name &&
            track.name.toLowerCase().includes(searchQuery.toLowerCase())
        ));

    if (filterActive === null) return matchesSearch;

    const status = getHackathonStatus(hackathon);
    const isActive = status.status === "active" || status.status === "upcoming";

    return matchesSearch && isActive === filterActive;
  });

  // Brainstorm loading state
  const [brainstormLoading, setBrainstormLoading] = useState<string | null>(
    null
  );

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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 text-gray-900 dark:text-white pt-16 animate-in fade-in duration-500">
      {/* Background effects */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 animate-in slide-in-from-top-4 duration-700">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <GradientText>Hackathon Dashboard</GradientText>
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Discover, track, and brainstorm for hackathons
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <RainbowButton onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Hackathon
            </RainbowButton>
          </div>
        </div>

        {/* Add Hackathon Form */}
        {showAddForm && (
          <Card className="mb-6 bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add New Hackathon</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddForm(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-3">
                <input
                  ref={urlInputRef}
                  type="url"
                  value={hackathonUrl}
                  onChange={(e) => setHackathonUrl(e.target.value)}
                  placeholder="Enter hackathon URL (e.g., from Devfolio, Devpost)"
                  className="flex-1 px-4 py-2 bg-gray-100/50 dark:bg-gray-700/50 rounded-lg border border-gray-200/50 dark:border-gray-600/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  onKeyPress={(e) => e.key === "Enter" && handleAddHackathon()}
                />
                <Button
                  onClick={handleAddHackathon}
                  disabled={!hackathonUrl.trim() || isScraping}
                  className="bg-gradient-to-r from-blue-500 to-teal-500 text-white"
                >
                  {isScraping ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    "Add"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-600 dark:text-green-400">
              {successMessage}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-300 mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search hackathons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-300 dark:border-zinc-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={filterActive === null ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterActive(null)}
            >
              All
            </Button>
            <Button
              variant={filterActive === true ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterActive(true)}
            >
              Active
            </Button>
            <Button
              variant={filterActive === false ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterActive(false)}
            >
              Done
            </Button>
          </div>
        </div>

        {/* Hackathons Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredHackathons.length === 0 ? (
          <Card className="bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No hackathons found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first hackathon"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Hackathon
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-700 delay-300">
            {filteredHackathons.map((hackathon, index) => {
              const status = getHackathonStatus(hackathon);
              const totalPrize = getTotalPrizePool(hackathon);

              return (
                <Card
                  key={hackathon._id}
                  className="group relative overflow-hidden bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:shadow-xl hover:shadow-blue-500/10 transition-all hover:scale-[1.02] transform-gpu cursor-pointer animate-in slide-in-from-bottom-2 duration-500"
                  style={{ animationDelay: `${index * 150}ms` }}
                  onClick={() => handleCardClick(hackathon._id)}
                >
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3 flex-1">
                        {hackathon.icon ? (
                          <img
                            src={hackathon.icon}
                            alt={hackathon.title}
                            className="w-12 h-12 rounded-lg object-cover mt-1"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div className="mt-1 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                            {hackathon.title || "Untitled Hackathon"}
                          </h3>
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={status.color}>
                              {status.label}
                            </Badge>
                            <CountdownTimer
                              endDateTime={hackathon.endDateTime}
                              endDate={hackathon.endDate}
                              timezone={hackathon.timezone}
                            />
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteHackathon(hackathon._id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Prize Pool */}
                    <div className="flex items-center space-x-2 mb-4">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Total Prize Pool:{" "}
                        <span className="text-green-600 dark:text-green-400 font-semibold">
                          {totalPrize}
                        </span>
                      </span>
                    </div>

                    {/* Top 2 Sponsor Tracks */}
                    {hackathon.tracks && hackathon.tracks.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Top Sponsor Tracks:
                        </h4>
                        <div className="space-y-2">
                          {hackathon.tracks
                            .filter((track) => track && track.name)
                            .slice(0, 2)
                            .map((track, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {track.name}
                                  </span>
                                  {track.totalPrize && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {track.totalPrize}
                                    </Badge>
                                  )}
                                </div>
                                {track.subTracks &&
                                  track.subTracks.length > 0 && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      {track.subTracks.length} track
                                      {track.subTracks.length > 1
                                        ? "s"
                                        : ""}{" "}
                                      available
                                    </p>
                                  )}
                              </div>
                            ))}
                          {hackathon.tracks.length > 2 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                              +{hackathon.tracks.length - 2} more sponsors
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(hackathon.link, "_blank");
                        }}
                        className="text-xs"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Site
                      </Button>
                      {hackathonProjects[hackathon._id] ? (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/hackathons/${hackathon._id}/project`);
                          }}
                          className="text-xs bg-gradient-to-r from-zinc-600 to-zinc-700 text-white hover:from-zinc-700 hover:to-zinc-800"
                        >
                          <FolderOpen className="w-3 h-3 mr-1" />
                          View Project
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBrainstorm(hackathon);
                          }}
                          disabled={brainstormLoading === hackathon._id}
                          className="text-xs bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600"
                        >
                          {brainstormLoading === hackathon._id ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <Lightbulb className="w-3 h-3 mr-1" />
                              Brainstorm
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Click indicator */}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
