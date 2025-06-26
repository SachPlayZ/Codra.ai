#!/usr/bin/env node

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate secure random strings
const generateSecret = () => crypto.randomBytes(32).toString("hex");

// Environment template
const envTemplate = `PORT=5000
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
JWT_SECRET=${generateSecret()}
SESSION_SECRET=${generateSecret()}
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/codra-ai

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
`;

const envPath = path.join(__dirname, "..", ".env");

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log("⚠️  .env file already exists!");
  console.log("Delete it first if you want to regenerate secrets.");
  process.exit(1);
}

// Write .env file
fs.writeFileSync(envPath, envTemplate);

console.log("✅ Created .env file with secure secrets!");
console.log("\n📝 Next steps:");
console.log("1. Go to https://github.com/settings/applications/new");
console.log("2. Create a new OAuth App with:");
console.log("   - Homepage URL: http://localhost:5173");
console.log("   - Callback URL: http://localhost:5000/auth/github/callback");
console.log("3. Copy Client ID and Client Secret to .env file");
console.log(
  "4. Get your Gemini API key from https://makersuite.google.com/app/apikey"
);
console.log("5. Add your Gemini API key to .env file");
console.log("6. Run: npm run dev");
console.log("\n🚀 Happy coding!");
