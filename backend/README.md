# Minerva AI Backend

A sophisticated Node.js backend for the Minerva AI platform with GitHub OAuth authentication and intelligent hackathon brainstorming capabilities.

## 🚀 Features

- **GitHub OAuth Authentication** - Secure user authentication
- **AI-Powered Chat** - Gemini-based hackathon brainstorming assistant
- **Agentic AI Structure** - Focused only on hackathon-related topics
- **Chat Session Management** - Persistent chat history and organization
- **Real-time Messaging** - WebSocket-like experience with REST API
- **User Isolation** - Each user only sees their own chats
- **Idea Generation** - Structured JSON output for hackathon ideas
- **Anti-Jailbreak Protection** - Prevents misuse and off-topic requests

## 🧠 Minerva AI Agent

The Minerva AI agent is specifically designed for hackathon brainstorming:

### Core Capabilities

- Project idea generation
- Tech stack recommendations
- Team formation strategies
- Implementation planning
- Feasibility assessment

### Response Modes

1. **Text Mode**: Conversational brainstorming and discussions
2. **Ideas Mode**: Structured JSON output with detailed project ideas

### Idea JSON Format

```json
[
  {
    "Idea Title": "Project Name",
    "Idea Description": "Detailed description",
    "USP": "Unique selling proposition",
    "Tech Stack": "Technologies to use",
    "Target Audience": "Who will use this",
    "Implementation Complexity": "Beginner/Intermediate/Advanced",
    "Estimated Timeline": "Time needed for hackathon",
    "Market Potential": "Commercial viability",
    "Social Impact": "How it helps society"
  }
]
```

## 🛠 Quick Start

1. **Setup Environment**

   ```bash
   pnpm run setup
   ```

2. **Configure Services**

   - **GitHub OAuth**: [Create OAuth App](https://github.com/settings/applications/new)
     - Homepage URL: `http://localhost:5173`
     - Callback URL: `http://localhost:5000/auth/github/callback`
   - **Gemini API**: Get key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Add credentials to `.env` file

3. **Setup MongoDB**

   - See [MONGODB_SETUP.md](../MONGODB_SETUP.md) for detailed instructions
   - Update `MONGODB_URI` in your `.env` file

4. **Install & Start**
   ```bash
   pnpm install
   pnpm run dev
   ```

## 📡 API Endpoints

### Authentication

- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/github/callback` - OAuth callback
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user info

### Chat Sessions

- `GET /api/chat/sessions` - Get user's chat sessions
- `POST /api/chat/sessions` - Create new chat session
- `PUT /api/chat/sessions/:sessionId` - Update session (title, starred, etc.)
- `DELETE /api/chat/sessions/:sessionId` - Delete session and all messages

### Messages

- `GET /api/chat/sessions/:sessionId/messages` - Get messages for a session
- `POST /api/chat/sessions/:sessionId/messages` - Send message and get AI response
- `PATCH /api/chat/messages/:messageId/star` - Star/unstar a message

### Statistics

- `GET /api/chat/stats` - Get user's chat statistics

## 🗄 Database Schema

### ChatSession

- User-specific chat sessions
- Metadata: title, starred, archived status
- Message count and timestamps
- Tags for organization

### ChatMessage

- Individual messages within sessions
- Supports both text and idea modes
- Stores AI response metadata (tokens, processing time)
- Edit history and starring capability

## 🔒 Security Features

- **User Isolation**: All data is user-specific
- **JWT Authentication**: Secure session management
- **Input Validation**: Prevents malicious inputs
- **Rate Limiting**: Protects against abuse
- **Agentic Constraints**: AI refuses non-hackathon topics

## 🌐 Environment Variables

```bash
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Authentication
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
JWT_SECRET=auto_generated_secure_secret
SESSION_SECRET=auto_generated_secure_secret

# Database
MONGODB_URI=mongodb://localhost:27017/codra-ai

# AI Service
GEMINI_API_KEY=your_gemini_api_key
```

## 🏗 Tech Stack

- **Runtime**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: Passport.js (GitHub OAuth) + JWT
- **AI**: Google Gemini Pro
- **Architecture**: RESTful API with ES6 modules

## 🎯 Usage Examples

### Creating a Chat Session

```javascript
POST /api/chat/sessions
{
  "title": "My Hackathon Project",
  "description": "Brainstorming for sustainability hackathon"
}
```

### Sending a Message

```javascript
POST /api/chat/sessions/:sessionId/messages
{
  "content": "I need ideas for a climate tech hackathon",
  "messageMode": "text"
}
```

### Requesting Ideas

```javascript
POST /api/chat/sessions/:sessionId/messages
{
  "content": "Generate 3 project ideas for sustainable tech",
  "messageMode": "text"
}
// AI detects idea request and returns structured JSON
```

## 📚 Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm run dev

# Setup new environment
pnpm run setup
```

---

**Note**: Minerva AI is specifically designed for hackathon brainstorming and will politely decline requests outside this scope.
