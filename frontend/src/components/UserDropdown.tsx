import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Settings,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { UserAvatar } from "./UserAvatar";

interface UserDropdownProps {
  className?: string;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        {/* Avatar */}
        <UserAvatar user={user} size="md" />

        {/* Username */}
        <span className="hidden md:block max-w-24 truncate">
          {user.username}
        </span>

        {/* Dropdown Arrow */}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-black/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-800/50 shadow-xl z-50 animate-in slide-in-from-top-5 duration-200">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-800/50">
            <div className="flex items-center space-x-3">
              <UserAvatar user={user} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.displayName || user.username}
                </p>
                {user.email && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              to="/profile"
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-900/50 hover:text-gray-900 dark:hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4 mr-3" />
              Profile
            </Link>

            <Link
              to="/dashboard"
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-900/50 hover:text-gray-900 dark:hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <LayoutDashboard className="w-4 h-4 mr-3" />
              Dashboard
            </Link>

            <Link
              to="/chat"
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-900/50 hover:text-gray-900 dark:hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <MessageSquare className="w-4 h-4 mr-3" />
              AI Chat
            </Link>

            <hr className="my-2 border-gray-200/50 dark:border-gray-800/50" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
