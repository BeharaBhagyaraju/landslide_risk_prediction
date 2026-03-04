import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Events from './pages/Events';
import AssessmentReport from './pages/AssessmentReport';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public auth routes — no layout wrapper */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes — wrapped in Layout */}
          <Route path="/" element={
            <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute><Layout><History /></Layout></ProtectedRoute>
          } />
          <Route path="/report/:id" element={
            <ProtectedRoute><Layout><AssessmentReport /></Layout></ProtectedRoute>
          } />
          <Route path="/events" element={
            <ProtectedRoute><Layout><Events /></Layout></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
