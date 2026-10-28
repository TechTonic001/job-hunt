import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import CVBuilder from './pages/CVBuilder';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
          <Route path="*" element={<Navigate to="/cv-builder" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
