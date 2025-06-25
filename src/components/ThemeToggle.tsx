import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.setProperty("--bg-primary", "#0A0A0A");
      document.documentElement.style.setProperty("--text-primary", "#ffffff");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.setProperty("--bg-primary", "#ffffff");
      document.documentElement.style.setProperty("--text-primary", "#0A0A0A");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isDark ? "bg-gray-700" : "bg-gray-300"
      }`}
      aria-label="Toggle theme"
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${
          isDark ? "translate-x-7" : "translate-x-1"
        }`}
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-gray-700 m-1" />
        ) : (
          <Sun className="h-4 w-4 text-yellow-500 m-1" />
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;
