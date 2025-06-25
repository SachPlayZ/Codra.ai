import React, { useState, useEffect } from "react";
import { Menu, X, Sparkles, Code, Zap } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { RainbowButton } from "./ui/rainbow-button";

const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 50;
      setIsScrolled(scrolled);

      // Update active section based on scroll position
      const sections = ["home", "features", "platform"];
      const current = sections.find((section) => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navItems = [
    { name: "Home", href: "#home", id: "home", icon: Sparkles },
    { name: "Features", href: "#features", id: "features", icon: Code },
    { name: "Platform", href: "#platform", id: "platform", icon: Zap },
  ];

  return (
    <>
      {/* Animated background blur effect */}
      <div className="fixed top-0 left-0 right-0 h-20 transition-all duration-700 pointer-events-none z-40" />

      {/* Main Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-white/10 dark:bg-black/10 backdrop-blur-xl border-b border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center group cursor-pointer">
              <div className="relative">
                <div className="relative flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <Code className="w-4 h-4 text-white dark:text-gray-900 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    Codra.AI
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <div
                className={`flex items-center rounded-2xl p-1 transition-all duration-500 ${
                  isScrolled
                    ? "bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/10"
                    : "bg-transparent"
                }`}
              >
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeSection === item.id;

                  if (isActive) {
                    return (
                      <RainbowButton
                        key={item.name}
                        className="flex items-center space-x-2 px-4 py-2 h-auto text-sm font-medium"
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{item.name}</span>
                      </RainbowButton>
                    );
                  }

                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className="relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 group text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-black/20"
                    >
                      <IconComponent className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                      <span className="relative z-10">{item.name}</span>
                    </a>
                  );
                })}
              </div>

              {/* Theme Toggle */}
              <div className="ml-4">
                <ThemeToggle />
              </div>
            </div>

            {/* Mobile menu controls */}
            <div className="md:hidden flex items-center space-x-3">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`relative p-2 rounded-xl transition-all duration-300 group overflow-hidden ${
                  isScrolled
                    ? "bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/10"
                    : "bg-transparent"
                } text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-black/20`}
              >
                <div className="relative z-10">
                  {isMobileMenuOpen ? (
                    <X
                      size={20}
                      className="transform transition-transform duration-300 rotate-90"
                    />
                  ) : (
                    <Menu
                      size={20}
                      className="transform transition-transform duration-300 group-hover:scale-110"
                    />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden overflow-hidden">
              <div className="px-2 pt-4 pb-6 space-y-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl mt-4 border border-gray-200/50 dark:border-gray-700/50 shadow-xl shadow-purple-500/10 animate-in slide-in-from-top-5 duration-300">
                {/* Mobile nav header */}
                <div className="px-4 py-2 border-b border-gray-200/50 dark:border-gray-700/50 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
                      <Code className="w-3 h-3 text-white dark:text-gray-900" />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Navigation
                    </span>
                  </div>
                </div>

                {/* Mobile nav items */}
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeSection === item.id;

                  if (isActive) {
                    return (
                      <RainbowButton
                        key={item.name}
                        className="w-full flex items-center space-x-3 px-4 py-3 h-auto text-base font-medium"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="flex-1">{item.name}</span>
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </RainbowButton>
                    );
                  }

                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className="group flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 bg-gray-200/50 dark:bg-gray-700/50 group-hover:bg-gray-300/50 dark:group-hover:bg-gray-600/50">
                        <IconComponent className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <span className="flex-1">{item.name}</span>
                    </a>
                  );
                })}

                {/* Mobile menu footer */}
                <div className="pt-4 mt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                    Built for winners 🏆
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navigation;
