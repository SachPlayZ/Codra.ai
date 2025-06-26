# Codra AI - GitHub OAuth Authentication

A modern full-stack application with React frontend and Express backend featuring GitHub OAuth authentication.

## 🚀 Features

- **GitHub OAuth Authentication** - Secure login with GitHub
- **React Router** - Client-side routing with protected routes
- **Express API** - RESTful backend with JWT authentication
- **Modern UI** - Beautiful Tailwind CSS design with animations
- **TypeScript** - Full type safety across the stack

## 📁 Project Structure

```
codra-ai/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts (Auth)
│   │   └── App.tsx       # Router setup
│   └── package.json
├── backend/           # Express + Node.js
│   ├── server.js         # Main server file
│   ├── package.json
│   └── .env             # Environment variables
└── README.md
```

## 🛠️ Setup Instructions

### 1. GitHub OAuth Application Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/applications/new)
2. Create a new OAuth App with these settings:
   - **Application name**: `Codra AI` (or your preferred name)
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:5000/auth/github/callback`
3. Save the **Client ID** and **Client Secret**

### 2. Backend Setup

1. Navigate to backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
pnpm install
```

3. Create `.env` file (using the provided script):

```bash
pnpm run setup
# OR manually: cp .env.example .env
```

4. Update `.env` with your GitHub OAuth credentials:

```env
PORT=5000
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

5. If you created the `.env` file manually, generate secure secrets:

```bash
# Generate JWT and Session secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

6. Start the backend server:

```bash
pnpm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

1. Navigate to frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
pnpm install
```

3. Configure environment variables:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME="Codra.AI"
VITE_APP_DESCRIPTION="AI-powered hackathon platform"
NODE_ENV=development
```

4. Start the frontend development server:

```bash
pnpm run dev
```

The frontend will run on `http://localhost:5173`

## 🔗 API Endpoints

### Authentication Routes

- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/github/callback` - GitHub OAuth callback
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user info (protected)

### Protected Routes

- `GET /api/user` - Example protected route

## 🧭 Frontend Routes

- `/` - Landing page
- `/login` - Login page with GitHub OAuth
- `/dashboard` - Protected dashboard (requires authentication)

## 🎯 How to Use

1. **Start both servers** (backend on :5000, frontend on :5173)
2. **Visit** `http://localhost:5173`
3. **Click "Get Started"** to go to login page
4. **Click "Continue with GitHub"** to authenticate
5. **You'll be redirected** to the dashboard after successful login

## 🔐 Authentication Flow

1. User clicks "Continue with GitHub" on login page
2. Frontend redirects to backend `/auth/github` endpoint
3. Backend redirects to GitHub OAuth
4. User authorizes app on GitHub
5. GitHub redirects back to `/auth/github/callback`
6. Backend creates JWT token and sets HTTP-only cookie
7. Backend redirects user to frontend dashboard
8. Frontend checks authentication status and displays dashboard

## 🛡️ Security Features

- **HTTP-only cookies** for JWT storage
- **CORS configuration** between frontend and backend
- **Protected routes** requiring authentication
- **JWT token validation** on API requests
- **Session management** with secure cookies

## 🎨 UI Components

- **Login Page** - Beautiful OAuth login with feature highlights
- **Dashboard** - User dashboard with project management UI
- **Protected Routes** - Automatic redirection for unauthenticated users
- **Loading States** - Smooth loading indicators
- **Responsive Design** - Works on all screen sizes

## 🚀 Deployment Notes

For production deployment:

1. Set `NODE_ENV=production` in backend
2. Update `FRONTEND_URL` to production domain
3. Set `secure: true` for cookies (HTTPS)
4. Update GitHub OAuth callback URL
5. Use environment variables for all secrets

## 🐛 Troubleshooting

**Common Issues:**

1. **"Authentication failed"** - Check GitHub OAuth credentials in `.env`
2. **CORS errors** - Ensure backend `FRONTEND_URL` matches frontend URL (5173)
3. **Cookie not set** - Check if both servers are running on correct ports (backend: 5000, frontend: 5173)
4. **Redirect not working** - Verify GitHub OAuth callback URL matches backend

## 📋 Development Scripts

### Backend

```bash
pnpm run setup  # Generate .env with secure secrets
pnpm run dev    # Start with nodemon (auto-reload)
pnpm start      # Start production server
```

### Frontend

```bash
pnpm run dev    # Start development server
pnpm run build  # Build for production
pnpm run preview # Preview production build
```

### Quick Start (Both Servers)

```bash
./start-dev.sh  # Start both frontend and backend
```

## 📁 Environment Variables

### Backend (.env)

| Variable               | Description                | Example                     |
| ---------------------- | -------------------------- | --------------------------- |
| `PORT`                 | Server port                | `5000`                      |
| `GITHUB_CLIENT_ID`     | GitHub OAuth Client ID     | `your_github_client_id`     |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Client Secret | `your_github_client_secret` |
| `JWT_SECRET`           | JWT signing secret         | `generated_random_string`   |
| `SESSION_SECRET`       | Session signing secret     | `generated_random_string`   |
| `FRONTEND_URL`         | Frontend URL for CORS      | `http://localhost:5173`     |
| `NODE_ENV`             | Environment mode           | `development`               |

### Frontend (.env)

| Variable               | Description      | Example                           |
| ---------------------- | ---------------- | --------------------------------- |
| `VITE_API_BASE_URL`    | Backend API URL  | `http://localhost:5000`           |
| `VITE_APP_NAME`        | Application name | `"Codra.AI"`                      |
| `VITE_APP_DESCRIPTION` | App description  | `"AI-powered hackathon platform"` |
| `NODE_ENV`             | Environment mode | `development`                     |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the authentication flow
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
