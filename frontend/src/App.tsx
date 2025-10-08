import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProfileCreationPage from './pages/ProfileCreationPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import TeamMessagingPage from './pages/TeamMessagingPage';
import GameDetailsPage from './pages/GameDetailsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfileViewPage from './pages/ProfileViewPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import TournamentPage from './pages/TournamentPage';
import TournamentCreationPage from './pages/TournamentCreationPage';
import TournamentDetailsPage from './pages/TournamentDetailsPage';
import TournamentEditPage from './pages/TournamentEditPage';
import TeamInvitePage from './pages/TeamInvitePage';
import { apiService } from './services/api';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = apiService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/team-invite/:teamId" element={<TeamInvitePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/cookies" element={<CookiePolicyPage />} />

        {/* Protected routes */}
        <Route
          path="/profile-creation"
          element={
            <ProtectedRoute>
              <ProfileCreationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/c/:chatId"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/t/:teamId"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team/messages"
          element={
            <ProtectedRoute>
              <TeamMessagingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team/:teamId/messages"
          element={
            <ProtectedRoute>
              <TeamMessagingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games/:name"
          element={
            <ProtectedRoute>
              <GameDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:userId"
          element={
            <ProtectedRoute>
              <ProfileViewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-settings"
          element={
            <ProtectedRoute>
              <AccountSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments"
          element={
            <ProtectedRoute>
              <TournamentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments/create"
          element={
            <ProtectedRoute>
              <TournamentCreationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments/:tournamentId"
          element={
            <ProtectedRoute>
              <TournamentDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments/:tournamentId/edit"
          element={
            <ProtectedRoute>
              <TournamentEditPage />
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
