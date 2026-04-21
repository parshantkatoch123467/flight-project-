import React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import UserDashboard from './pages/UserDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import Destinations from './pages/Destinations';
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import Footer from './components/Footer';
import HelpWidget from './components/HelpWidget';
import './index.css';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        ✈️ SmartTransport Global
      </Link>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/destinations">Destinations</Link>
        {token ? (
          <>
            <Link to="/user-dashboard">Travel Booking</Link>
            {user.role === 'admin' && <Link to="/admin-dashboard">Admin Panel</Link>}
            <button className="cta-button" onClick={handleLogout} style={{ padding: '0.4rem 1rem', marginLeft: '1rem' }}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="cta-button">Portal Login</Link>
        )}
      </div>
    </nav>
  );
}

// Protected Route Wrapper
const ProtectedRoute = ({ children, requireAdmin }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/user-dashboard" replace />;

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Navbar />
        <div className="App-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/destinations" element={<Destinations />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminPanel />} />

            {/* Secure Routes */}
            <Route
              path="/user-dashboard"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
        <Footer />
        <HelpWidget />
      </div>
    </BrowserRouter>
  );
}

export default App;