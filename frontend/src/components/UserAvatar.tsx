import React, { useState } from "react";

interface UserAvatarProps {
  user: {
    username: string;
    avatar?: string;
    displayName?: string;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
  xl: "w-24 h-24 text-2xl",
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = "md",
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);

  // Generate avatar initials
  const getInitials = (username: string, displayName?: string) => {
    const name = displayName || username;
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // If no avatar or image failed to load, show initials
  if (!user.avatar || imageError) {
    return (
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg ${className}`}
      >
        {getInitials(user.username, user.displayName)}
      </div>
    );
  }

  // Show GitHub profile picture
  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden shadow-lg ${className}`}
    >
      <img
        src={user.avatar}
        alt={`${user.displayName || user.username}'s avatar`}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
        onLoad={() => setImageError(false)}
      />
    </div>
  );
};
