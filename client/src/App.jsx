import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/layout/Layout';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Budgets } from './pages/Budgets';
import { Analytics } from './pages/Analytics';
import { AIAdvisor } from './pages/AIAdvisor';
import { Goals } from './pages/Goals';
import { Recurring } from './pages/Recurring';
import { Payments } from './pages/Payments';
import { AdminDashboard } from './pages/AdminDashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Open Route Wrapper (Zero Login Barrier)
const OpenRoute = ({ children }) => {
  return children;
};

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              {/* Optional Login / Register views */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Main Application Cockpit Routes */}
              <Route
                path="/"
                element={
                  <OpenRoute>
                    <Layout />
                  </OpenRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="budgets" element={<Budgets />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="ai-advisor" element={<AIAdvisor />} />
                <Route path="goals" element={<Goals />} />
                <Route path="recurring" element={<Recurring />} />
                <Route path="pricing" element={<Payments />} />

                {/* Admin Cockpit */}
                <Route path="admin" element={<AdminDashboard />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
