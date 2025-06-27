import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import Cookies from "js-cookie";
import { env } from "../config/env";

interface User {
  id: string;
  githubId?: string;
  username: string;
  displayName?: string;
  email?: string;
  avatar?: string;
  githubUrl?: string;
  lastLogin?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Using environment configuration
// const API_BASE_URL = env.API_BASE_URL; // Now imported from env config

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for token in URL params (from OAuth redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      console.log("🎯 Token found in URL, storing in localStorage");
      localStorage.setItem("authToken", token);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkAuth = async () => {
    try {
      // Get token from localStorage as backup
      const storedToken = localStorage.getItem("authToken");

      // Try with both cookies and Authorization header
      let response = await fetch(`${env.API_BASE_URL}/auth/me`, {
        credentials: "include",
        headers: {
          // Add Authorization header if token exists
          ...(storedToken && { Authorization: `Bearer ${storedToken}` }),
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
        // Clear invalid token
        localStorage.removeItem("authToken");
      }
    } catch (error) {
      console.error("❌ Auth check failed:", error);
      setUser(null);
      localStorage.removeItem("authToken");
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    window.location.href = `${env.API_BASE_URL}/auth/github`;
  };

  const logout = async () => {
    try {
      await fetch(`${env.API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      Cookies.remove("token");
      localStorage.removeItem("authToken"); // Clear localStorage token
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
