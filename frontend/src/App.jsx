import Landing from './pages/Landing.jsx';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import Login from './pages/Login';
import CVBuilder from './pages/CVBuilder';
import JobFeed from './pages/JobFeed';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/jobs" element={<JobFeed />} />
        <Route path="/cv-builder" element={<CVBuilder />} />
        <Route
          path="/saved-jobs"
          element={<DashboardPlaceholder title="Saved Jobs" description="Keep track of the opportunities you want to come back to." />}
        />
        <Route
          path="/settings"
          element={<DashboardPlaceholder title="Settings" description="Manage your account and job-search preferences." />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/jobs" replace />} />
    </Routes>
  );
}

function DashboardPlaceholder({ title, description }) {
  return (
    <section className="mx-auto max-w-4xl py-10">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-400">Workspace</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-100">{title}</h1>
      <p className="mt-3 text-gray-400">{description}</p>
      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-gray-400">
        This section is coming soon.
      </div>
    </section>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
