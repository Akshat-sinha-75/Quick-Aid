import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import NewWound from './pages/NewWound';
import WoundDetail from './pages/WoundDetail';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" />;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
  return user ? <Navigate to="/dashboard" /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<GuestRoute><Landing /></GuestRoute>} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/new-wound" element={<ProtectedRoute><NewWound /></ProtectedRoute>} />
      <Route path="/wounds/:id" element={<ProtectedRoute><WoundDetail /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
