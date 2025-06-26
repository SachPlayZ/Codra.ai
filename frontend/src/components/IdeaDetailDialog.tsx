import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Lightbulb,
  Users,
  Clock,
  TrendingUp,
  Heart,
  Code,
  Target,
  X,
  Copy,
  Star,
  CheckCircle,
  ExternalLink,
  Zap,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Separator } from "./ui/separator";
import { favoriteIdeasApi, ApiError } from "../services/api";

interface IdeaData {
  "Idea Title": string;
  "Idea Description": string;
  USP: string;
  "Tech Stack": string[];
  "Target Audience": string[];
  "Implementation Complexity": "Beginner" | "Intermediate" | "Advanced";
  "Estimated Timeline": "12 hrs" | "24 hrs" | "36 hrs" | "48 hrs";
  "Market Potential": string;
  "Social Impact": string[];
}

interface IdeaDetailDialogProps {
  idea: IdeaData | null;
  isOpen: boolean;
  onClose: () => void;
  onCopyIdea?: (idea: IdeaData) => void;
  onStarIdea?: (idea: IdeaData) => void;
}

const getComplexityVariant = (
  complexity: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (complexity.toLowerCase()) {
    case "beginner":
      return "default";
    case "intermediate":
      return "secondary";
    case "advanced":
      return "destructive";
    default:
      return "outline";
  }
};

const getTimelineVariant = (
  timeline: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (timeline) {
    case "12 hrs":
      return "default";
    case "24 hrs":
      return "secondary";
    case "36 hrs":
      return "secondary";
    case "48 hrs":
      return "destructive";
    default:
      return "outline";
  }
};

