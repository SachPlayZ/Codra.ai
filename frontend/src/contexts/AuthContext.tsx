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

  const checkAuth = async () => {
    try {
      console.log("🔍 Checking authentication...");
      const response = await fetch(`${env.API_BASE_URL}/auth/me`, {
        credentials: "include",
      });

      console.log("📡 Auth response status:", response.status);
      console.log(
        "📡 Auth response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (response.ok) {
        const userData = await response.json();
        console.log("✅ User authenticated:", userData);
        setUser(userData);
      } else {
        console.log("❌ Auth failed, status:", response.status);
        const errorData = await response.text();
        console.log("❌ Auth error:", errorData);
        setUser(null);
      }
    } catch (error) {
      console.error("❌ Auth check failed:", error);
      setUser(null);
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
