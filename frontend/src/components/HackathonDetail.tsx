import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import {
  Trophy,
  Calendar,
  ExternalLink,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Loader2,
  AlertCircle,
  DollarSign,
  Target,
  Users,
  FolderOpen,
  Clock,
} from "lucide-react";
import { GradientText } from "./ui/gradient-text";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader } from "./ui/card";
import {
  hackathonApi,
  chatSessionsApi,
  messagesApi,
  ApiError,
} from "../services/api";
import type { Hackathon, HackathonProject } from "../services/api";

interface DetailedCountdownTimerProps {
  endDateTime: string | undefined;
  endDate: string;
  timezone?: string;
}

const DetailedCountdownTimer: React.FC<DetailedCountdownTimerProps> = ({
  endDateTime,
  endDate,
  timezone,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isEnded: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!endDateTime) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true };
      }

      try {
        const endTimeUTC = new Date(endDateTime);
        const currentUTC = new Date();
        const difference = endTimeUTC.getTime() - currentUTC.getTime();

        if (difference <= 0) {
          return { days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true };
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds, isEnded: false };
      } catch (error) {
        console.error("Error calculating time left:", error);
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true };
      }
    };

    const updateTimer = () => {
      setTimeLeft(calculateTimeLeft());
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000); // Update every second

    return () => clearInterval(interval);
  }, [endDateTime, endDate, timezone]);

  if (timeLeft.isEnded) {
    return (
      <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800">
        <div className="text-center">
          <div className="text-sm font-medium">Hackathon Ended</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 text-sm font-bold">
          <div className="text-center">
            <div className="text-lg text-blue-600 dark:text-blue-400">
              {timeLeft.days}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {timeLeft.days === 1 ? "day" : "days"}
            </div>
          </div>
          <div className="text-gray-400">:</div>
          <div className="text-center">
            <div className="text-lg text-blue-600 dark:text-blue-400">
              {timeLeft.hours.toString().padStart(2, "0")}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">hrs</div>
          </div>
          <div className="text-gray-400">:</div>
          <div className="text-center">
            <div className="text-lg text-blue-600 dark:text-blue-400">
              {timeLeft.minutes.toString().padStart(2, "0")}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">min</div>
          </div>
          <div className="text-gray-400">:</div>
          <div className="text-center">
            <div className="text-lg text-blue-600 dark:text-blue-400">
              {timeLeft.seconds.toString().padStart(2, "0")}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">sec</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HackathonDetail: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brainstormLoading, setBrainstormLoading] = useState(false);
  const [expandedTracks, setExpandedTracks] = useState<Set<number>>(new Set());
  const [project, setProject] = useState<HackathonProject | null>(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [prizesExpanded, setPrizesExpanded] = useState(false);

  useEffect(() => {
    if (user && id) {
      loadHackathon();
      loadProject();
    }
  }, [user, id]);

  const loadHackathon = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await hackathonApi.getHackathon(id);
      setHackathon(response);
    } catch (err) {
      console.error("Failed to load hackathon:", err);
      setError(
        err instanceof ApiError ? err.message : "Failed to load hackathon"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadProject = async () => {
    if (!id) return;

    try {
      setProjectLoading(true);
      const response = await hackathonApi.getProject(id);
      setProject(response);
    } catch (err) {
      // Project doesn't exist yet, which is fine
      console.log("No project found for this hackathon:", err);
      setProject(null);
    } finally {
      setProjectLoading(false);
    }
  };

  const handleBrainstorm = async () => {
    if (!hackathon) return;

    setBrainstormLoading(true);

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
      setBrainstormLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (dateString === "TBD" || dateString === "To be announced") {
      return dateString;
    }
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
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

  const toggleTrackExpansion = (trackIndex: number) => {
    setExpandedTracks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(trackIndex)) {
        newSet.delete(trackIndex);
      } else {
        newSet.add(trackIndex);
      }
      return newSet;
    });
  };

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
      return commonName ? `${commonName} (${timezoneStr})` : timezoneStr;
    }

    return timezoneStr;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !hackathon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Hackathon not found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {error || "The hackathon you're looking for doesn't exist."}
                </p>
                <Button onClick={() => navigate("/hackathons")}>
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

  const status = getHackathonStatus(hackathon);
  const totalPrize = getTotalPrizePool(hackathon);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 pt-16 animate-in fade-in duration-500">
      {/* Background effects */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8 animate-in slide-in-from-top-4 duration-700">
          <Button
            variant="ghost"
            onClick={() => navigate("/hackathons")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start space-x-4 flex-1">
              {hackathon.icon ? (
                <img
                  src={hackathon.icon}
                  alt={hackathon.title}
                  className="w-16 h-16 rounded-xl object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold mb-3">
                  <GradientText>{hackathon.title}</GradientText>
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={status.color}>{status.label}</Badge>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDate(hackathon.startDate)} -{" "}
                      {formatDate(hackathon.endDate)}
                      {hackathon.timezone && (
                        <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                          {getTimezoneDisplayName(hackathon.timezone)}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => window.open(hackathon.link, "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Hackathon
              </Button>
              {!project && (
                <Button
                  onClick={handleBrainstorm}
                  disabled={brainstormLoading}
                  className="bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600"
                >
                  {brainstormLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Start Brainstorming
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-700 delay-200">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8 animate-in slide-in-from-left-2 duration-600 delay-300">
            {/* Prize Information and Timer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prize Pool */}
              <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <h2 className="text-xl font-semibold flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                    Prize Pool
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {totalPrize}
                  </div>
                </CardContent>
              </Card>

              {/* Countdown Timer */}
              <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <h2 className="text-xl font-semibold flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-500" />
                    Time Remaining
                  </h2>
                </CardHeader>
                <CardContent>
                  <DetailedCountdownTimer
                    endDateTime={hackathon.endDateTime}
                    endDate={hackathon.endDate}
                    timezone={hackathon.timezone}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Main Prizes */}
            {hackathon.prizes && hackathon.prizes.length > 0 && (
              <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <h2 className="text-xl font-semibold flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                    Main Prizes
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(prizesExpanded
                      ? hackathon.prizes
                      : hackathon.prizes.slice(0, 3)
                    ).map((prize, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 animate-in slide-in-from-left-1 duration-400"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div>
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            {prize.amount}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {prize.description || "Prize"}
                          </div>
                        </div>
                      </div>
                    ))}

                    {hackathon.prizes.length > 3 && (
                      <button
                        onClick={() => setPrizesExpanded(!prizesExpanded)}
                        className="w-full p-3 text-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                      >
                        {prizesExpanded ? (
                          <span className="text-sm">Show less</span>
                        ) : (
                          <span className="text-2xl font-bold tracking-wider">
                            • • •
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sponsor Tracks */}
            {hackathon.tracks && hackathon.tracks.length > 0 && (
              <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <h2 className="text-xl font-semibold flex items-center">
                    <Target className="w-5 h-5 mr-2 text-blue-500" />
                    Sponsor Tracks
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {hackathon.tracks.map((track, index) => {
                      const isExpanded = expandedTracks.has(index);
                      return (
                        <div
                          key={index}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => toggleTrackExpansion(index)}
                            className="w-full p-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-between text-left"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                                <Trophy className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {track.name}
                                </h3>
                                {track.subTracks &&
                                  track.subTracks.length > 0 && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {track.subTracks.length} track
                                      {track.subTracks.length > 1
                                        ? "s"
                                        : ""}{" "}
                                      available
                                    </p>
                                  )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {track.totalPrize && (
                                <Badge variant="secondary" className="text-sm">
                                  {track.totalPrize}
                                </Badge>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          </button>

                          {isExpanded &&
                            track.subTracks &&
                            track.subTracks.length > 0 && (
                              <div className="p-4 space-y-4 bg-zinc-50 dark:bg-zinc-800">
                                {track.subTracks.map((subTrack, subIndex) => (
                                  <div
                                    key={subIndex}
                                    className="bg-zinc-100 dark:bg-zinc-700 rounded-lg p-4 border border-zinc-200 dark:border-zinc-600"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <h4 className="font-medium text-gray-900 dark:text-white">
                                        {subTrack.name}
                                      </h4>
                                      {subTrack.prizes &&
                                        subTrack.prizes.first && (
                                          <Badge
                                            variant="secondary"
                                            className="text-xs ml-2"
                                          >
                                            {subTrack.prizes.first}
                                          </Badge>
                                        )}
                                    </div>
                                    {subTrack.description && (
                                      <div>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                          {subTrack.description}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rules */}
            {hackathon.rules && hackathon.rules.length > 0 && (
              <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <h2 className="text-xl font-semibold flex items-center">
                    <Users className="w-5 h-5 mr-2 text-purple-500" />
                    Rules & Guidelines
                  </h2>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {hackathon.rules.map((rule, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                            {index + 1}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                          {rule}
                        </p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 animate-in slide-in-from-right-2 duration-600 delay-400">
            {/* Quick Stats */}
            <Card className="bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <h3 className="text-lg font-semibold">Quick Stats</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Status
                  </span>
                  <Badge className={status.color}>{status.label}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Prize Pool
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {totalPrize}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Sponsor Tracks
                  </span>
                  <span className="font-semibold">
                    {hackathon.tracks?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Rules
                  </span>
                  <span className="font-semibold">
                    {hackathon.rules?.length || 0}
                  </span>
                </div>
                {hackathon.timezone && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Timezone
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {getTimezoneDisplayName(hackathon.timezone)}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Cards */}
            {projectLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : project ? (
              <Card className="bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1 truncate">
                        {project.title}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mb-4">
                    <Badge
                      variant="secondary"
                      className="bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                    >
                      {project.progress || "planning"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs border-zinc-300 dark:border-zinc-600"
                    >
                      {project.implementationComplexity}
                    </Badge>
                  </div>

                  <Button
                    onClick={() =>
                      navigate(`/hackathons/${hackathon._id}/project`)
                    }
                    className="w-full bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    View Project
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6 text-center">
                  <Lightbulb className="w-12 h-12 mx-auto mb-3 text-blue-500" />
                  <h3 className="font-semibold mb-2">Ready to Brainstorm?</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Get AI-powered project ideas and strategy guidance tailored
                    to this hackathon.
                  </p>
                  <Button
                    onClick={handleBrainstorm}
                    disabled={brainstormLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600"
                  >
                    {brainstormLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Start Brainstorming
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
