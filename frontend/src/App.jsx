import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import CVBuilder from './pages/CVBuilder';
import JobFeed from './pages/JobFeed';

function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {currentUser && <Navbar />}
      <div className="flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/cv-builder"
            element={
              <ProtectedRoute>
                <CVBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <JobFeed />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/jobs" replace />} />
        </Routes>
      </div>
    </div>
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
