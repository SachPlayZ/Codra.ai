import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navigation from "./components/Navigation";
import { Home } from "./components/Home";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { Profile } from "./components/Profile";
import { Chat } from "./components/Chat";
import { HackathonDashboard } from "./components/HackathonDashboard";
import { HackathonDetail } from "./components/HackathonDetail";
import { ProjectDetail } from "./components/ProjectDetail";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hackathons"
            element={
              <ProtectedRoute>
                <HackathonDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hackathons/:id"
            element={
              <ProtectedRoute>
                <HackathonDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hackathons/:id/project"
            element={
              <ProtectedRoute>
                <ProjectDetail />
              </ProtectedRoute>
            }
          />
          {/* Fallback route */}
          <Route path="*" element={<Home />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
