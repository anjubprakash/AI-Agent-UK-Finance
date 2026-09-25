import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

// Pages
import { Home } from './pages/Home.jsx';
import { Login } from './pages/Login.jsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.jsx';
import { UploadDocument } from './pages/admin/UploadDocument.jsx';
import { RegulatoryRules } from './pages/admin/RegulatoryRules.jsx';
import { AdminUsers } from './pages/admin/AdminUsers.jsx';
import { CostAnalysis } from './pages/admin/CostAnalysis.jsx';
import { ChatAssistant } from './pages/employee/ChatAssistant.jsx';

export default function App() {
  return (
    <BrowserRouter>
      {/* Global Navbar rendered for everyone with responsive links */}
      <Navbar />

      <Routes>
        {/* Public Landing Home Page */}
        <Route path="/" element={<Home />} />

        {/* Public Login & Registration */}
        <Route path="/login" element={<Login />} />
        <Route path="/register-admin" element={<Navigate to="/login" replace />} />

        {/* Chat Assistant (Open to guests for 2 preview chats, unlimited for logged in users) */}
        <Route path="/chat" element={<ChatAssistant />} />

        {/* History Redirect to Chat */}
        <Route path="/history" element={<Navigate to="/chat" replace />} />

        {/* Admin Protected Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/upload"
          element={
            <ProtectedRoute adminOnly={true}>
              <UploadDocument />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rules"
          element={
            <ProtectedRoute adminOnly={true}>
              <RegulatoryRules />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cost-analysis"
          element={
            <ProtectedRoute adminOnly={true}>
              <CostAnalysis />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/employees" element={<Navigate to="/admin/users" replace />} />

        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
