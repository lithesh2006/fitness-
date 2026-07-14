import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import NutritionCalculator from './pages/NutritionCalculator';
import Workout from './pages/Workout';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Toast from './components/Toast';
import { registerToast } from './utils/toast';

function AppLayout({ user, onLogout }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar user={user} onLogout={onLogout} open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="main-content">
        <Navbar date={date} setDate={setDate} user={user} onLogout={onLogout} setSidebarOpen={setSidebarOpen} />
        <div className="page-content fade-in">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard date={date} />} />
            <Route path="/nutrition" element={<NutritionCalculator date={date} />} />
            <Route path="/workout" element={<Workout date={date} />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  // Register the singleton as soon as addToast is stable
  useEffect(() => {
    registerToast(addToast);
  }, [addToast]);

  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <Route path="/*" element={<AppLayout user={user} onLogout={handleLogout} />} />
        )}
      </Routes>

      <div className="toast-container">
        {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} />)}
      </div>
    </BrowserRouter>
  );
}

export default App;