export const IdeaDetailDialog: React.FC<IdeaDetailDialogProps> = ({
  idea,
  isOpen,
  onClose,
  onCopyIdea,
  onStarIdea,
}) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Handle ESC key press
  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      return () => {
        document.removeEventListener("keydown", handleEscKey);
      };
    }
  }, [isOpen, onClose]);

  // Check if idea is already favorited when dialog opens
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!idea || !isOpen) return;

      try {
        const response = await favoriteIdeasApi.checkFavoriteStatus(
          idea["Idea Title"],
          idea["Idea Description"]
        );
        setIsFavorited(response.isFavorited);
        setFavoriteId(response.favoriteId);
      } catch (error) {
        console.error("Failed to check favorite status:", error);
      }
    };

    checkFavoriteStatus();
  }, [idea, isOpen]);

  if (!isOpen || !idea) return null;

  const handleCopy = async () => {
    const ideaText = `**${idea["Idea Title"]}**\n\n${
      idea["Idea Description"]
    }\n\n**USP:** ${idea["USP"]}\n\n**Tech Stack:** ${idea["Tech Stack"].join(
      ", "
    )}\n\n**Target Audience:**\n${idea["Target Audience"]
      .map((item) => `• ${item}`)
      .join("\n")}\n\n**Complexity:** ${
      idea["Implementation Complexity"]
    }\n**Timeline:** ${idea["Estimated Timeline"]}\n\n**Market Potential:** ${
      idea["Market Potential"]
    }\n\n**Social Impact:**\n${idea["Social Impact"]
      .map((item) => `• ${item}`)
      .join("\n")}`;

    try {
      await navigator.clipboard.writeText(ideaText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      onCopyIdea?.(idea);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleFavorite = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (isFavorited && favoriteId) {
        // Remove from favorites
        await favoriteIdeasApi.deleteFavorite(favoriteId);
        setIsFavorited(false);
        setFavoriteId(null);
      } else {
        // Add to favorites
        const favoriteData = {
          ideaTitle: idea["Idea Title"],
          ideaDescription: idea["Idea Description"],
          usp: idea["USP"],
          techStack: idea["Tech Stack"],
          targetAudience: idea["Target Audience"],
          implementationComplexity: idea["Implementation Complexity"],
          estimatedTimeline: idea["Estimated Timeline"],
          marketPotential: idea["Market Potential"],
          socialImpact: idea["Social Impact"],
        };

        const response = await favoriteIdeasApi.addFavorite(favoriteData);
        setIsFavorited(true);
        setFavoriteId(response._id);
      }
      onStarIdea?.(idea);
    } catch (error) {
      console.error("Failed to update favorite:", error);
      if (
        error instanceof ApiError &&
        error.message.includes("already in your favorites")
      ) {
        setIsFavorited(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-backdropIn"
        onClick={onClose}
      />

      {/* Dialog */}
      <Card className="relative w-full max-w-4xl max-h-[95vh] overflow-hidden animate-dialogIn">
        {/* Glassmorphic Header Overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl border-b border-white/10 dark:border-gray-800/20 rounded-t-2xl">
          <div className="p-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold leading-tight">
                    {idea["Idea Title"]}
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge
                    variant={getComplexityVariant(
                      idea["Implementation Complexity"]
                    )}
                    className="font-medium backdrop-blur-sm"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    {idea["Implementation Complexity"]}
                  </Badge>
                  <Badge
                    variant={getTimelineVariant(idea["Estimated Timeline"])}
                    className="font-medium backdrop-blur-sm"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {idea["Estimated Timeline"]}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFavorite}
                  disabled={isLoading}
                  className={`backdrop-blur-sm transition-colors ${
                    isFavorited
                      ? "text-yellow-600 bg-yellow-50/80 hover:bg-yellow-100/80"
                      : "hover:bg-yellow-50/80 hover:text-yellow-600"
                  }`}
                  title={
                    isFavorited ? "Remove from favorites" : "Add to favorites"
                  }
                >
                  <Star
                    className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className={`backdrop-blur-sm transition-colors ${
                    copySuccess
                      ? "text-green-600 bg-green-50/80"
                      : "hover:bg-blue-50/80 hover:text-blue-600"
                  }`}
                  title={copySuccess ? "Copied!" : "Copy to clipboard"}
                >
                  {copySuccess ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="hover:bg-red-50/80 hover:text-red-600 backdrop-blur-sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className="space-y-6 pt-32 pb-28 max-h-[95vh] overflow-y-auto scrollbar-hide">
          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Project Overview</span>
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {idea["Idea Description"]}
            </p>
          </div>

          <Separator />

          {/* USP */}
          <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/30 dark:to-blue-950/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2 text-purple-700 dark:text-purple-300">
                <Target className="w-5 h-5" />
                <span>Unique Selling Proposition</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-700 dark:text-purple-200 font-medium">
                {idea["USP"]}
              </p>
            </CardContent>
          </Card>

          {/* Tech Stack & Audience Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Tech Stack */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Code className="w-5 h-5 text-blue-500" />
                  <span>Technology Stack</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {idea["Tech Stack"].map((tech, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Target Audience */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Users className="w-5 h-5 text-green-500" />
                  <span>Target Audience</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {idea["Target Audience"].map((audience, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{audience}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Market Potential */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <span>Market Potential</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {idea["Market Potential"]}
              </p>
            </CardContent>
          </Card>

          {/* Social Impact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Heart className="w-5 h-5 text-pink-500" />
                <span>Social Impact</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {idea["Social Impact"].map((impact, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-pink-50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/30"
                  >
                    <Heart className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-pink-700 dark:text-pink-300">
                      {impact}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>

        {/* Glassmorphic Footer Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl border-t border-white/10 dark:border-gray-800/20 rounded-b-2xl">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-sm text-muted-foreground">
                Press{" "}
                <Badge
                  variant="outline"
                  className="px-2 py-0.5 text-xs backdrop-blur-sm"
                >
                  ESC
                </Badge>{" "}
                or click outside to close
              </div>
              <div className="flex space-x-3">
                <Button className="relative group bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 before:absolute before:inset-0 before:bg-gradient-to-r before:from-violet-400 before:via-purple-400 before:to-indigo-400 before:rounded-xl before:blur-xl before:opacity-0 group-hover:before:opacity-30 before:transition-opacity before:duration-300 overflow-hidden">
                  <div className="relative flex items-center z-10">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Start Planning
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out"></div>
                </Button>
                <Button
                  variant="outline"
                  className="border-purple-200 hover:bg-purple-50/80 hover:text-purple-700 backdrop-blur-sm hover:border-purple-300 transition-all duration-200"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Find Team
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>,
    document.body
  );
};
