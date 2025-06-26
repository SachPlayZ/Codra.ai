import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import {
  Plus,
  FolderOpen,
  Users,
  Calendar,
  Github,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import { RainbowButton } from "./ui/rainbow-button";

export const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 text-gray-900 dark:text-white">
      {/* Background effects */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.username}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Ready to build something amazing? Let's get started.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <RainbowButton className="h-16 text-lg">
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </RainbowButton>

          <button className="h-16 bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-300 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 transition-all duration-300 hover:scale-105 flex items-center justify-center text-lg font-semibold">
            <FolderOpen className="w-5 h-5 mr-2" />
            Browse Projects
          </button>

          <button className="h-16 bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-300 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 transition-all duration-300 hover:scale-105 flex items-center justify-center text-lg font-semibold">
            <Users className="w-5 h-5 mr-2" />
            Find Team
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Projects */}
          <div className="lg:col-span-2">
            <div className="bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-gray-300 dark:border-gray-800">
              <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
              <div className="space-y-4">
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>
                    No projects yet. Create your first project to get started!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Hackathons */}
            <div className="bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-gray-300 dark:border-gray-800">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Upcoming Hackathons
              </h3>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hackathons tracked yet</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-gray-300 dark:border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-3">
                <a
                  href="#"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Github className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" />
                  <span>GitHub Integration</span>
                </a>
                <a
                  href="#"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <MessageSquare className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" />
                  <span>AI Chat</span>
                </a>
                <a
                  href="#"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <BarChart3 className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" />
                  <span>Analytics</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
