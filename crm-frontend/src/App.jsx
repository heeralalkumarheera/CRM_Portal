import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';
import PublicLayout from './components/layout/PublicLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import Clients from './pages/clients/Clients';
import ClientDetails from './pages/clients/ClientDetails';
import Leads from './pages/leads/Leads';
import LeadDetails from './pages/leads/LeadDetails';
import Quotations from './pages/quotations/Quotations';
import Invoices from './pages/invoices/Invoices';
import AMC from './pages/amc/AMC';
import Tasks from './pages/tasks/Tasks';
import Expenses from './pages/expenses/Expenses';
import Payments from './pages/payments/Payments';
import CallLogs from './pages/call-logs/CallLogs';
import Calendar from './pages/calendar/Calendar';
import Profile from './pages/profile/Profile';
import Settings from './pages/settings/Settings';
import PortalLogin from './pages/portal/Login';
import Portal from './pages/portal/Portal';

// Loading Component
import Loading from './components/common/Loading';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/portal/login" element={<PortalLogin />} />
      <Route path="/portal" element={<Portal />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <PublicLayout>
              <Login />
            </PublicLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <PublicLayout>
              <Register />
            </PublicLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <PublicLayout>
              <ForgotPassword />
            </PublicLayout>
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Clients */}
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<ClientDetails />} />
        
        {/* Leads */}
        <Route path="leads" element={<Leads />} />
        <Route path="leads/:id" element={<LeadDetails />} />
        
        {/* Quotations */}
        <Route path="quotations" element={<Quotations />} />
        
        {/* Invoices */}
        <Route path="invoices" element={<Invoices />} />
        
        {/* AMC */}
        <Route path="amc" element={<AMC />} />
        
        {/* Tasks */}
        <Route path="tasks" element={<Tasks />} />
        
        {/* Payments */}
        <Route path="payments" element={<Payments />} />
        
        {/* Call Logs */}
        <Route path="call-logs" element={<CallLogs />} />
        
        {/* Calendar */}
        <Route path="calendar" element={<Calendar />} />
        
        {/* Expenses */}
        <Route path="expenses" element={<Expenses />} />
        
        {/* Profile & Settings */}
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
