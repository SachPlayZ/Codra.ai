import React from "react";
import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  isPremium?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  gradient,
  isPremium = false,
}) => {
  return (
    <div className="group relative bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-300 dark:border-gray-800 rounded-xl p-6 hover:bg-white/80 dark:hover:bg-gray-900/70 transition-all duration-300 hover:scale-105 hover:border-gray-400 dark:hover:border-gray-700">
      {/* Ambient glow effect */}
      <div
        className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r ${gradient} blur-xl`}
      ></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${gradient}`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          {isPremium && (
            <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full">
              PREMIUM
            </span>
          )}
        </div>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Animated border */}
      <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-gradient-to-r group-hover:from-blue-500/20 group-hover:to-teal-500/20 transition-all duration-300"></div>
    </div>
  );
};

export default FeatureCard;
