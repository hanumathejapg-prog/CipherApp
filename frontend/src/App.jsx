import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import OAuth2Redirect from './pages/OAuth2Redirect';
import Home from './pages/Home';
import { useAuth } from './context/AuthContext';

const Protected = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="auth-page" style={{ gap: '24px' }}>
        <div style={{ fontSize: '24px', color: '#fff' }}>⏳</div>
        <h2 style={{ color: '#fff', margin: 0, textAlign: 'center' }}>Loading your chats...</h2>
      </div>
    );
  }
  
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
      <Route
        path="/home"
        element={
          <Protected>
            <Home />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
