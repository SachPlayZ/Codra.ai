import React from "react";

interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?:
    | "primary"
    | "secondary"
    | "animated-border"
    | "neon"
    | "hero-multicolor";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const GlowButton: React.FC<GlowButtonProps> = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
}) => {
  const baseClasses =
    "relative inline-flex items-center justify-center font-semibold transition-all duration-300 group overflow-hidden transform-gpu";

  const sizeClasses = {
    sm: "px-5 py-2.5 text-sm rounded-xl",
    md: "px-6 py-3 text-base rounded-xl",
    lg: "px-8 py-4 text-lg rounded-2xl",
  };

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98]",
    secondary:
      "bg-gray-800/80 backdrop-blur-sm text-white border-2 border-gray-600/50 hover:border-gray-500 hover:bg-gray-700/80 hover:scale-[1.02] shadow-lg hover:shadow-xl",
    neon: "bg-black/50 backdrop-blur-sm text-white border-2 border-cyan-500/50 hover:border-cyan-400 hover:shadow-cyan-400/25 hover:scale-[1.02] shadow-lg",
    "animated-border":
      "bg-black/80 backdrop-blur-sm text-white border-2 border-transparent hover:scale-[1.02] relative overflow-hidden shadow-lg",
    "hero-multicolor":
      "bg-white/90 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white border-2 border-transparent hover:scale-[1.02] relative overflow-hidden shadow-lg",
  };

  if (variant === "hero-multicolor") {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      >
        {/* Purple and yellow blend moving around perimeter */}
        <div className="absolute inset-0 rounded-2xl opacity-100">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 via-yellow-500 to-purple-500 animate-gradient-smooth bg-[length:200%_200%] blur-sm"></div>
        </div>

        {/* Secondary layer for smoother blending */}
        <div className="absolute inset-0 rounded-2xl">
          <div className="absolute inset-0 rounded-2xl bg-conic-gradient from-purple-400 via-yellow-400 via-purple-400 via-yellow-400 to-purple-400 animate-spin-smooth opacity-60 blur-md"></div>
        </div>

        {/* Inner background */}
        <div className="absolute inset-0.5 rounded-xl bg-white/90 dark:bg-black/90 backdrop-blur-sm"></div>

        {/* Subtle glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/10 via-yellow-400/10 to-purple-400/10 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Button content - text that inverts with theme */}
        <span className="relative z-10 flex items-center text-gray-900 dark:text-white">
          {children}
        </span>
      </button>
    );
  }

  if (variant === "animated-border") {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      >
        {/* Animated rainbow border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 via-teal-400 via-emerald-400 via-cyan-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-gradient-x bg-[length:200%_200%]"></div>
        <div className="absolute inset-0.5 rounded-xl bg-black/90 backdrop-blur-sm"></div>

        {/* Glowing effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 via-teal-400/20 to-emerald-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Button content */}
        <span className="relative z-10 flex items-center">{children}</span>
      </button>
    );
  }

  if (variant === "neon") {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      >
        {/* Neon glow effect */}
        <div className="absolute inset-0 rounded-xl bg-cyan-400/10 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute inset-0 rounded-xl shadow-[inset_0_0_20px_rgba(34,211,238,0.2)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Button content */}
        <span className="relative z-10 flex items-center group-hover:text-cyan-100 transition-colors duration-300">
          {children}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {/* Enhanced gradient glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 opacity-0 group-hover:opacity-80 transition-opacity duration-300 rounded-xl blur-lg"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-teal-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>

      {/* Shimmer effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-[-100%] group-hover:translate-x-[100%] transform duration-700"></div>

      {/* Button content */}
      <span className="relative z-10 flex items-center">{children}</span>
    </button>
  );
};

export default GlowButton;
