import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import session from "express-session";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import connectDB from "./config/database.js";
import User from "./models/User.js";
import chatRoutes from "./routes/chatRoutes.js";
import favoriteIdeaRoutes from "./routes/favoriteIdeaRoutes.js";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL:
        process.env.GITHUB_CALLBACK_URL ||
        (process.env.NODE_ENV === "production"
          ? "https://codra-ai.onrender.com/auth/github/callback"
          : "http://localhost:5000/auth/github/callback"),
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ githubId: profile.id });

        if (user) {
          // Update existing user
          user.username = profile.username;
          user.displayName = profile.displayName;
          user.email = profile.emails?.[0]?.value || user.email;
          user.avatar = profile.photos?.[0]?.value || user.avatar;
          user.githubUrl = profile.profileUrl;
          user.accessToken = accessToken;
          user.lastLogin = new Date();

          await user.save();
          console.log(`🔄 Updated existing user: ${user.username}`);
        } else {
          // Create new user
          user = new User({
            githubId: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            email: profile.emails?.[0]?.value,
            avatar: profile.photos?.[0]?.value,
            githubUrl: profile.profileUrl,
            accessToken,
          });

          await user.save();
          console.log(`✨ Created new user: ${user.username}`);
        }

        // Return user object for session
        return done(null, {
          id: user._id,
          githubId: user.githubId,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          avatar: user.avatar,
          githubUrl: user.githubUrl,
        });
      } catch (error) {
        console.error("❌ GitHub OAuth Error:", error);
        return done(error, null);
      }
    }
  )
);

// Serialize/deserialize user for session
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Codra AI Backend API" });
});

// Auth routes
app.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

app.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
  }),
  (req, res) => {
    // Create JWT token
    const token = jwt.sign(
      {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
      },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to frontend dashboard
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

app.post("/auth/logout", (req, res) => {
  res.clearCookie("token");
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

app.get("/auth/me", requireAuth, async (req, res) => {
  try {
    // Get fresh user data from database
    const user = await User.findById(req.user.id).select("-accessToken");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      githubId: user.githubId,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      githubUrl: user.githubUrl,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Protected routes
app.get("/api/user", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-accessToken");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Protected route accessed",
      user: {
        id: user._id,
        githubId: user.githubId,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar,
        githubUrl: user.githubUrl,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Chat routes - protected
app.use("/api/chat", requireAuth, chatRoutes);

// Favorite ideas routes - protected
app.use("/api/favorites", requireAuth, favoriteIdeaRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
