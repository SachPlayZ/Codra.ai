import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { User, Mail, Calendar, Github } from "lucide-react";
import { GradientText } from "./ui/gradient-text";
import { UserAvatar } from "./UserAvatar";
import { env } from "../config/env";

export const Profile: React.FC = () => {
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
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <GradientText className="text-4xl font-bold">
              Profile Settings
            </GradientText>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Manage your {env.APP_NAME} account settings
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-300 dark:border-gray-800 shadow-xl">
          {/* User Info Header */}
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
            <UserAvatar user={user} size="xl" />
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.displayName || user.username}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                @{user.username}
              </p>
              {user.email && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {user.email}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Connected via GitHub OAuth
              </p>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Account Information
                </h3>

                <div className="flex items-center space-x-3 p-4 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Display Name
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.displayName || user.username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Username
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      @{user.username}
                    </p>
                  </div>
                </div>

                {user.email && (
                  <div className="flex items-center space-x-3 p-4 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Email
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 p-4 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl">
                  <Github className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Authentication
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      GitHub OAuth
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Stats
                </h3>

                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-500/10 to-teal-500/10 border border-blue-500/20 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Projects
                      </span>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        0
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Total projects created
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/20 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Hackathons
                      </span>
                      <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                        0
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Hackathons participated
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Team Size
                      </span>
                      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        1
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Average team members
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coming Soon Section */}
            <div className="mt-8 p-6 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
              <div className="text-center">
                <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  More Settings Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We're working on additional profile customization options
                  including avatar uploads, notification preferences, and
                  integration settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
