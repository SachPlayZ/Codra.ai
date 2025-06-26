import React from "react";
import { Github, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { GradientText } from "./ui/gradient-text";
import { RainbowButton } from "./ui/rainbow-button";
import { env } from "../config/env";

export const Login: React.FC = () => {
  const { user, loading, login } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 text-gray-900 dark:text-white flex items-center justify-center pt-16">
      {/* Background effects */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-300 dark:border-gray-800 shadow-2xl">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome to{" "}
              <GradientText className="text-3xl font-bold">
                {env.APP_NAME}
              </GradientText>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Sign in to start building winning hackathon projects
            </p>
          </div>

          {/* Features list */}
          <div className="mb-8 space-y-3">
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <ArrowRight className="w-4 h-4 mr-3 text-blue-500" />
              AI-powered project planning
            </div>
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <ArrowRight className="w-4 h-4 mr-3 text-teal-500" />
              Smart hackathon dashboard
            </div>
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <ArrowRight className="w-4 h-4 mr-3 text-emerald-500" />
              Team collaboration tools
            </div>
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <ArrowRight className="w-4 h-4 mr-3 text-green-500" />
              GitHub integration
            </div>
          </div>

          {/* Login Button */}
          <div className="space-y-4">
            <RainbowButton
              onClick={login}
              className="w-full py-4 text-lg font-semibold"
            >
              <Github className="w-5 h-5 mr-3" />
              Continue with GitHub
            </RainbowButton>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              By signing in, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </div>
        </div>

        {/* Additional info */}
        <div className="text-center mt-6">
          <p className="text-gray-600 dark:text-gray-400">
            New to hackathons?{" "}
            <span className="text-blue-500 hover:text-blue-600 cursor-pointer">
              Learn how Codra.AI can help you win
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
