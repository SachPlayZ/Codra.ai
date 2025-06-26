import React, { useState } from "react";
import {
  Lightbulb,
  Clock,
  Sparkles,
  Star,
  Code,
  Users,
  ExternalLink,
  ArrowRight,
  Zap,
} from "lucide-react";
import { IdeaDetailDialog } from "./IdeaDetailDialog";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

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

interface IdeaCardsProps {
  ideas: IdeaData[];
  onCopyIdea?: (idea: IdeaData) => void;
  onStarIdea?: (idea: IdeaData) => void;
}

const getComplexityColor = (complexity: string) => {
  switch (complexity.toLowerCase()) {
    case "beginner":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "intermediate":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "advanced":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
  }
};

const getTimelineColor = (timeline: string) => {
  switch (timeline) {
    case "12 hrs":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
    case "24 hrs":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "36 hrs":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800";
    case "48 hrs":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700";
  }
};

export const IdeaCards: React.FC<IdeaCardsProps> = ({
  ideas,
  onCopyIdea,
  onStarIdea,
}) => {
  const [selectedIdea, setSelectedIdea] = useState<IdeaData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openIdeaDetails = (idea: IdeaData) => {
    setSelectedIdea(idea);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedIdea(null);
  };

  // Truncate text function
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {ideas.length} Hackathon Project{" "}
            {ideas.length === 1 ? "Idea" : "Ideas"} Generated
          </span>
        </div>

        {ideas.map((idea, index) => (
          <Card
            key={index}
            className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:scale-[1.02] cursor-pointer hover:border-blue-300/50 dark:hover:border-blue-600/50"
            onClick={() => openIdeaDetails(idea)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Lightbulb className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
                      {idea["Idea Title"]}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="secondary"
                      className={`font-medium ${getComplexityColor(
                        idea["Implementation Complexity"]
                      )}`}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      {idea["Implementation Complexity"]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`font-medium border ${getTimelineColor(
                        idea["Estimated Timeline"]
                      )}`}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {idea["Estimated Timeline"]}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStarIdea?.(idea);
                    }}
                    className="h-8 w-8 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-gray-400 hover:text-yellow-500"
                    title="Add to favorites"
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      openIdeaDetails(idea);
                    }}
                    className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500"
                    title="View details"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Brief Description */}
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
                {truncateText(idea["Idea Description"], 140)}
              </p>

              <Separator className="bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Tech Stack Preview */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Code className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Tech Stack
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {idea["Tech Stack"].slice(0, 3).map((tech, techIndex) => (
                      <Badge
                        key={techIndex}
                        variant="secondary"
                        className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                      >
                        {tech}
                      </Badge>
                    ))}
                    {idea["Tech Stack"].length > 3 && (
                      <Badge
                        variant="outline"
                        className="text-xs text-gray-500 dark:text-gray-400"
                      >
                        +{idea["Tech Stack"].length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Target Audience Preview */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Users className="w-3 h-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Audience
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {idea["Target Audience"].slice(0, 2).join(", ")}
                    {idea["Target Audience"].length > 2 &&
                      ` +${idea["Target Audience"].length - 2} more`}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Project Idea #{index + 1}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openIdeaDetails(idea);
                    }}
                    className="h-7 px-3 text-xs bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50 hover:border-blue-300 dark:hover:border-blue-600 transition-all group-hover:translate-x-1"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Dialog */}
      <IdeaDetailDialog
        idea={selectedIdea}
        isOpen={isDialogOpen}
        onClose={closeDialog}
        onCopyIdea={onCopyIdea}
        onStarIdea={onStarIdea}
      />
    </>
  );
};
